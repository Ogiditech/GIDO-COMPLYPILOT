const STATUS = {
  Active: 'bg-teal-400/15 text-teal-600 dark:text-teal-300 ring-1 ring-teal-400/30',
  Draft: 'bg-slate-400/15 text-muted ring-1 ring-slate-400/30',
  'Under Review': 'bg-amber-400/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30',
  Expired: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30',
  Open: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30',
  Mitigated: 'bg-amber-400/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30',
  Closed: 'bg-teal-400/15 text-teal-600 dark:text-teal-300 ring-1 ring-teal-400/30',
};

export function StatusBadge({ status }) {
  return (
    <span className={`chip ${STATUS[status] || STATUS.Draft}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function FrameworkBadge({ framework }) {
  return (
    <span className="chip bg-indigo-500/15 text-indigo-600 ring-1 ring-indigo-500/30 dark:text-indigo-300">
      {framework}
    </span>
  );
}

export function riskLevel(score) {
  if (score >= 15) return { label: 'Critical', cls: 'bg-rose-500 text-white', hex: '#f43f5e' };
  if (score >= 10) return { label: 'High', cls: 'bg-orange-500 text-white', hex: '#f97316' };
  if (score >= 5) return { label: 'Medium', cls: 'bg-amber-400 text-slate-900', hex: '#fbbf24' };
  return { label: 'Low', cls: 'bg-teal-500 text-white', hex: '#14b8a6' };
}

export function RiskScore({ score }) {
  const l = riskLevel(score);
  return (
    <span className={`inline-flex min-w-[84px] items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${l.cls}`}>
      {score} · {l.label}
    </span>
  );
}
