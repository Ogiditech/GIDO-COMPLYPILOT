import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldMark } from './Logo';
import ErrorState from './ErrorState';

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="bg-mesh pointer-events-none fixed inset-0 -z-10" />
      <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.6 }}
        className="drop-shadow-[0_0_24px_rgba(45,212,191,0.5)]">
        <ShieldMark size={56} />
      </motion.div>
    </div>
  );
}

export default function RequireAuth({ children }) {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user && error) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="bg-mesh pointer-events-none fixed inset-0 -z-10" />
        <div className="w-full max-w-lg"><ErrorState error={error} onRetry={refresh} /></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
