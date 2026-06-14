import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  roomId: null,
  role: null, // 'sender' | 'receiver' | null
  peerPresent: false,
  fileMeta: null, // { name, size, type }

  setRoomId: (id) => set({ roomId: id }),
  setRole: (role) => set({ role }),
  setPeerPresent: (present) => set({ peerPresent: present }),
  setFileMeta: (meta) => set({ fileMeta: meta }),
  resetRoom: () => set({ roomId: null, role: null, peerPresent: false, fileMeta: null }),
}));
