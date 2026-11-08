import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Pencil, Check, X, Download, Copy, History, Save, FileQuestion, GitCommit, Undo2, Eye, Loader2, CalendarClock, Sparkles,
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import PolicyDocument, { DocHeader, SectionBody } from '../components/PolicyDocument';
import { Bone, SkeletonRows } from '../components/Skeleton';
import { StatusBadge, FrameworkBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { exportPolicyPdf, policyToText } from '../utils/exporters';
import { fmtDate } from '../data/constants';

const STATUS_FLOW = ['Draft', 'Active', 'Under Review'];

function EditorSkeleton() {
  return (
    <div role="status" aria-label="Loading policy">
      <Bone className="mb-4 h-4 w-32" />
      <Bone className="h-8 w-2/3" />
      <Bone className="mt-3 h-4 w-1/3" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-2xl bg-white/90 p-8">{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-2"><Bone className="h-5 w-1/3 !bg-slate-200" /><Bone className="h-3 w-full !bg-slate-200" /><Bone className="h-3 w-5/6 !bg-slate-200" /></div>)}</div>
        <div className="glass"><SkeletonRows rows={3} /></div>
      </div>
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useApp();
  const { data, loading, error, reload } = useApi(`/policies/${id}`);
  const versionsApi = useApi(`/policies/${id}/versions`);

  const [sections, setSections] = useState(null);
  const [editing, setEditing] = useState(null);
  const [buffer, setBuffer] = useState('');
  const [dirty, setDirty] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [loadingVersion, setLoadingVersion] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [typing, setTyping] = useState(!!location.state?.justGenerated);

  // Don't replay the typing effect on refresh
  useEffect(() => { if (location.state?.justGenerated) window.history.replaceState({}, ''); }, [location.state]);

  const currentVersion = data?.version?.version_number;
  useEffect(() => {
    if (data?.version) { setSections(data.version.content); setDirty(false); setEditing(null); }
  }, [data?.policy?.id, currentVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loading && !data) return <EditorSkeleton />;
  if (error && !data) {
    if (error.status === 404) {
      return <EmptyState icon={FileQuestion} title="We couldn't find that policy" message="It may have been deleted, or the link is out of date."
        action={<Link to="/library" className="btn-primary">Back to library</Link>} />;
    }
    return <ErrorState error={error} onRetry={reload} />;
  }
  if (!data.version || !sections) {
    return <EmptyState icon={FileQuestion} title="This policy has no content yet" message="Its saved versions couldn't be found." action={<Link to="/library" className="btn-primary">Back to library</Link>} />;
  }

  const { policy } = data;
  const savedSections = viewing ? viewing.content : data.version.content;
  const shownVersion = viewing ? viewing.version_number : policy.current_version;
  const docFor = (secs, v) => ({ company: policy.company, title: policy.title, framework: policy.framework || '—', version: String(v), effectiveDate: policy.effective_date, sections: secs });

  const startEdit = (s, i) => { setEditing(i); setBuffer(s.content); };
  const applyEdit = () => {
    if (!buffer.trim()) { toast('A section can\'t be empty. Add some text or cancel.', 'error'); return; }
    setSections((secs) => secs.map((s, i) => (i === editing ? { ...s, content: buffer.trim() } : s)));
    setEditing(null); setDirty(true);
  };
  const discard = () => { setSections(data.version.content); setDirty(false); setEditing(null); };

  const saveVersion = async () => {
    if (!note.trim()) { toast('Please add a short change note.', 'error'); return; }
    setSaving(true);
    try {
      const { version_number: n } = await api(`/policies/${id}/versions`, { method: 'POST', body: { sections, change_note: note.trim() } });
      toast(`Saved as version ${n}.`);
      setSaveOpen(false); setNote('');
      await Promise.all([reload({ silent: true }), versionsApi.reload({ silent: true })]);
    } catch (err) {
      toast(err.message, 'error');
    } finally { setSaving(false); }
  };

  const setStatus = async (status) => {
    if (status === policy.status) return;
    setStatusBusy(status);
    try {
      await api(`/policies/${id}`, { method: 'PATCH', body: { status } });
      toast(`Status changed to ${status}.`, 'info');
      await reload({ silent: true });
    } catch (err) { toast(err.message, 'error'); } finally { setStatusBusy(null); }
  };

  const viewVersion = async (n) => {
    if (n === policy.current_version) { setViewing(null); return; }
    setLoadingVersion(n);
    try {
      const { version } = await api(`/policies/${id}/versions?version=${n}`);
      setViewing(version); setEditing(null);
    } catch (err) { toast(err.message, 'error'); } finally { setLoadingVersion(null); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(policyToText(docFor(savedSections, shownVersion))); toast(`Version ${shownVersion} copied to clipboard.`); }
    catch { toast('Clipboard access was blocked by your browser. Try Export PDF instead.', 'error'); }
  };
  const pdf = () => {
    try { exportPolicyPdf(docFor(savedSections, shownVersion)); toast(`PDF of version ${shownVersion} downloaded.`); }
    catch { toast('We couldn\'t create the PDF. Please try again.', 'error'); }
  };

  const versions = versionsApi.data?.versions;

  return (
    <div>
      <Link to="/library" className="mb-2 inline-flex items-center gap-1.5 py-2.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Policy library</Link>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge status={policy.status} /><FrameworkBadge framework={policy.framework || '—'} /><span className="chip bg-line/[0.06] text-muted">v{policy.current_version}</span></div>
          <h1 className="text-2xl font-bold sm:text-3xl">{policy.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span>Owner: {policy.owner || '—'}</span>
            <span className="flex items-center gap-1"><CalendarClock size={14} /> Next review {fmtDate(policy.next_review_date)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copy} className="btn-ghost" title={dirty ? 'Copies the saved version (save first to include edits)' : undefined}><Copy size={16} /> Copy</button>
          <button onClick={pdf} className="btn-ghost" title={dirty ? 'Exports the saved version (save first to include edits)' : undefined}><Download size={16} /> Export PDF</button>
          <button onClick={() => setSaveOpen(true)} disabled={!dirty || !!viewing} className="btn-primary"><Save size={16} /> Save version</button>
        </div>
      </div>

      <div className="mb-5"><DisclaimerBanner /></div>

      <AnimatePresence>
        {dirty && !viewing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-indigo-500/10 px-4 py-3 text-sm ring-1 ring-indigo-500/25">
            <span>You have unsaved changes. Export and copy use the last saved version.</span>
            <button onClick={discard} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted hover:text-ink"><Undo2 size={13} /> Discard</button>
          </motion.div>
        )}
        {viewing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl bg-amber-400/10 px-4 py-3 text-sm ring-1 ring-amber-400/30">
            <span className="flex items-center gap-2"><Eye size={15} className="text-amber-500" /> Viewing version {viewing.version_number} (read-only){viewing.change_note ? `: “${viewing.change_note}”` : ''}</span>
            <button onClick={() => setViewing(null)} className="btn-ghost !py-1.5 text-xs">Back to current (v{policy.current_version})</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {typing && !viewing ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-teal-500 dark:text-teal-400"><Sparkles size={15} /> Freshly drafted. You can edit any section once it's finished typing.</div>
            <PolicyDocument doc={docFor(data.version.content, policy.current_version)} typed onDone={() => setTyping(false)} />
          </div>
        ) : (
          <article className="rounded-2xl bg-white p-5 text-slate-800 shadow-2xl ring-1 ring-black/5 sm:p-10">
            <DocHeader company={policy.company} title={policy.title} version={shownVersion} effectiveDate={policy.effective_date} framework={policy.framework || '—'} />
            <div className="mt-4 space-y-2">
              {(viewing ? viewing.content : sections).map((s, i) => (
                <section key={`${i}-${s.title}`} className={`group relative rounded-xl p-3 transition ${editing === i ? 'bg-teal-50 ring-2 ring-teal-500/40' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-indigo-950"><span className="mr-2 text-teal-600">{s.number ?? i + 1}.</span>{s.title}</h3>
                    {!viewing && editing !== i && (
                      <button onClick={() => startEdit(s, i)} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 sm:opacity-0 sm:group-hover:opacity-100">
                        <Pencil size={12} /> Edit
                      </button>
                    )}
                  </div>
                  {editing === i ? (
                    <div className="mt-2">
                      <textarea autoFocus value={buffer} onChange={(e) => setBuffer(e.target.value)} rows={Math.max(4, buffer.split('\n').length + 1)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-3 font-sans text-sm leading-relaxed text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" />
                      <p className="mt-1 text-[11px] text-slate-500">Tip: start a line with "• " to make it a bullet.</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={applyEdit} className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"><Check size={13} /> Apply</button>
                        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"><X size={13} /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1.5 text-sm leading-relaxed"><SectionBody content={s.content} /></div>
                  )}
                </section>
              ))}
            </div>
          </article>
        )}

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="glass p-4">
            <div className="label">Status</div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-line/[0.04] p-1">
              {STATUS_FLOW.map((s) => (
                <button key={s} onClick={() => setStatus(s)} disabled={!!statusBusy}
                  className={`relative rounded-lg px-2 py-3 text-xs font-semibold transition sm:py-2 ${policy.status === s ? 'text-white' : 'text-muted hover:text-ink'}`}>
                  {policy.status === s && <motion.span layoutId="status-seg" className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-teal-500" />}
                  <span className="relative inline-flex items-center gap-1">{statusBusy === s && <Loader2 size={11} className="animate-spin" />}{s}</span>
                </button>
              ))}
            </div>
            {policy.status === 'Expired' && <p className="mt-2 text-xs text-rose-400">This policy is marked Expired. Choose a status above to reinstate it.</p>}
            <p className="mt-2 text-[11px] text-muted">Effective {fmtDate(policy.effective_date)}</p>
          </div>
          <div className="glass p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold"><History size={16} className="text-teal-400" /> Version history</div>
            {!versions ? (versionsApi.error ? <p className="text-xs text-rose-400">{versionsApi.error.message}</p> : <SkeletonRows rows={2} />) : (
              <ol className="relative ml-1.5 border-l border-line/10">
                {versions.map((v) => {
                  const isCurrent = v.version_number === policy.current_version;
                  const isShown = v.version_number === shownVersion;
                  return (
                    <li key={v.version_number} className="relative pb-4 pl-5 last:pb-0">
                      <span className={`absolute -left-[7px] top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-surface ${isCurrent ? 'bg-teal-400' : 'bg-line/20'}`}>
                        {isCurrent && <GitCommit size={9} className="text-slate-900" />}
                      </span>
                      <button onClick={() => viewVersion(v.version_number)} disabled={loadingVersion !== null}
                        className={`-mx-2 -my-1 w-[calc(100%+1rem)] rounded-lg px-2 py-1 text-left transition hover:bg-line/[0.05] ${isShown ? 'bg-line/[0.05]' : ''}`}>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          v{v.version_number}
                          {isCurrent && <span className="chip bg-teal-400/15 !py-0 text-teal-500 dark:text-teal-300">current</span>}
                          {isShown && !isCurrent && <span className="chip bg-amber-400/15 !py-0 text-amber-500">viewing</span>}
                          {loadingVersion === v.version_number && <Loader2 size={12} className="animate-spin text-muted" />}
                        </div>
                        <div className="text-xs text-muted">{v.change_note || '—'}</div>
                        <div className="text-[11px] text-muted">{v.author} · {fmtDate(v.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </div>

      <Modal open={saveOpen} onClose={() => !saving && setSaveOpen(false)} title={`Save as version ${policy.current_version + 1}`}
        footer={<><button className="btn-ghost" onClick={() => setSaveOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={saveVersion} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save version</button></>}>
        <label className="label" htmlFor="change-note">Change note</label>
        <input id="change-note" autoFocus className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
          placeholder="e.g. Added forklift rules to the Procedure section" onKeyDown={(e) => e.key === 'Enter' && saveVersion()} />
        <p className="mt-2 text-xs text-muted">Version {policy.current_version} stays in the history, so you can always look back at it.</p>
      </Modal>
    </div>
  );
}
