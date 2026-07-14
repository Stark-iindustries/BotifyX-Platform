import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="text-brand-500 font-bold text-xl">⚡</span>
          <span className="font-bold text-white tracking-tight">BotifyX</span>
          <span className="text-zinc-500 text-xs font-medium px-1.5 py-0.5 bg-zinc-800 rounded">Platform</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {user.avatar && (
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full ring-2 ring-zinc-700" />
                )}
                <span className="text-sm text-zinc-400">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-xs">
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
