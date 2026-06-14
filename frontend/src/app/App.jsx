import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
              P2P Web Share
            </span>
          </div>
          <nav className="text-sm text-slate-400">
            Secure browser-to-browser transfer
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        <RouterProvider router={router} />
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} P2P Web Share. Direct. Ephemeral. Encrypted.</p>
      </footer>
    </div>
  );
}
