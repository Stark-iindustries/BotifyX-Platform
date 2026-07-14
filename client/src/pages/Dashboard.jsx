import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { user }       = useAuth();
  const navigate        = useNavigate();
  const [bots, setBots] = useState(null);
  const [error, setError] = useState(null);

  const fetchBots = useCallback(async () => {
    try {
      const r = await fetch('/api/bots');
      if (!r.ok) throw new Error('Failed to load bots');
      setBots(await r.json());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchBots();
    // Poll every 8s while any bot is deploying
    const interval = setInterval(fetchBots, 8000);
    return () => clearInterval(interval);
  }, [fetchBots]);

  const hasBot = bots && bots.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-500 text-sm">
            {hasBot ? 'Your bot is deployed and managed below.' : 'No bot deployed yet.'}
          </p>
        </div>

        {!hasBot && (
          <button
            onClick={() => navigate('/deploy')}
            className="btn-primary"
          >
            + Deploy Bot
          </button>
        )}
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {bots === null && (
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      )}

      {bots?.length === 0 && (
        <EmptyState onDeploy={() => navigate('/deploy')} />
      )}

      {bots?.map(bot => (
        <BotCard key={bot.id} bot={bot} onRefresh={fetchBots} />
      ))}
    </div>
  );
}

function BotCard({ bot, onRefresh }) {
  const navigate    = useNavigate();
  const [busy, setBusy] = useState(false);

  const action = async (path, method = 'POST') => {
    setBusy(true);
    try {
      await fetch(`/api/bots/${bot.id}/${path}`, { method });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this bot and remove it from the platform? This cannot be undone.')) return;
    setBusy(true);
    try {
      await fetch(`/api/bots/${bot.id}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 text-lg flex-shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-white text-sm">{bot.display_name || 'BotifyX'}</span>
              <StatusBadge status={bot.status} />
              <span className="text-xs text-zinc-600 capitalize px-2 py-0.5 rounded bg-zinc-800">
                {bot.platform}
              </span>
            </div>
            <p className="text-zinc-500 text-xs">
              Deployed {new Date(bot.created_at).toLocaleDateString()}
              {bot.app_url && (
                <> · <a href={bot.app_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">{bot.app_url}</a></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn-ghost text-xs"
            onClick={() => navigate(`/bots/${bot.id}`)}
          >
            Logs & Details
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => action('restart')}
            disabled={busy || bot.status === 'deploying'}
          >
            Restart
          </button>
          <button
            className="btn-danger text-xs"
            onClick={handleDelete}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onDeploy }) {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl mb-4">
        🤖
      </div>
      <h2 className="font-semibold text-white mb-2">No bot deployed</h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs">
        Deploy BotifyX and your WhatsApp bot will be live in about a minute.
      </p>
      <button className="btn-primary" onClick={onDeploy}>
        Deploy BotifyX
      </button>
    </div>
  );
}
