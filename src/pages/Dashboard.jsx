import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ShieldCheck, CalendarClock, AlertTriangle, ClipboardCheck, ArrowUpRight, Pencil, Sparkles, Users, Building2, UserPlus, FileText, Activity, Plus,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ScoreRing, { scoreColor } from '../components/ScoreRing';
import AnimatedCounter from '../components/AnimatedCounter';
import TipOfDay from '../components/TipOfDay';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { SkeletonDashboard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { fmtDate, daysUntil, timeAgo } from '../data/constants';

function activityStyle(a) {
  if (a.entity_type === 'risk') return [AlertTriangle, 'text-rose-400 bg-rose-500/15'];
  if (a.entity_type === 'acknowledgement') return [Users, 'text-teal-400 bg-teal-400/15'];
  if (a.entity_type === 'employee') return [UserPlus, 'text-indigo-400 bg-indigo-500/15'];
  if (a.entity_type === 'organisation' || a.entity_type === 'user') return [Building2, 'text-indigo-400 bg-indigo-500/15'];
  if (a.action.startsWith('generated')) return [Sparkles, 'text-teal-400 bg-teal-400/15'];
  if (a.action.startsWith('saved version')) return [Pencil, 'text-indigo-400 bg-indigo-500/15'];
  if (a.action.includes('status')) return [ShieldCheck, 'text-amber-400 bg-amber-400/15'];
  return [FileText, 'text-indigo-400 bg-indigo-500/15'];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/dashboard');

  if (loading && !data) return <SkeletonDashboard />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { score, breakdown, cards: c, upcoming, activity } = data;

  const cards = [
    { label: 'Active policies', value: c.active_policies, icon: ShieldCheck, tone: 'from-teal-400/25 text-teal-400', sub: `${c.total_policies} total in library`, to: '/library' },
    { label: 'Due for review', value: c.due_for_review, icon: CalendarClock, tone: 'from-amber-400/25 text-amber-400', sub: c.overdue ? `next 30 days · ${c.overdue} overdue` : 'in the next 30 days', to: '/library' },
    { label: 'Open risks', value: c.open_risks, icon: AlertTriangle, tone: 'from-rose-500/25 text-rose-400', sub: `${c.critical_open_risks} high (score 15+)`, to: '/risks' },
    { label: 'Pending acknowledgements', value: c.pending_acknowledgements, icon: ClipboardCheck, tone: 'from-indigo-500/25 text-indigo-400', sub: `${c.signed_acknowledgements} of ${c.total_acknowledgements} signed`, to: '/acknowledgements' },
  ];

  const bars = [
    { name: 'Policies', value: breakdown.policies, hint: 'Active & in date' },
    { name: 'Sign-off', value: breakdown.acknowledgements, hint: 'Acknowledgements signed' },
    { name: 'High risks', value: breakdown.high_risks_mitigated, hint: 'High risks mitigated' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-500 dark:text-teal-400">Dashboard</div>
        <h1 className="text-2xl font-bold sm:text-3xl">{user.organisation.name}</h1>
      </div>

      {c.total_policies === 0 && (
        <GlassCard className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Let's get your score moving 🚀</h2>
            <p className="text-sm text-muted">No policies yet. Generate your first one in under a minute!</p>
          </div>
          <Link to="/generate" className="btn-primary"><Sparkles size={16} /> Generate your first policy</Link>
        </GlassCard>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Score */}
        <GlassCard className="relative flex flex-col items-center overflow-hidden p-6 lg:row-span-2">
          <div className="pointer-events-none absolute -top-24 h-56 w-56 rounded-full blur-3xl" style={{ background: `${scoreColor(score)}33` }} />
          <div className="relative flex w-full items-center justify-between">
            <h2 className="font-semibold">Overall compliance</h2>
            <span className="chip bg-teal-400/15 text-teal-500 dark:text-teal-300"><Activity size={12} /> Live</span>
          </div>
          <div className="relative my-6"><ScoreRing value={score} size={210} /></div>
          <div className="grid w-full grid-cols-3 gap-2 text-center text-[11px]">
            {[['#f43f5e', '0–49', 'At risk'], ['#f59e0b', '50–74', 'Attention'], ['#2dd4bf', '75–100', 'Strong']].map(([col, r, l]) => (
              <div key={l} className="rounded-lg bg-line/[0.04] px-2 py-2">
                <div className="mx-auto mb-1 h-1.5 w-6 rounded-full" style={{ background: col }} />
                <div className="font-semibold">{l}</div><div className="text-muted">{r}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 w-full">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">What drives your score</div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bars} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgb(var(--line) / 0.04)' }}
                    formatter={(v, _n, p) => [`${v}%`, p.payload.hint]}
                    contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line) / 0.1)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={14} background={{ fill: 'rgb(var(--line) / 0.06)', radius: 8 }}>
                    {bars.map((b) => <Cell key={b.name} fill={scoreColor(b.value)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2">
          {cards.map((card, i) => (
            <GlassCard key={card.label} hover delay={i * 0.06} className="p-0">
              <Link to={card.to} className="group block p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br to-transparent ${card.tone}`}>
                    <card.icon size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-muted opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="mt-4 font-display text-3xl font-bold sm:text-4xl"><AnimatedCounter value={card.value} /></div>
                <div className="mt-1 text-sm font-medium">{card.label}</div>
                <div className="text-xs text-muted">{card.sub}</div>
              </Link>
            </GlassCard>
          ))}
        </div>

        <div className="lg:col-span-2"><TipOfDay /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Timeline */}
        <GlassCard delay={0.1} className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming review deadlines</h2>
            <Link to="/library" className="-my-3 py-3 pl-3 text-xs font-medium text-teal-500 hover:underline dark:text-teal-400">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No reviews scheduled" message="Review dates appear here once you have policies in your library."
              action={<Link to="/generate" className="btn-ghost"><Plus size={16} /> Generate a policy</Link>} />
          ) : (
            <ol className="relative ml-2 border-l border-line/10">
              {upcoming.map((p, i) => {
                const days = daysUntil(p.next_review_date);
                const tone = days < 0 ? 'bg-rose-500' : days <= 7 ? 'bg-amber-400' : days <= 30 ? 'bg-indigo-400' : 'bg-teal-400';
                return (
                  <motion.li key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                    className="relative pb-4 pl-6 last:pb-0">
                    <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${tone} ring-4 ring-bg`} />
                    <Link to={`/editor/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-1 hover:bg-line/[0.04]">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-muted">{p.framework} · {p.status}{p.owner ? ` · Owner: ${p.owner}` : ''}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-semibold">{fmtDate(p.next_review_date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className={days < 0 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : 'text-muted'}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'today' : `in ${days}d`}
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </GlassCard>

        {/* Activity */}
        <GlassCard delay={0.15} className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Nothing here yet. Your team's actions will show up as they happen.</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((a, i) => {
                const [Icon, tone] = activityStyle(a);
                return (
                  <motion.li key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="flex gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={15} /></span>
                    <div className="min-w-0 text-sm">
                      <p className="leading-snug"><b className="font-semibold">{a.who}</b> <span className="text-muted">{a.action}</span></p>
                      <p className="text-xs text-muted">{timeAgo(a.created_at)}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
