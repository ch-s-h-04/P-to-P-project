import { create } from 'zustand';

const savedRoomId = sessionStorage.getItem('p2p_room_id');
const savedRole = sessionStorage.getItem('p2p_role');

export const useRoomStore = create((set) => ({
  roomId: savedRoomId || null,
  role: savedRole || null, // 'sender' | 'receiver' | null
  peerPresent: false,
  fileMeta: null, // { name, size, type }
  file: null, // Raw File object reference for sender

  setRoomId: (id) => {
    if (id) sessionStorage.setItem('p2p_room_id', id);
    else sessionStorage.removeItem('p2p_room_id');
    set({ roomId: id });
  },
  setRole: (role) => {
    if (role) sessionStorage.setItem('p2p_role', role);
    else sessionStorage.removeItem('p2p_role');
    set({ role });
  },
  setPeerPresent: (present) => set({ peerPresent: present }),
  setFileMeta: (meta) => set({ fileMeta: meta }),
  setFile: (file) => set({ file }),
  resetRoom: () => {
    sessionStorage.removeItem('p2p_room_id');
    sessionStorage.removeItem('p2p_role');
    set({ roomId: null, role: null, peerPresent: false, fileMeta: null, file: null });
  },
}));
