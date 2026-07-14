import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

export default function BotDetail() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [bot, setBot] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const logRef = useRef(null);

  const fetchBot = useCallback(async () => {
    try {
      const r = await fetch(`/api/bots/${id}`);
      if (!r.ok) { navigate('/dashboard'); return; }
      setBot(await r.json());
    } catch { navigate('/dashboard'); }
  }, [id, navigate]);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const r = await fetch(`/api/bots/${id}/logs`);
      if (r.ok) {
        const data = await r.json();
        setLogs(data);
        setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
      }
    } catch { /* silently ignore */ }
    setLoadingLogs(false);
  }, [id]);

  useEffect(() => {
    fetchBot();
    fetchLogs();
    const interval = setInterval(() => { fetchBot(); fetchLogs(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchBot, fetchLogs]);

  const action = async (path, method = 'POST') => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/bots/${id}/${path}`, { method });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await fetchBot();
      if (path !== 'delete') await fetchLogs();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this bot permanently?')) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/bots/${id}`, { method: 'DELETE' });
      if (r.ok) navigate('/dashboard');
      else { const d = await r.json(); throw new Error(d.error); }
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (!bot) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 flex items-center gap-3 text-zinc-500 text-sm">
        <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-6 -ml-2 text-xs">
        ← Back
      </button>

      {/* Bot header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-white">{bot.display_name || 'BotifyX'}</h1>
            <StatusBadge status={bot.status} />
            <span className="text-xs text-zinc-600 capitalize px-2 py-0.5 rounded bg-zinc-800">{bot.platform}</span>
          </div>
          {bot.app_url && (
            <a href={bot.app_url} target="_blank" rel="noopener noreferrer"
               className="text-brand-400 hover:underline text-xs">
              {bot.app_url}
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn-ghost text-xs"
            onClick={() => action('restart')}
            disabled={busy || bot.status === 'deploying'}
          >
            ↺ Restart
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={fetchLogs}
            disabled={loadingLogs}
          >
            {loadingLogs ? '…' : '↻ Refresh Logs'}
          </button>
          <button className="btn-danger text-xs" onClick={handleDelete} disabled={busy}>
            Delete Bot
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <InfoCard label="Platform" value={bot.platform} />
        <InfoCard label="Status"   value={bot.status} />
        <InfoCard label="Deployed" value={new Date(bot.created_at).toLocaleDateString()} />
        <InfoCard label="Updated"  value={new Date(bot.updated_at).toLocaleDateString()} />
      </div>

      {/* Logs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white text-sm">Logs</h2>
          <span className="text-xs text-zinc-600">{logs.length} lines</span>
        </div>

        <div
          ref={logRef}
          className="bg-zinc-950 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1"
        >
          {logs.length === 0 && (
            <p className="text-zinc-600 italic">
              {loadingLogs ? 'Fetching logs…' : bot.status === 'deploying' ? 'Bot is deploying, logs will appear soon…' : 'No logs yet.'}
            </p>
          )}
          {logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              {log.timestamp && (
                <span className="text-zinc-700 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              )}
              <span className={
                log.severity === 'ERROR' || log.message?.toLowerCase().includes('error')
                  ? 'text-red-400'
                  : log.message?.toLowerCase().includes('warn')
                  ? 'text-yellow-400'
                  : ''
              }>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-800">
      <p className="text-zinc-600 text-xs mb-1">{label}</p>
      <p className="text-zinc-200 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
