import React, { useState, useEffect } from 'react';
import useSocket from '../../hooks/useSocket';
import { useRoomStore } from '../../store/roomStore';
export default function JoinRoomForm() {
  const [input, setInput] = useState('');
  const { joinRoom } = useSocket();
  const roomId = useRoomStore((s) => s.roomId);
  const role   = useRoomStore((s) => s.role);

  // Navigation is handled inside useSocket's onRoomJoined handler.
  // This effect is a safety net: if the store updates but navigate
  // already fired (e.g. StrictMode double-invoke), nothing breaks.
  useEffect(() => {
    if (roomId && role === 'receiver') {
      // Already navigated by useSocket; nothing extra needed here.
    }
  }, [roomId, role]);

  const handleJoin = () => {
  const trimmed = input.trim();

  console.log('Join button clicked');
  console.log('Room ID:', trimmed);

  if (!trimmed) return;

  joinRoom(trimmed);
};

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Enter 21-character room code"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
      />
      <button
        onClick={handleJoin}
        disabled={!input.trim()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium transition-all"
      >
        Join Room
      </button>
    </div>
  );
}
