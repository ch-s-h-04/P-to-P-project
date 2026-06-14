import React from 'react';
import DropZone from '../components/DropZone/DropZone.jsx';
import JoinRoomForm from '../components/JoinRoom/JoinRoomForm.jsx';
import ConnectionStatus from '../components/ConnectionStatus/ConnectionStatus.jsx';

export default function HomePage() {
  return (
    <div className="max-w-md mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
          Share Files Instantly
        </h1>
        <p className="text-slate-400 text-sm">
          No cloud storage. No size limits. Ephemeral peer-to-peer delivery.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Send a File</h2>
          <DropZone />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">Or</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Receive a File</h2>
          <JoinRoomForm />
        </div>
      </div>

      <div className="flex justify-center">
        <ConnectionStatus />
      </div>
    </div>
  );
}
