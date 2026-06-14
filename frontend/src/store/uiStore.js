import { create } from 'zustand';

export const useUiStore = create((set) => ({
  toasts: [], // Array of { id, type: 'info'|'error'|'success', message }

  addToast: (message, type = 'info') => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), type, message }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
