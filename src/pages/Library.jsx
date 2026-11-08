import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, FileText, Plus, CalendarDays, User, GitBranch, SearchX, Sparkles } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { SkeletonGrid } from '../components/Skeleton';
import { StatusBadge, FrameworkBadge } from '../components/Badges';
import { POLICY_TYPES, fmtDate } from '../data/constants';
import { useApi } from '../hooks/useApi';

const STATUSES = ['All', 'Draft', 'Active', 'Under Review', 'Expired'];

export default function Library() {
  const { data, loading, error, reload } = useApi('/policies');
  const policies = data?.policies || [];
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [status, setStatus] = useState('All');

  const filtered = useMemo(() => policies.filter((p) =>
    (cat === 'All' || p.policy_type === cat)
    && (status === 'All' || p.status === status)
    && (!q || p.title.toLowerCase().includes(q.toLowerCase()))), [policies, q, cat, status]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, s === 'All' ? policies.length : policies.filter((p) => p.status === s).length])), [policies]);

  return (
    <div>
      <PageHeader eyebrow="Policy library" title="All policies" subtitle="Search, filter and open any policy to edit, version or export it."
        actions={<Link to="/generate" className="btn-primary"><Plus size={16} /> Generate policy</Link>} />

      <div className="glass mb-5 space-y-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-10" placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input md:w-60" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
            <option>All</option>
            {POLICY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`relative shrink-0 rounded-full px-3.5 py-3 text-xs font-semibold transition sm:py-1.5 ${status === s ? 'text-white' : 'text-muted hover:text-ink'}`}>
              {status === s && <motion.span layoutId="status-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500" />}
              <span className="relative">{s} <span className="opacity-70">({counts[s]})</span></span>
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? <SkeletonGrid /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : filtered.length === 0 ? (
        policies.length === 0 ? (
          <EmptyState icon={FileText} title="No policies yet" message="Generate your first one in under a minute!"
            action={<Link to="/generate" className="btn-primary"><Sparkles size={16} /> Generate your first policy</Link>} />
        ) : (
          <EmptyState icon={SearchX} title="No policies match those filters" message="Try a different search term, or clear the filters to see everything."
            action={<button className="btn-ghost" onClick={() => { setQ(''); setCat('All'); setStatus('All'); }}>Clear filters</button>} />
        )
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, scale: 0.96 }} whileHover={{ y: -4 }}>
                <Link to={`/editor/${p.id}`} className="glass group flex h-full flex-col p-5 transition-shadow hover:shadow-glow">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-teal-400/20 text-teal-400"><FileText size={19} /></span>
                    <StatusBadge status={p.status} />
                  </div>
                  <h3 className="mt-4 font-semibold leading-snug group-hover:text-teal-500 dark:group-hover:text-teal-300">{p.title}</h3>
                  <div className="mt-1 text-xs text-muted">{p.policy_type}</div>
                  <div className="mt-3"><FrameworkBadge framework={p.framework || 'No framework'} /></div>
                  <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line/[0.06] pt-4 text-[11px] text-muted">
                    <span className="flex items-center gap-1"><GitBranch size={12} /> v{p.current_version}</span>
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDate(p.updated_at, { day: 'numeric', month: 'short' })}</span>
                    <span className="flex items-center gap-1 truncate"><User size={12} className="shrink-0" /> <span className="truncate">{p.owner ? p.owner.split(' ')[0] : '—'}</span></span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
