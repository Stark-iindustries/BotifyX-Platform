import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Landing() {
  const { user, setUser } = useAuth();
  const navigate           = useNavigate();
  const [tab, setTab]      = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">
      {/* Left — branding */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-8 py-16 text-center lg:text-left lg:items-start">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide uppercase">
          ⚡ WhatsApp Bot Platform
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4 max-w-md">
          Deploy <span className="text-brand-400">BotifyX</span> in seconds
        </h1>

        <p className="text-zinc-400 text-base max-w-sm mb-8 leading-relaxed">
          Create an account, paste your session ID, pick a platform — your WhatsApp bot is live.
          No servers, no config.
        </p>

        <div className="flex flex-col gap-3 text-sm text-zinc-500">
          {['🚀 Railway or Heroku deployment', '📊 Live logs and bot controls', '🔒 Secure session handling', '⚡ 1-minute setup'].map(f => (
            <div key={f} className="flex items-center gap-2">{f}</div>
          ))}
        </div>
      </div>

      {/* Right — auth forms */}
      <div className="lg:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {tab === 'login'
            ? <LoginForm setUser={setUser} navigate={navigate} setTab={setTab} />
            : <RegisterForm setUser={setUser} navigate={navigate} setTab={setTab} />
          }

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Google */}
          <a
            href="/auth/google"
            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 bg-white hover:bg-zinc-100
                       text-zinc-900 font-semibold rounded-xl transition-all duration-150 active:scale-95 text-sm"
          >
            <GoogleIcon />
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ setUser, navigate, setTab }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setUser(data);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          type="email" className="input" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password" className="input" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)} required
        />
      </div>

      {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? <Spinner /> : 'Sign In'}
      </button>

      <p className="text-center text-xs text-zinc-600">
        No account?{' '}
        <button type="button" onClick={() => setTab('register')} className="text-brand-400 hover:underline">
          Create one
        </button>
      </p>
    </form>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ setUser, navigate, setTab }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const r = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setUser(data);
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input
          type="text" className="input" placeholder="Tony Stark"
          value={name} onChange={e => setName(e.target.value)} required
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          type="email" className="input" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password" className="input" placeholder="Min. 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} required
        />
      </div>
      <div>
        <label className="label">Confirm Password</label>
        <input
          type="password" className="input" placeholder="••••••••"
          value={confirm} onChange={e => setConfirm(e.target.value)} required
        />
      </div>

      {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        {loading ? <Spinner /> : 'Create Account'}
      </button>

      <p className="text-center text-xs text-zinc-600">
        Already have one?{' '}
        <button type="button" onClick={() => setTab('login')} className="text-brand-400 hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
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
