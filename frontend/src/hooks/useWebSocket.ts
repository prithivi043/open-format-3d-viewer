import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../features/auth/store/authStore";
import { isMockModeActive } from "../lib/mockApi";

export type WSEvent =
  | "MODEL_READY"
  | "MODEL_FAILED"
  | "MODEL_PROCESSING"
  | "ANNOTATION_CREATED"
  | "ANNOTATION_UPDATED"
  | "USER_JOINED"
  | "USER_LEFT"
  | "CURSOR_MOVED"
  | "PONG";

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
  const token = useAuthStore((s) => s.accessToken) || "mock-token";

  // Build the WS URL based on VITE_API_BASE_URL or default
  const getWsUrl = useCallback(() => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL ||
      "https://open-format-3d-viewer.onrender.com/v1";
    try {
      const url = new URL(apiBase);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/connect";
      url.searchParams.set("token", token);
      return url.toString();
    } catch {
      return `wss://open-format-3d-viewer.onrender.com/connect?token=${token}`;
    }
  }, [token]);

  const connectRef = useRef<(() => void) | undefined>(undefined);

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
    if (!modelId) return;

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
        // Send join model
        ws.send(JSON.stringify({ event: "JOIN_MODEL", data: { model_id: modelId } }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WSMessage;
          if (onMessageReceived) {
            onMessageReceived(parsed.event, parsed.data);
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
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
  }, [modelId, getWsUrl, onMessageReceived, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN && modelId) {
        socketRef.current.send(
          JSON.stringify({ event: "LEAVE_MODEL", data: { model_id: modelId } }),
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
      socketRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  // Connect on mount/modelId change
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect on focus
  useEffect(() => {
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
  }, [isConnected, connect]);

  return {
    isConnected,
    sendMessage,
  };
}
