import React from 'react';

export default function ProgressBar() {
  const percent = 45; // Placeholder progress value

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Transfer Progress</span>
        <span className="font-semibold text-brand-400">{percent}%</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
