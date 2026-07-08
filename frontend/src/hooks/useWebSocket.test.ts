import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../features/auth/store/authStore';

// Must mock BEFORE the module is imported — vi.mock is hoisted
vi.mock('../lib/mockApi', () => ({
  isMockModeActive: () => false,
}));

// Track latest ws instance so we can simulate server events
let lastWsInstance: MockWebSocket | null = null;

class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState: number = WebSocket.CONNECTING;
  close = vi.fn(() => {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  });
  send = vi.fn();

  constructor(public url: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastWsInstance = this;
  }

  // Helper: simulate server accepting connection
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.onopen?.();
  }
}

// Assign mock before tests run
Object.defineProperty(globalThis, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastWsInstance = null;
    useAuthStore.setState({ accessToken: 'mock-token' });
  });

  it('starts disconnected, then connects after server handshake', async () => {
    const onMessage = vi.fn();
    const { result, unmount } = renderHook(() =>
      useWebSocket('test-model', onMessage),
    );

    // Initially disconnected
    expect(result.current.isConnected).toBe(false);

    // Simulate the server accepting the connection
    await act(async () => {
      lastWsInstance?.simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);

    unmount();
  });

  it('stays disconnected when modelId is null', () => {
    const { result, unmount } = renderHook(() => useWebSocket(null));
    expect(result.current.isConnected).toBe(false);
    expect(lastWsInstance).toBeNull();
    unmount();
  });
});
