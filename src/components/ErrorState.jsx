import { DatabaseZap, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import EmptyState from './EmptyState';

export default function ErrorState({ error, onRetry }) {
  const db = error?.code === 'DB_UNAVAILABLE' || error?.code === 'DB_NOT_SET_UP';
  const net = error?.code === 'NETWORK';
  return (
    <EmptyState
      icon={db ? DatabaseZap : net ? CloudOff : AlertTriangle}
      title={db ? 'We can\'t reach the database' : net ? 'The server isn\'t responding' : 'Something went wrong'}
      message={error?.message || 'Please try again in a moment.'}
      action={onRetry && <button onClick={() => onRetry()} className="btn-ghost"><RefreshCw size={16} /> Try again</button>}
    />
  );
}
