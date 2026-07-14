import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Landing() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide uppercase">
          ⚡ WhatsApp Bot Platform
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5 max-w-2xl">
          Deploy <span className="text-brand-400">BotifyX</span><br />in seconds
        </h1>

        <p className="text-zinc-400 text-lg max-w-lg mb-10 leading-relaxed">
          Sign in with Google, paste your session ID, pick a platform — your WhatsApp bot
          is live. No servers, no config, no headaches.
        </p>

        <a
          href="/auth/google"
          className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-all duration-150 active:scale-95 text-sm shadow-lg"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p className="mt-6 text-zinc-600 text-xs">
          Free to try · No credit card required
        </p>
      </main>

      {/* Feature strip */}
      <div className="border-t border-zinc-800 py-8 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🚀', title: 'One-click deploy', desc: 'Railway or Heroku — pick one and go.' },
            { icon: '📊', title: 'Live dashboard', desc: 'Status, logs, restart — all in one place.' },
            { icon: '🔒', title: 'Your session, your bot', desc: 'Session ID stays on the platform, never shared.' },
          ].map(f => (
            <div key={f.title} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-zinc-200 text-sm">{f.title}</p>
              <p className="text-zinc-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
