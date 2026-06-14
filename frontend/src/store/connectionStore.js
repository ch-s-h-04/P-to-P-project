import { create } from 'zustand';

export const useConnectionStore = create((set) => ({
  socketStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
  peerConnectionState: 'new', // 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'
  iceConnectionState: 'new',
  dataChannelState: 'closed', // 'connecting' | 'open' | 'closing' | 'closed'
  
  setSocketStatus: (status) => set({ socketStatus: status }),
  setPeerConnectionState: (state) => set({ peerConnectionState: state }),
  setIceConnectionState: (state) => set({ iceConnectionState: state }),
  setDataChannelState: (state) => set({ dataChannelState: state }),
}));
