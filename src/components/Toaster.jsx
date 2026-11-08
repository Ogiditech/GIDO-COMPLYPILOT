import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE = { success: 'text-teal-400', error: 'text-rose-400', info: 'text-indigo-400' };

export default function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.type] || Info;
          return (
            <motion.div key={t.id} layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 !bg-surface p-3.5 pr-2" role="status">
              <Icon size={20} className={`mt-0.5 shrink-0 ${TONE[t.type]}`} />
              <p className="flex-1 text-sm">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="rounded p-1 text-muted hover:text-ink" aria-label="Dismiss"><X size={14} /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
