import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, UserPlus, Building2, Crown, Sparkles, Rocket, AlertTriangle, Loader2, Copy, KeyRound } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import ErrorState from '../components/ErrorState';
import { SkeletonRows, SkeletonCard } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { industries, locations, ROLES, initials, fmtDate } from '../data/constants';

const PLANS = [
  { id: 'Starter', icon: Rocket, price: 'Free', features: ['3 policies', '1 framework', 'PDF export'] },
  { id: 'Business', icon: Sparkles, price: 'AED 299/mo', features: ['Unlimited policies', 'All frameworks', 'Risk register', 'Staff sign-off'] },
  { id: 'Enterprise', icon: Crown, price: 'Custom', features: ['SSO & audit logs', 'AI drafting', 'Multi-entity', 'Dedicated CSM'] },
];

export default function Settings() {
  const { toast } = useApp();
  const { user, refresh } = useAuth();
  const { data, loading, error, reload, setData } = useApi('/organisation');
  const isAdmin = user.role === 'Admin';
  const [logo, setLogo] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invite, setInvite] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: '', email: '', role: 'Compliance Officer' });
  const [err, setErr] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [tempPw, setTempPw] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { if (data?.organisation) setDraft(data.organisation); }, [data?.organisation]);

  if (loading && !data) return <div><PageHeader eyebrow="Settings" title="Organisation" /><div className="grid gap-4 lg:grid-cols-3"><SkeletonCard className="lg:col-span-2" lines={5} /><SkeletonCard lines={4} /></div></div>;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!draft) return null;

  const org = data.organisation;

  const onLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('That file isn\'t an image. Try a PNG, JPG or SVG.', 'error'); return; }
    if (f.size > 2 * 1024 * 1024) { toast('That logo is over 2 MB. Please choose a smaller file.', 'error'); return; }
    setLogo(URL.createObjectURL(f));
    toast('Logo preview updated. Logo storage is coming soon.', 'info');
  };

  const patchOrg = async (body, msg) => {
    const res = await api('/organisation', { method: 'PATCH', body });
    setData(res);
    await refresh(); // update navbar company name / plan
    toast(msg);
  };

  const saveOrg = async () => {
    if (!draft.name?.trim()) { toast('Your organisation needs a name.', 'error'); return; }
    setSaving(true);
    try {
      await patchOrg({ name: draft.name, industry: draft.industry, employee_count: draft.employee_count, emirate_or_country: draft.emirate_or_country }, 'Organisation details saved.');
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const setPlan = async (plan) => {
    if (plan === org.plan) return;
    try { await patchOrg({ plan }, `Switched to the ${plan} plan (demo, no billing yet).`); } catch (e) { toast(e.message, 'error'); }
  };

  const setRole = async (m, role) => {
    try { await patchOrg({ user_id: m.id, role }, `${m.full_name.split(' ')[0]} is now ${role}.`); } catch (e) { toast(e.message, 'error'); }
  };

  const addMember = async () => {
    if (!newMember.full_name.trim()) { setErr('Please enter a name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(newMember.email)) { setErr('That email address doesn\'t look quite right.'); return; }
    setInviteBusy(true); setErr('');
    try {
      const res = await api('/organisation', { method: 'POST', body: newMember });
      setData({ organisation: res.organisation, users: res.users });
      setTempPw({ email: newMember.email, password: res.temp_password });
      setInvite(false); setNewMember({ full_name: '', email: '', role: 'Compliance Officer' });
      toast(`${newMember.full_name} added to your team.`);
    } catch (e) { setErr(e.message); } finally { setInviteBusy(false); }
  };

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Organisation" subtitle={isAdmin ? 'Your company profile, plan and team.' : 'Your company profile, plan and team. Only Admins can make changes.'} />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Company profile</h2>
          <div className="flex flex-col gap-5 sm:flex-row">
            <button onClick={() => fileRef.current?.click()}
              className="group grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line/20 bg-line/[0.03] text-muted transition hover:border-teal-400/60 hover:text-teal-400">
              {logo ? <img src={logo} alt="Company logo preview" className="h-full w-full object-contain p-2" /> : (
                <span className="flex flex-col items-center gap-1 text-xs"><Upload size={20} /> Upload logo</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
            <fieldset disabled={!isAdmin} className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Company name</label><input className="input" value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div><label className="label">Industry</label><select className="input" value={draft.industry || ''} onChange={(e) => setDraft({ ...draft, industry: e.target.value })}><option value="">—</option>{[...new Set([...(draft.industry ? [draft.industry] : []), ...industries])].map((i) => <option key={i}>{i}</option>)}</select></div>
              <div><label className="label">Employees</label><input type="number" min="1" className="input" value={draft.employee_count ?? ''} onChange={(e) => setDraft({ ...draft, employee_count: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Emirate / country</label><select className="input" value={draft.emirate_or_country || ''} onChange={(e) => setDraft({ ...draft, emirate_or_country: e.target.value })}><option value="">—</option>{[...new Set([...(draft.emirate_or_country ? [draft.emirate_or_country] : []), ...locations])].map((l) => <option key={l}>{l}</option>)}</select></div>
            </fieldset>
          </div>
          {isAdmin && <div className="mt-5 flex justify-end"><button onClick={saveOrg} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save changes</button></div>}
        </GlassCard>

        <GlassCard delay={0.05} className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold"><Building2 size={16} className="text-teal-400" /> At a glance</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[['Plan', org.plan], ['Industry', org.industry || '—'], ['Headcount', org.employee_count ?? '—'], ['Location', org.emirate_or_country || '—'], ['Team members', data.users.length], ['Member since', fmtDate(org.created_at)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line/[0.05] pb-2 last:border-0"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </GlassCard>
      </div>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Plan</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => {
          const current = org.plan === p.id;
          return (
            <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={isAdmin ? { y: -4 } : undefined}
              onClick={() => isAdmin && setPlan(p.id)} disabled={!isAdmin}
              className={`glass relative p-5 text-left transition-shadow ${current ? 'shadow-glow ring-1 ring-teal-400/60' : isAdmin ? 'hover:shadow-glow' : ''}`}>
              {current && <span className="chip absolute right-4 top-4 bg-teal-400 text-slate-900">Current</span>}
              <p.icon size={22} className="text-teal-400" />
              <div className="mt-3 font-display text-xl font-bold">{p.id}</div>
              <div className="text-sm text-muted">{p.price}</div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check size={14} className="text-teal-400" />{f}</li>)}
              </ul>
            </motion.button>
          );
        })}
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Team members</h2>
        {isAdmin && <button onClick={() => setInvite(true)} className="btn-ghost"><UserPlus size={16} /> Add member</button>}
      </div>
      <GlassCard className="divide-y divide-line/[0.06]">
        {loading && !data ? <SkeletonRows rows={3} /> : data.users.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-xs font-bold text-white">{initials(m.full_name)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{m.full_name}{m.id === user.id && <span className="ml-2 text-xs text-muted">(you)</span>}</div>
              <div className="truncate text-xs text-muted">{m.email}</div>
            </div>
            <select value={m.role} disabled={!isAdmin || m.id === user.id} onChange={(e) => setRole(m, e.target.value)} className="input !w-auto !py-3 text-xs sm:!py-1.5" aria-label={`Role for ${m.full_name}`}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </GlassCard>

      <Modal open={invite} onClose={() => { if (!inviteBusy) { setInvite(false); setErr(''); } }} title="Add a team member"
        footer={<><button className="btn-ghost" onClick={() => setInvite(false)} disabled={inviteBusy}>Cancel</button><button className="btn-primary" onClick={addMember} disabled={inviteBusy}>{inviteBusy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Add member</button></>}>
        <div className="space-y-3">
          <div><label className="label">Full name</label><input autoFocus className="input" value={newMember.full_name} onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })} /></div>
          <div><label className="label">Work email</label><input type="email" className="input" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} /></div>
          <div><label className="label">Role</label><select className="input" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          {err && <p className="flex items-center gap-1.5 text-xs text-rose-400"><AlertTriangle size={12} /> {err}</p>}
          <p className="text-xs text-muted">We'll create their login with a one-time temporary password for you to share. Email invites are coming soon.</p>
        </div>
      </Modal>

      <Modal open={!!tempPw} onClose={() => setTempPw(null)} title="Share these login details"
        footer={<button className="btn-primary" onClick={() => setTempPw(null)}>Done</button>}>
        <div className="space-y-3 text-sm">
          <p className="flex items-start gap-2 text-muted"><KeyRound size={16} className="mt-0.5 shrink-0 text-amber-400" /> This password is shown only once. Share it securely, not by group chat.</p>
          <div className="rounded-xl bg-line/[0.05] p-3 font-mono text-xs">
            <div>Email: <b>{tempPw?.email}</b></div>
            <div>Temporary password: <b>{tempPw?.password}</b></div>
          </div>
          <button className="btn-ghost w-full" onClick={async () => {
            try { await navigator.clipboard.writeText(`GIDO ComplyPilot login\nEmail: ${tempPw.email}\nTemporary password: ${tempPw.password}`); toast('Copied.'); }
            catch { toast('Clipboard blocked. Please copy it manually.', 'error'); }
          }}><Copy size={16} /> Copy details</button>
        </div>
      </Modal>
    </div>
  );
}
