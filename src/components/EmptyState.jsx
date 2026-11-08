import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/15 px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-teal-400/20 text-teal-400 ring-1 ring-teal-400/20">
        <Icon size={26} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
