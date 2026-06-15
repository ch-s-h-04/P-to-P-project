import React from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useTransferStore } from '../../store/transferStore';
import { formatBytes } from '../../utils/formatBytes';

export default function FileSummaryCard() {
  const fileMeta = useRoomStore((s) => s.fileMeta);
  const verified = useTransferStore((s) => s.verified);
  const status = useTransferStore((s) => s.status);

  if (!fileMeta) {
    return (
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-center text-slate-500 text-sm">
        No file selected
      </div>
    );
  }

  const { name, size, type } = fileMeta;

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-200 truncate" title={name}>{name}</p>
          <p className="text-xs text-slate-500 font-mono truncate">
            {formatBytes(size)} | {type || 'Unknown Type'}
          </p>
        </div>
      </div>
      {status === 'completed' && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border flex-shrink-0 ${
          verified === true
            ? 'text-emerald-400 bg-emerald-950/35 border-emerald-900/50'
            : verified === false
            ? 'text-rose-400 bg-rose-950/35 border-rose-900/50'
            : 'text-slate-400 bg-slate-950/35 border-slate-900/50'
        }`}>
          <span>
            {verified === true ? 'Verified' : verified === false ? 'Integrity Mismatch' : 'Completed'}
          </span>
        </div>
      )}
    </div>
  );
}
