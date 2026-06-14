import React from 'react';

export default function Toast() {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex items-center gap-3">
      <div className="text-brand-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium">Scaffolding generated successfully!</p>
        <p className="text-xs text-slate-500 mt-0.5">Welcome to your new P2P file sharing application.</p>
      </div>
    </div>
  );
}
