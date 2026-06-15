import { io } from 'socket.io-client';
import { useConnectionStore } from '../store/connectionStore';

let socket = null;

export const signalingClient = {
  connect(url) {
    if (socket?.connected) return;

    useConnectionStore.getState().setSocketStatus('connecting');

    socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[signaling] Connected:', socket.id);
      useConnectionStore.getState().setSocketStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[signaling] Disconnected:', reason);
      useConnectionStore.getState().setSocketStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[signaling] Connection error:', err.message);
      useConnectionStore.getState().setSocketStatus('disconnected');
    });
  },

  disconnect() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
    useConnectionStore.getState().setSocketStatus('disconnected');
  },

  emit(event, payload) {
    console.log('[EMIT]', event, payload);

    if (!socket?.connected) {
      console.warn(`[signaling] Cannot emit "${event}" — socket not connected`);
      return;
    }

    socket.emit(event, payload);
  },

  on(event, callback) {
    if (!socket) {
      console.warn(`[signaling] Cannot register "${event}" — socket not initialized`);
      return;
    }
    socket.on(event, callback);
  },

  off(event, callback) {
    if (!socket) return;
    callback ? socket.off(event, callback) : socket.off(event);
  },

  isConnected() {
    return socket?.connected ?? false;
  },
};
