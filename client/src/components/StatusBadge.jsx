import React from 'react';

const DOT = ({ className }) => (
  <span className={`w-1.5 h-1.5 rounded-full ${className}`} />
);

export default function StatusBadge({ status }) {
  switch (status) {
    case 'running':
      return <span className="badge-running"><DOT className="bg-brand-400 animate-pulse" />Running</span>;
    case 'deploying':
      return <span className="badge-deploying"><DOT className="bg-yellow-400 animate-pulse" />Deploying</span>;
    case 'failed':
      return <span className="badge-failed"><DOT className="bg-red-400" />Failed</span>;
    case 'crashed':
      return <span className="badge-crashed"><DOT className="bg-orange-400" />Crashed</span>;
    case 'stopped':
      return <span className="badge-stopped"><DOT className="bg-zinc-400" />Stopped</span>;
    default:
      return <span className="badge-stopped"><DOT className="bg-zinc-400" />{status || 'Unknown'}</span>;
  }
}
