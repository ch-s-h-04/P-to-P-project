import React from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { useRoomStore } from '../../store/roomStore';

export default function ConnectionStatus() {
  const socketStatus = useConnectionStore((s) => s.socketStatus);
  const peerConnectionState = useConnectionStore((s) => s.peerConnectionState);
  const dataChannelState = useConnectionStore((s) => s.dataChannelState);
  const peerPresent = useRoomStore((s) => s.peerPresent);

  // Helper to map socket status
  const getSocketDetails = () => {
    switch (socketStatus) {
      case 'connected':
        return { label: 'Signaling: Connected', color: 'bg-emerald-500' };
      case 'connecting':
        return { label: 'Signaling: Connecting', color: 'bg-yellow-500' };
      default:
        return { label: 'Signaling: Offline', color: 'bg-rose-500' };
    }
  };

  // Helper to map peer connection status
  const getPeerDetails = () => {
    switch (peerConnectionState) {
      case 'connected':
        return { label: 'Peer: Connected', color: 'bg-emerald-500' };
      case 'connecting':
        return { label: 'Peer: Connecting', color: 'bg-yellow-500' };
      case 'failed':
        return { label: 'Peer: Failed', color: 'bg-rose-500' };
      case 'disconnected':
        return { label: 'Peer: Disconnected', color: 'bg-yellow-500' };
      default:
        return peerPresent 
          ? { label: 'Peer: Present', color: 'bg-yellow-500' }
          : { label: 'Peer: Waiting', color: 'bg-slate-600' };
    }
  };

  // Helper to map data channel status
  const getDataChannelDetails = () => {
    switch (dataChannelState) {
      case 'open':
        return { label: 'DataChannel: Open', color: 'bg-emerald-500' };
      case 'connecting':
        return { label: 'DataChannel: Connecting', color: 'bg-yellow-500' };
      case 'closing':
        return { label: 'DataChannel: Closing', color: 'bg-yellow-500' };
      default:
        return { label: 'DataChannel: Closed', color: 'bg-slate-600' };
    }
  };

  const socketDetails = getSocketDetails();
  const peerDetails = getPeerDetails();
  const dcDetails = getDataChannelDetails();

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className={`w-1.5 h-1.5 rounded-full ${socketDetails.color}`}></span>
        {socketDetails.label}
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className={`w-1.5 h-1.5 rounded-full ${peerDetails.color}`}></span>
        {peerDetails.label}
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className={`w-1.5 h-1.5 rounded-full ${dcDetails.color}`}></span>
        {dcDetails.label}
      </span>
    </div>
  );
}
