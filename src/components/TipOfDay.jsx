import { Lightbulb, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tips } from '../data/constants';

export default function TipOfDay() {
  const [i, setI] = useState(() => new Date().getDate() % tips.length);
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">
          <Lightbulb size={14} /> Compliance tip of the day
        </div>
        <button onClick={() => setI((x) => (x + 1) % tips.length)} className="-m-2 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-line/10 hover:text-ink sm:m-0 sm:h-auto sm:w-auto sm:p-1.5" aria-label="Next tip">
          <RefreshCw size={14} />
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm leading-relaxed">
          {tips[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
