import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Link2, CalendarDays, User, Trash2, ShieldCheck, FilterX, Pencil, CheckCircle2, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import GlassCard from '../components/GlassCard';
import { SkeletonRows, Bone } from '../components/Skeleton';
import { RiskScore, riskLevel, StatusBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { fmtDate } from '../data/constants';

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'];
const IMPACT = ['Minor', 'Moderate', 'Significant', 'Major', 'Severe'];
const STATUSES = ['Open', 'Mitigated', 'Closed'];

const blank = { title: '', description: '', likelihood: 3, impact: 3, owner_user_id: '', due_date: '', linked_policy_id: '', status: 'Open' };

function HeatMap({ risks, selected, onSelect }) {
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex w-5 items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-muted">Likelihood →</span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-1.5">
            {[5, 4, 3, 2, 1].map((l) => [1, 2, 3, 4, 5].map((i) => {
              const s = l * i;
              const n = risks.filter((r) => r.likelihood === l && r.impact === i).length;
              const lv = riskLevel(s);
              const isSel = selected && selected.l === l && selected.i === i;
              return (
                <motion.button key={`${l}-${i}`} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
                  onClick={() => onSelect(isSel ? null : { l, i })}
                  title={`${LIKELIHOOD[l - 1]} × ${IMPACT[i - 1]} = ${s}${n ? ` · ${n} risk${n > 1 ? 's' : ''}` : ''}`}
                  className={`relative grid aspect-square place-items-center rounded-lg text-sm font-bold transition ${isSel ? 'ring-2 ring-white ring-offset-2 ring-offset-bg' : ''}`}
                  style={{ background: `${lv.hex}${n ? 'dd' : '33'}`, color: n ? '#fff' : 'transparent' }}>
                  {n > 0 && n}
                  {n > 0 && <span className="absolute inset-0 animate-pulse rounded-lg" style={{ boxShadow: `0 0 18px ${lv.hex}66` }} />}
                </motion.button>
              );
            }))}
          </div>
          <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-widest text-muted">Impact →</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-muted">
        {[['Low', '#14b8a6'], ['Medium', '#fbbf24'], ['High', '#f97316'], ['Critical', '#f43f5e']].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function RiskRegister() {
  const { toast } = useApp();
  const { user } = useAuth();
  const risksApi = useApi('/risks');
  const orgApi = useApi('/organisation');
  const policiesApi = useApi('/policies');
  const risks = risksApi.data?.risks || [];
  const team = orgApi.data?.users || [];
  const policies = policiesApi.data?.policies || [];

  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', id }
  const [form, setForm] = useState(blank);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const [cell, setCell] = useState(null);

  const sorted = useMemo(() => risks.filter((r) => !cell || (r.likelihood === cell.l && r.impact === cell.i)), [risks, cell]);

  const openAdd = () => { setForm({ ...blank, owner_user_id: user.id }); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (r) => {
    setForm({
      title: r.title, description: r.description || '', likelihood: r.likelihood, impact: r.impact, owner_user_id: r.owner_user_id || '',
      due_date: r.due_date || '', linked_policy_id: r.linked_policy_id || '', status: r.status,
    });
    setErr(''); setModal({ mode: 'edit', id: r.id });
  };

  const submit = async () => {
    if (!form.title.trim()) { setErr('Give the risk a short, clear description.'); return; }
    if (!form.owner_user_id) { setErr('Every risk needs an owner. Pick someone accountable.'); return; }
    if (!form.due_date) { setErr('Set a due date for the next action.'); return; }
    setBusy(true); setErr('');
    const payload = { ...form, linked_policy_id: form.linked_policy_id || null };
    try {
      if (modal.mode === 'add') {
        const { risk } = await api('/risks', { method: 'POST', body: payload });
        risksApi.setData((d) => ({ risks: [risk, ...(d?.risks || [])] }));
        toast('Risk added to the register.');
      } else {
        const { risk } = await api(`/risks/${modal.id}`, { method: 'PATCH', body: payload });
        risksApi.setData((d) => ({ risks: d.risks.map((x) => (x.id === risk.id ? risk : x)) }));
        toast('Risk updated.');
      }
      setModal(null);
      risksApi.reload({ silent: true });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const patch = async (r, changes, msg) => {
    setRowBusy(r.id);
    try {
      const { risk } = await api(`/risks/${r.id}`, { method: 'PATCH', body: changes });
      risksApi.setData((d) => ({ risks: d.risks.map((x) => (x.id === risk.id ? risk : x)) }));
      toast(msg, 'info');
    } catch (e) { toast(e.message, 'error'); } finally { setRowBusy(null); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete the risk “${r.title}”? This can't be undone.`)) return;
    setRowBusy(r.id);
    try {
      await api(`/risks/${r.id}`, { method: 'DELETE' });
      risksApi.setData((d) => ({ risks: d.risks.filter((x) => x.id !== r.id) }));
      toast('Risk deleted.', 'info');
    } catch (e) { toast(e.message, 'error'); } finally { setRowBusy(null); }
  };

  const stats = [
    ['Critical', risks.filter((r) => r.score >= 15 && r.status === 'Open').length, 'text-rose-400'],
    ['Open', risks.filter((r) => r.status === 'Open').length, 'text-orange-400'],
    ['Linked to policy', risks.filter((r) => r.linked_policy_id).length, 'text-teal-400'],
  ];

  const Actions = ({ r }) => (
    <div className="flex items-center gap-1">
      {rowBusy === r.id ? <Loader2 size={15} className="m-1.5 animate-spin text-muted" /> : (
        <>
          <button onClick={() => openEdit(r)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-indigo-500/10 md:h-auto md:w-auto md:p-1.5 hover:text-indigo-400" aria-label="Edit risk" title="Edit"><Pencil size={15} /></button>
          {r.status !== 'Closed' && <button onClick={() => patch(r, { status: 'Closed' }, `Closed “${r.title}”.`)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-teal-400/10 md:h-auto md:w-auto md:p-1.5 hover:text-teal-400" aria-label="Close risk" title="Close risk"><CheckCircle2 size={15} /></button>}
          <button onClick={() => remove(r)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-rose-500/10 md:h-auto md:w-auto md:p-1.5 hover:text-rose-400" aria-label="Delete risk" title="Delete"><Trash2 size={15} /></button>
        </>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Risk register" title="Risks & controls" subtitle="Score each risk by likelihood × impact and link it to the policy that controls it."
        actions={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add risk</button>} />

      {risksApi.error && !risksApi.data ? <ErrorState error={risksApi.error} onRetry={risksApi.reload} /> : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Heat map</h2>
                {cell && <button onClick={() => setCell(null)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"><FilterX size={13} /> Clear</button>}
              </div>
              {risksApi.loading && !risksApi.data ? <Bone className="aspect-square w-full rounded-xl" /> : <HeatMap risks={risks} selected={cell} onSelect={setCell} />}
            </GlassCard>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(([l, v, c]) => (
                <GlassCard key={l} className="p-3 text-center">
                  <div className={`font-display text-2xl font-bold ${c}`}>{v}</div>
                  <div className="text-[11px] text-muted">{l}</div>
                </GlassCard>
              ))}
            </div>
          </div>

          <GlassCard delay={0.08} className="overflow-hidden">
            {risksApi.loading && !risksApi.data ? <SkeletonRows rows={6} /> : sorted.length === 0 ? (
              <div className="p-6"><EmptyState icon={ShieldCheck} title={cell ? 'No risks in this cell' : 'No risks logged yet'}
                message={cell ? 'Pick another square on the heat map, or clear the filter.' : 'Add your first risk to start building your register.'}
                action={!cell && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add your first risk</button>} /></div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="border-b border-line/[0.08] text-left text-[11px] uppercase tracking-wider text-muted">
                      <tr><th className="px-4 py-3">Risk</th><th className="px-3 py-3">L × I</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Owner</th><th className="px-3 py-3">Due</th><th className="px-3 py-3">Status</th><th /></tr>
                    </thead>
                    <tbody>
                      {sorted.map((r, i) => (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className={`border-b border-line/[0.05] last:border-0 hover:bg-line/[0.03] ${r.status === 'Closed' ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium">{r.title}</div>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                              {r.linked_policy_id
                                ? <Link to={`/editor/${r.linked_policy_id}`} className="inline-flex items-center gap-1 text-teal-500 hover:underline dark:text-teal-400"><Link2 size={11} />{r.linked_policy_title}</Link>
                                : <button onClick={() => openEdit(r)} className="italic hover:text-ink">No linked policy · link one</button>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-muted">{r.likelihood} × {r.impact}</td>
                          <td className="px-3 py-3"><RiskScore score={r.score} /></td>
                          <td className="whitespace-nowrap px-3 py-3">{r.owner || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-muted">{fmtDate(r.due_date, { day: 'numeric', month: 'short' })}</td>
                          <td className="px-3 py-3">
                            <select value={r.status} disabled={rowBusy === r.id} onChange={(e) => patch(r, { status: e.target.value }, `Risk marked ${e.target.value}.`)}
                              className="rounded-lg border border-line/10 bg-transparent px-2 py-1 text-xs text-ink" aria-label="Risk status">
                              {STATUSES.map((s) => <option key={s} className="bg-surface">{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-3"><Actions r={r} /></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-line/[0.06] md:hidden">
                  {sorted.map((r) => (
                    <li key={r.id} className={`space-y-2 p-4 ${r.status === 'Closed' ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium leading-snug">{r.title}</div>
                        <RiskScore score={r.score} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1"><User size={12} />{r.owner || '—'}</span>
                        <span className="flex items-center gap-1"><CalendarDays size={12} />{fmtDate(r.due_date, { day: 'numeric', month: 'short' })}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        {r.linked_policy_id
                          ? <Link to={`/editor/${r.linked_policy_id}`} className="inline-flex items-center gap-1 py-3 text-xs text-teal-500 dark:text-teal-400"><Link2 size={12} />{r.linked_policy_title}</Link>
                          : <span className="text-xs italic text-muted">No linked policy</span>}
                        <Actions r={r} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </GlassCard>
        </div>
      )}

      <Modal open={!!modal} onClose={() => !busy && setModal(null)} title={modal?.mode === 'edit' ? 'Edit risk' : 'Add a risk'}
        footer={<><button onClick={() => setModal(null)} className="btn-ghost" disabled={busy}>Cancel</button>
          <button onClick={submit} className="btn-primary" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : modal?.mode === 'edit' ? <CheckCircle2 size={16} /> : <Plus size={16} />} {modal?.mode === 'edit' ? 'Save changes' : 'Add risk'}</button></>}>
        <div className="space-y-4">
          <div>
            <label className="label">Risk</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Slips on wet warehouse floor" maxLength={200} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What could happen, and why?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['likelihood', 'Likelihood', LIKELIHOOD], ['impact', 'Impact', IMPACT]].map(([k, l, opts]) => (
              <div key={k}>
                <label className="label">{l}: {form[k]}</label>
                <input type="range" min="1" max="5" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="w-full accent-teal-500" />
                <div className="text-xs text-muted">{opts[form[k] - 1]}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-line/[0.04] px-3 py-2 text-sm">
            <span className="text-muted">Risk score</span><RiskScore score={form.likelihood * form.impact} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Owner</label>
              <select className="input" value={form.owner_user_id} onChange={(e) => setForm({ ...form, owner_user_id: e.target.value })}>
                <option value="">Assign owner…</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="label">Controlled by policy</label>
              <select className="input" value={form.linked_policy_id} onChange={(e) => setForm({ ...form, linked_policy_id: e.target.value })}>
                <option value="">Not linked yet</option>
                {policies.map((p) => <option key={p.id} value={p.id}>{p.title} (v{p.current_version})</option>)}
              </select>
              {policies.length === 0 && <p className="mt-1 text-[11px] text-muted">No policies yet. <Link to="/generate" className="text-teal-500 hover:underline">Generate one</Link> to link it.</p>}
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="flex items-center gap-1.5 text-xs text-rose-400"><AlertTriangle size={12} /> {err}</p>}
        </div>
      </Modal>
    </div>
  );
}
