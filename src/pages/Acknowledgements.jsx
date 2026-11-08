import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Clock, Users, Loader2, UserPlus, FileText, Sparkles, AlertTriangle, BellRing } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import { SkeletonRows } from '../components/Skeleton';
import { StatusBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { initials, timeAgo } from '../data/constants';

export default function Acknowledgements() {
  const { toast } = useApp();
  const summary = useApi('/acknowledgements');
  const policies = summary.data?.policies || [];
  const employeeCount = summary.data?.employee_count ?? 0;
  const [selected, setSelected] = useState(null);
  const detail = useApi(selected ? `/acknowledgements?policy_id=${selected}` : null);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(null); // 'remind' | 'assign' | ack id
  const [addOpen, setAddOpen] = useState(false);
  const [emp, setEmp] = useState({ full_name: '', email: '', department: '' });
  const [empErr, setEmpErr] = useState('');
  const [empBusy, setEmpBusy] = useState(false);

  useEffect(() => {
    if (!policies.length) return;
    if (!selected || !policies.some((p) => p.id === selected)) setSelected(policies[0].id);
  }, [policies, selected]);

  const refreshAll = () => Promise.all([summary.reload({ silent: true }), detail.reload({ silent: true })]);

  const addEmployee = async () => {
    if (!emp.full_name.trim()) { setEmpErr('Please enter a name.'); return; }
    setEmpBusy(true); setEmpErr('');
    try {
      await api('/employees', { method: 'POST', body: emp });
      toast(`${emp.full_name} added to your staff list.`);
      setEmp({ full_name: '', email: '', department: '' });
      setAddOpen(false);
      await refreshAll();
    } catch (e) { setEmpErr(e.message); } finally { setEmpBusy(false); }
  };

  if (summary.loading && !summary.data) {
    return (
      <div>
        <PageHeader eyebrow="Staff acknowledgements" title="Who has read what" />
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]"><div className="glass"><SkeletonRows rows={4} /></div><div className="glass"><SkeletonRows rows={6} /></div></div>
      </div>
    );
  }
  if (summary.error && !summary.data) return <ErrorState error={summary.error} onRetry={summary.reload} />;

  const header = (
    <PageHeader eyebrow="Staff acknowledgements" title="Who has read what"
      subtitle={`Track policy sign-off across your team. ${employeeCount} employee${employeeCount === 1 ? '' : 's'} on file.`}
      actions={<button onClick={() => setAddOpen(true)} className="btn-ghost"><UserPlus size={16} /> Add employee</button>} />
  );

  const modal = (
    <Modal open={addOpen} onClose={() => !empBusy && setAddOpen(false)} title="Add an employee"
      footer={<><button className="btn-ghost" onClick={() => setAddOpen(false)} disabled={empBusy}>Cancel</button>
        <button className="btn-primary" onClick={addEmployee} disabled={empBusy}>{empBusy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Add employee</button></>}>
      <div className="space-y-3">
        <div><label className="label">Full name</label><input autoFocus className="input" value={emp.full_name} onChange={(e) => setEmp({ ...emp, full_name: e.target.value })} /></div>
        <div><label className="label">Email (optional)</label><input type="email" className="input" value={emp.email} onChange={(e) => setEmp({ ...emp, email: e.target.value })} /></div>
        <div><label className="label">Department (optional)</label><input className="input" value={emp.department} onChange={(e) => setEmp({ ...emp, department: e.target.value })} placeholder="e.g. Warehouse" /></div>
        {empErr && <p className="flex items-center gap-1.5 text-xs text-rose-400"><AlertTriangle size={12} /> {empErr}</p>}
        <p className="text-xs text-muted">Tip: after adding staff, use "Assign to all employees" on a policy to request their sign-off.</p>
      </div>
    </Modal>
  );

  if (!policies.length) {
    return (
      <div>{header}
        <EmptyState icon={FileText} title="No policies to acknowledge yet" message="Generate a policy first, then assign it to your staff for sign-off."
          action={<Link to="/generate" className="btn-primary"><Sparkles size={16} /> Generate your first policy</Link>} />
        {modal}
      </div>
    );
  }

  const current = policies.find((p) => p.id === selected) || policies[0];
  const rows = detail.data?.rows || [];
  const unassigned = detail.data?.unassigned_count ?? 0;
  const pending = rows.filter((r) => r.status === 'Pending');
  const list = rows.filter((r) => filter === 'All' || r.status === filter);

  const assign = async () => {
    setBusy('assign');
    try {
      const { assigned } = await api('/acknowledgements', { method: 'POST', body: { action: 'assign', policy_id: current.id } });
      toast(assigned ? `“${current.title}” assigned to ${assigned} employee${assigned === 1 ? '' : 's'}.` : 'Everyone already has this policy assigned.', assigned ? 'success' : 'info');
      await refreshAll();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };

  const remind = async () => {
    if (!pending.length) { toast('Everyone has already signed this policy. 🎉', 'info'); return; }
    setBusy('remind');
    try {
      const { reminded } = await api('/acknowledgements', { method: 'POST', body: { action: 'remind', policy_id: current.id } });
      toast(`Reminder sent to ${reminded} employee${reminded === 1 ? '' : 's'} for “${current.title}”.`);
      await detail.reload({ silent: true });
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };

  const toggle = async (row) => {
    const status = row.status === 'Signed' ? 'Pending' : 'Signed';
    setBusy(row.id);
    try {
      await api('/acknowledgements', { method: 'PATCH', body: { id: row.id, status } });
      toast(status === 'Signed' ? `${row.full_name} signed “${current.title}”.` : `${row.full_name} set back to pending.`, status === 'Signed' ? 'success' : 'info');
      await refreshAll();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(null); }
  };

  return (
    <div>
      {header}
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <GlassCard className="p-3">
          <div className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted">Policies</div>
          <ul className="space-y-1">
            {policies.map((p, i) => {
              const pct = p.total ? Math.round((p.signed / p.total) * 100) : 0;
              const active = p.id === current.id;
              return (
                <li key={p.id}>
                  <button onClick={() => { setSelected(p.id); setFilter('All'); }}
                    className={`w-full rounded-xl p-3 text-left transition ${active ? 'bg-gradient-to-r from-indigo-500/15 to-teal-400/10 ring-1 ring-teal-400/25' : 'hover:bg-line/[0.04]'}`}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="shrink-0 text-xs font-bold">{p.total ? `${pct}%` : '—'}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.06 }}
                        className={`h-full rounded-full ${pct === 100 ? 'bg-teal-400' : pct >= 60 ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : 'bg-amber-400'}`} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                      <span>{p.total ? `${p.signed} of ${p.total} signed` : 'Not assigned yet'}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard delay={0.08} className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{current.title}</h2>
              <p className="text-xs text-muted">{current.signed} signed · {current.pending} pending{unassigned ? ` · ${unassigned} not assigned` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassigned > 0 && (
                <button onClick={assign} disabled={!!busy} className="btn-ghost">
                  {busy === 'assign' ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} Assign to all employees ({unassigned})
                </button>
              )}
              <button onClick={remind} disabled={!!busy || !rows.length} className="btn-primary">
                {busy === 'remind' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send reminder{pending.length ? ` (${pending.length})` : ''}
              </button>
            </div>
          </div>

          {detail.loading && !detail.data ? <SkeletonRows rows={4} /> : detail.error && !detail.data ? <ErrorState error={detail.error} onRetry={detail.reload} /> : rows.length === 0 ? (
            <div className="mt-5">
              {employeeCount === 0 ? (
                <EmptyState icon={UserPlus} title="No employees yet" message="Add your staff so you can track who has read and signed each policy."
                  action={<button onClick={() => setAddOpen(true)} className="btn-primary"><UserPlus size={16} /> Add your first employee</button>} />
              ) : (
                <EmptyState icon={Users} title="Not assigned yet" message={`Assign “${current.title}” to your ${employeeCount} employee${employeeCount === 1 ? '' : 's'} to start collecting signatures.`}
                  action={<button onClick={assign} disabled={!!busy} className="btn-primary">{busy === 'assign' ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />} Assign to all employees</button>} />
              )}
            </div>
          ) : (
            <>
              <div className="mt-4 flex gap-2">
                {['All', 'Signed', 'Pending'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full px-3.5 py-3 text-xs font-semibold transition sm:py-1 ${filter === f ? 'bg-ink text-bg' : 'bg-line/[0.05] text-muted hover:text-ink'}`}>{f}</button>
                ))}
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {list.map((r, i) => {
                  const ok = r.status === 'Signed';
                  return (
                    <motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-xl border border-line/[0.07] bg-line/[0.02] p-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${ok ? 'bg-teal-400/20 text-teal-500 dark:text-teal-300' : 'bg-line/10 text-muted'}`}>{initials(r.full_name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{r.full_name}</div>
                        <div className="truncate text-xs text-muted">
                          {ok ? `Signed ${timeAgo(r.signed_at)}` : r.last_reminder_at ? <span className="inline-flex items-center gap-1"><BellRing size={11} /> Reminded {timeAgo(r.last_reminder_at)}</span> : (r.department || r.email || 'Awaiting signature')}
                        </div>
                      </div>
                      <button onClick={() => toggle(r)} disabled={!!busy} title={ok ? 'Mark as pending' : 'Mark as signed'}
                        className={`chip !py-2.5 transition hover:scale-105 sm:!py-0.5 ${ok ? 'bg-teal-400/15 text-teal-600 dark:text-teal-300' : 'bg-amber-400/15 text-amber-600 dark:text-amber-400'}`}>
                        {busy === r.id ? <Loader2 size={12} className="animate-spin" /> : ok ? <CheckCircle2 size={12} /> : <Clock size={12} />} {ok ? 'Signed' : 'Mark signed'}
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
              {list.length === 0 && <p className="py-8 text-center text-sm text-muted">{filter === 'Pending' ? 'Nobody is pending. Great work! 🎉' : 'No one has signed yet.'}</p>}
            </>
          )}
        </GlassCard>
      </div>
      {modal}
    </div>
  );
}
