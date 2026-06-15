import React from 'react';
import { useParams, Link } from 'react-router-dom';
import RoomPanel from '../components/RoomPanel/RoomPanel.jsx';
import ConnectionStatus from '../components/ConnectionStatus/ConnectionStatus.jsx';
import ProgressBar from '../components/TransferProgress/ProgressBar.jsx';
import SpeedIndicator from '../components/TransferProgress/SpeedIndicator.jsx';
import FileSummaryCard from '../components/FileSummaryCard/FileSummaryCard.jsx';
import Toast from '../components/Notifications/Toast.jsx';
import useSocket from '../hooks/useSocket.js';

export default function RoomPage() {
  const { roomId } = useParams();
  const { leaveRoom } = useSocket();

  const handleBackToHome = (e) => {
    e.preventDefault();
    leaveRoom(roomId);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          onClick={handleBackToHome}
          className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          &larr; Back to Home
        </Link>
        <ConnectionStatus />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold">Room: <span className="font-mono text-brand-400">{roomId}</span></h1>
          <p className="text-slate-400 text-xs mt-1">Waiting for peer connection to start direct file transfer.</p>
        </div>

        <RoomPanel />

        <FileSummaryCard />

        <div className="space-y-3">
          <ProgressBar />
          <SpeedIndicator />
        </div>
      </div>

      <Toast />
    </div>
  );
}
