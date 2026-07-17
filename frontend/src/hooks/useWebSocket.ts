import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../features/auth/store/authStore";
import { isMockModeActive } from "../lib/mockApi";

export type WSEvent =
  | "MODEL_READY"
  | "MODEL_FAILED"
  | "MODEL_PROCESSING"
  | "MODEL_PROGRESS"
  | "ANNOTATION_CREATED"
  | "ANNOTATION_UPDATED"
  | "ANNOTATION_DELETED"
  | "USER_JOINED"
  | "USER_LEFT"
  | "CURSOR_MOVED"
  | "MODEL_SYNC"
  | "PONG"
  | "ERROR";

export interface WSMessage {
  event: WSEvent;
  data: unknown;
}

export function useWebSocket(
  modelId: string | null,
  onMessageReceived?: (event: WSEvent, data: unknown) => void,
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useAuthStore((s) => s.accessToken);

  // Never attempt a WebSocket connection for local model files (local- prefix)
  // or when we have no real auth token — both will be rejected by the server
  // and would cause an infinite reconnect flood in the console.
  const isLocalModel = Boolean(modelId && modelId.startsWith("local-"));
  const shouldConnect = Boolean(modelId) && Boolean(token) && !isLocalModel;

  // Build the WS URL based on VITE_API_BASE_URL or default.
  // Note: JWT token is now sent securely in the JOIN_MODEL message payload, not the URL
  const getWsUrl = useCallback(() => {
    // Detect localhost and point directly to port 8001 (Fastify ws-server)
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `ws://localhost:8001/connect?model_id=${modelId || ""}`;
    }

    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      "https://open-format-3d-viewer.onrender.com";
    try {
      const url = new URL(apiBase);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/connect";
      if (modelId) {
        url.searchParams.set("model_id", modelId);
      }
      return url.toString();
    } catch {
      return `wss://open-format-3d-viewer.onrender.com/connect?model_id=${modelId || ""}`;
    }
  }, [modelId]);

  const connectRef = useRef<(() => void) | undefined>(undefined);
  const intentionalCloseRef = useRef(false);

  const onMessageReceivedRef = useRef(onMessageReceived);
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      // Exponential backoff capped at 30s
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
      connectRef.current?.();
    }, reconnectDelayRef.current);
  }, []);

  const connect = useCallback(() => {
    if (!shouldConnect) return;

    if (isMockModeActive()) {
      Promise.resolve().then(() => {
        setIsConnected(true);
      });
      return;
    }

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.CONNECTING ||
        socketRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // Reset backoff
        // Send join model flat format per PRD, securely including token
        ws.send(JSON.stringify({ event: "JOIN_MODEL", model_id: modelId, token }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          let eventName = parsed.event;

          // Automatically respond to server PING with PONG
          if (eventName === "PING") {
            ws.send(JSON.stringify({ event: "PONG" }));
            return;
          }

          // Normalize events from backend payload format
          if (eventName === "user:join") {
            eventName = "USER_JOINED";
          } else if (eventName === "user:leave") {
            eventName = "USER_LEFT";
          } else if (eventName === "CURSOR_MOVE") {
            eventName = "CURSOR_MOVED";
          }

          if (onMessageReceivedRef.current) {
            onMessageReceivedRef.current(eventName as WSEvent, parsed);
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (intentionalCloseRef.current) return;
        
        // Handle explicit auth failures (4001) or other terminal errors
        if (event.code === 4001) {
          console.error("WebSocket auth failed (4001). Logging out...");
          useAuthStore.getState().logout();
          return;
        }
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    } catch (err) {
      console.error("Failed to initiate WebSocket connection:", err);
      scheduleReconnect();
    }
  }, [shouldConnect, getWsUrl, scheduleReconnect, token, modelId]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN && modelId) {
        socketRef.current.send(
          JSON.stringify({ event: "LEAVE_MODEL", model_id: modelId }),
        );
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, [modelId]);

  const sendMessage = useCallback((event: string, data: unknown) => {
    if (isMockModeActive()) {
      return;
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // If flat format is required for message types (e.g. CURSOR_MOVE)
      if (event === "CURSOR_MOVE") {
        const payload = data as Record<string, unknown>;
        socketRef.current.send(
          JSON.stringify({
            event,
            model_id: modelId,
            position: payload.position,
            normal: payload.normal,
          }),
        );
      } else {
        socketRef.current.send(JSON.stringify({ event, data }));
      }
    }
  }, [modelId]);

  // Connect on mount / shouldConnect change; clean up on unmount
  useEffect(() => {
    if (!shouldConnect) return;
    intentionalCloseRef.current = false;
    connect();
    return () => {
      disconnect();
    };
  }, [shouldConnect, connect, disconnect]);

  // Client-initiated heartbeat
  useEffect(() => {
    if (!isConnected || isMockModeActive()) return;
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ event: "PING" }));
      }
    }, 25000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Reconnect on window focus (only when connection is expected)
  useEffect(() => {
    if (!shouldConnect) return;
    const handleFocus = () => {
      if (!isConnected) {
        reconnectDelayRef.current = 1000;
        connect();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [shouldConnect, isConnected, connect]);

  return {
    isConnected,
    sendMessage,
  };
}
