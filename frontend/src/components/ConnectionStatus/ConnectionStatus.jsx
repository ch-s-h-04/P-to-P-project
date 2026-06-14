import React from 'react';

export default function ConnectionStatus() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Signaling: Ready
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
        Peer: Disconnected
      </span>
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
        DataChannel: Closed
      </span>
    </div>
  );
}
