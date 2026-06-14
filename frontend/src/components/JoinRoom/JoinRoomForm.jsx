import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinRoomForm() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  return (
    <form onSubmit={handleJoin} className="flex gap-2">
      <input
        type="text"
        placeholder="Enter 21-character room code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="flex-grow px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm transition-colors"
      />
      <button
        type="submit"
        disabled={!roomId.trim()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium transition-all"
      >
        Join Room
      </button>
    </form>
  );
}
