import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const STEPS = ['platform', 'session', 'confirm'];

export default function Deploy() {
  const navigate      = useNavigate();
  const { config }    = useAuth();
  const [step, setStep]             = useState(0);
  const [platform, setPlatform]     = useState(null);
  const [sessionId, setSessionId]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const portalUrl = config?.portalUrl;

  const deploy = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, sessionId: sessionId.trim(), displayName }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Deployment failed.');
      navigate('/dashboard');
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-6 -ml-2 text-xs">
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Deploy BotifyX</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Follow the steps — your bot will be live in ~1 minute.
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {['Choose Platform', 'Session ID', 'Deploy'].map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 text-xs font-medium ${i <= step ? 'text-brand-400' : 'text-zinc-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border
                ${i < step ? 'bg-brand-500 border-brand-500 text-white'
                  : i === step ? 'border-brand-500 text-brand-400'
                  : 'border-zinc-700 text-zinc-600'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px ${i < step ? 'bg-brand-500' : 'bg-zinc-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Platform */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-zinc-300 text-sm font-medium mb-4">Where should your bot run?</p>
          {[
            { id: 'railway', label: 'Railway', desc: 'Free tier available · Fast cold starts · Recommended', icon: '🚂' },
            { id: 'heroku',  label: 'Heroku',  desc: 'Reliable · Free tier available with Eco dynos', icon: '🟪' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => { setPlatform(p.id); setStep(1); }}
              className={`w-full card text-left flex items-center gap-4 hover:border-brand-500/50 transition-all
                ${platform === p.id ? 'border-brand-500/60 bg-brand-500/5' : ''}`}
            >
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{p.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{p.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 1: Session ID */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="card bg-brand-500/5 border-brand-500/20">
            <p className="text-sm text-brand-300 font-medium mb-1">You need a Session ID first</p>
            <p className="text-zinc-400 text-xs mb-3">
              Visit the BotifyX Portal, enter your WhatsApp number, follow the pairing steps, and copy the <code className="text-brand-300 bg-zinc-800 px-1 py-0.5 rounded text-xs">BOTIFY-X=…</code> string it gives you.
            </p>
            {portalUrl ? (
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
                Open Portal ↗
              </a>
            ) : (
              <p className="text-zinc-500 text-xs italic">Portal URL not configured. Contact the platform admin.</p>
            )}
          </div>

          <div>
            <label className="label">Session ID</label>
            <textarea
              className="input font-mono text-xs resize-none h-24"
              placeholder="BOTIFY-X=..."
              value={sessionId}
              onChange={e => setSessionId(e.target.value)}
            />
            {sessionId && !sessionId.trim().startsWith('BOTIFY-X=') && (
              <p className="text-red-400 text-xs mt-1">Must start with <code>BOTIFY-X=</code></p>
            )}
          </div>

          <div>
            <label className="label">Bot Name <span className="text-zinc-600 font-normal">(optional)</span></label>
            <input
              className="input"
              placeholder="e.g. My WhatsApp Bot"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-ghost flex-1">Back</button>
            <button
              className="btn-primary flex-1"
              disabled={!sessionId.trim().startsWith('BOTIFY-X=')}
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm + Deploy */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="card space-y-3">
            <p className="text-sm font-semibold text-white mb-1">Confirm deployment</p>
            <Row label="Bot" value="BotifyX" />
            <Row label="Platform" value={platform === 'railway' ? '🚂 Railway' : '🟪 Heroku'} />
            <Row label="Name" value={displayName || 'BotifyX (default)'} />
            <Row label="Session ID" value={`${sessionId.slice(0, 18)}…`} mono />
          </div>

          <div className="card bg-zinc-800/50 border-zinc-700">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Clicking <strong className="text-zinc-200">Deploy</strong> will create a new instance on{' '}
              <strong className="text-zinc-200">{platform}</strong> under the platform account and start your bot.
              This usually takes 1–2 minutes. You can monitor progress from the dashboard.
            </p>
          </div>

          {error && (
            <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost flex-1" disabled={loading}>
              Back
            </button>
            <button className="btn-primary flex-1" onClick={deploy} disabled={loading}>
              {loading
                ? <><Spinner /> Deploying…</>
                : '🚀 Deploy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className={`text-zinc-200 text-xs ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}
