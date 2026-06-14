import { create } from 'zustand';

export const useTransferStore = create((set) => ({
  status: 'idle', // 'idle' | 'hashing' | 'transferring' | 'verifying' | 'completed' | 'failed'
  bytesTransferred: 0,
  totalBytes: 0,
  progressPercent: 0,
  speedBps: 0,
  etaSeconds: 0,
  localHash: null,
  remoteHash: null,
  verified: null, // true | false | null

  setStatus: (status) => set({ status }),
  setBytesTransferred: (bytes) => set({ bytesTransferred: bytes }),
  setTotalBytes: (bytes) => set({ totalBytes: bytes }),
  setProgressPercent: (percent) => set({ progressPercent: percent }),
  setSpeedBps: (speed) => set({ speedBps: speed }),
  setEtaSeconds: (eta) => set({ etaSeconds: eta }),
  setLocalHash: (hash) => set({ localHash: hash }),
  setRemoteHash: (hash) => set({ remoteHash: hash }),
  setVerified: (verified) => set({ verified }),
  resetTransfer: () => set({
    status: 'idle',
    bytesTransferred: 0,
    totalBytes: 0,
    progressPercent: 0,
    speedBps: 0,
    etaSeconds: 0,
    localHash: null,
    remoteHash: null,
    verified: null,
  }),
}));
