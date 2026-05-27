import { io, Socket } from 'socket.io-client';

// ── Singleton Socket.IO client ────────────────────────────────────────────────
//
// Keeps a single persistent connection to the /orders namespace.
// Call getSocket() anywhere; call disconnectSocket() on app unmount.

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const WS_URL =
      process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3001';
    const NS =
      process.env.EXPO_PUBLIC_WS_NAMESPACE ?? '/orders';

    socket = io(`${WS_URL}${NS}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });

    if (__DEV__) {
      socket.on('connect',    () => console.log('[WS] connected  ', socket?.id));
      socket.on('disconnect', () => console.log('[WS] disconnected'));
      socket.on('connect_error', (e) => console.warn('[WS] error', e.message));
    }
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Whether the singleton is currently connected */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
