import React from 'react';

export default function RoomPanel() {
  const roomUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Share this link with receiver</p>
          <p className="text-sm font-mono text-slate-300 break-all select-all">{roomUrl}</p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-900/30"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
