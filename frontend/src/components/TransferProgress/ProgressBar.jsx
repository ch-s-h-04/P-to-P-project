import React from 'react';
import { useTransferStore } from '../../store/transferStore';

export default function ProgressBar() {
  const percent = useTransferStore((s) => s.progressPercent);
  const status = useTransferStore((s) => s.status);

  // Helper to map status to label
  const getStatusLabel = () => {
    switch (status) {
      case 'hashing':
        return 'Calculating File Hash...';
      case 'transferring':
        return 'Transferring File...';
      case 'verifying':
        return 'Verifying Integrity...';
      case 'completed':
        return 'Transfer Completed';
      case 'failed':
        return 'Transfer Failed';
      default:
        return 'Transfer Progress';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{getStatusLabel()}</span>
        <span className="font-semibold text-brand-400">{percent}%</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'failed' 
              ? 'bg-rose-500' 
              : status === 'completed' 
              ? 'bg-emerald-500' 
              : 'bg-gradient-to-r from-brand-500 to-indigo-500'
          }`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
