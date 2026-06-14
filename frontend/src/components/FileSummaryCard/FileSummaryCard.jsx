import React from 'react';

export default function FileSummaryCard() {
  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">example_video.mp4</p>
          <p className="text-xs text-slate-500 font-mono">145.2 MB | video/mp4</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/35 border border-emerald-900/50 px-2 py-1 rounded-lg">
        <span>Verified</span>
      </div>
    </div>
  );
}
