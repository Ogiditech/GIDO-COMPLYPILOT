import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, Layers, FileText, SlidersHorizontal, ArrowLeft, ArrowRight, Sparkles, Check, Info, AlertTriangle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import { Bone } from '../components/Skeleton';
import { POLICY_TYPE_META, FRAMEWORK_REGION, OPTIONAL_SECTIONS, industries, locations } from '../data/constants';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { title: 'Company', icon: Building2 },
  { title: 'Policy type', icon: FileText },
  { title: 'Framework', icon: Layers },
  { title: 'Sections', icon: SlidersHorizontal },
];

const DRAFT_MESSAGES = [
  'Reading your company profile…',
  'Mapping framework requirements…',
  'Drafting policy statements…',
  'Adding roles, training & reporting…',
  'Numbering sections & saving version 1…',
];

function Stepper({ step }) {
  return (
    <div className="mb-6 flex items-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = i < step; const active = i === step;
        return (
          <div key={s.title} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className={`flex items-center gap-2 ${active ? 'text-ink' : done ? 'text-teal-400' : 'text-muted'}`}>
              <motion.span animate={{ scale: active ? 1.08 : 1 }}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-1 transition-colors ${
                  done ? 'bg-teal-400 text-slate-900 ring-teal-400' : active ? 'bg-gradient-to-br from-indigo-600 to-teal-500 text-white ring-teal-400/50 shadow-glow' : 'bg-line/[0.04] ring-line/15'
                }`}>
                {done ? <Check size={14} /> : i + 1}
              </motion.span>
              <span className="hidden text-sm font-medium md:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 overflow-hidden bg-line/10">
                <motion.div className="h-full bg-teal-400" animate={{ width: done ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OptionCard({ selected, onClick, children, disabled = false }) {
  return (
    <motion.button type="button" whileHover={disabled ? undefined : { y: -3 }} whileTap={disabled ? undefined : { scale: 0.98 }} onClick={onClick} disabled={disabled}
      className={`relative rounded-2xl border p-4 text-left transition-all ${
        selected ? 'border-teal-400/70 bg-teal-400/[0.08] shadow-glow' : 'border-line/10 bg-line/[0.02] hover:border-line/25'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-teal-400 text-slate-900"><Check size={12} strokeWidth={3} /></motion.span>
      )}
      {children}
    </motion.button>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-teal-500' : 'bg-line/20'}`}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  );
}

function Drafting() {
  const [i, setI] = useState(0);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, DRAFT_MESSAGES.length - 1)), 520);
    const p = setInterval(() => setPct((x) => Math.min(x + 2 + Math.random() * 3, 97)), 60);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="glass relative mx-auto max-w-xl overflow-hidden p-8 text-center sm:p-12">
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-56 rounded-full bg-teal-400/25 blur-3xl" />
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#14b8a6,#4f46e5)] p-[3px]">
        <div className="grid h-full w-full place-items-center rounded-full bg-surface">
          <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}><Sparkles className="text-teal-400" /></motion.div>
        </div>
      </motion.div>
      <h2 className="relative mt-6 text-xl font-semibold">Drafting your policy…</h2>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-2 text-sm text-muted">
          {DRAFT_MESSAGES[i]}
        </motion.p>
      </AnimatePresence>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-line/10">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500 bg-[length:200%_100%] animate-shimmer"
          animate={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted">{Math.round(pct)}%</div>
    </motion.div>
  );
}

export default function Generator() {
  const { toast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/templates');
  const org = user.organisation;

  const [step, setStep] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    company_name: org.name || '', industry: org.industry || '', employee_count: org.employee_count ?? '', location: org.emirate_or_country || '',
    policy_type: '', framework_code: '',
    include: { roles: true, training: true, reporting: true, review: true },
  });
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const typeInfo = data?.policy_types.find((t) => t.type === form.policy_type);
  const available = new Set(typeInfo?.frameworks || []);
  const framework = data?.frameworks.find((f) => f.code === form.framework_code);

  const chooseType = (type) => {
    const info = data.policy_types.find((t) => t.type === type);
    setForm((f) => ({ ...f, policy_type: type, framework_code: info.frameworks.includes(f.framework_code) ? f.framework_code : '' }));
    setErrors((e) => ({ ...e, policy_type: undefined }));
  };

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!String(form.company_name).trim()) e.company_name = 'Please tell us your company name. It appears throughout the policy.';
      if (!form.industry) e.industry = 'Pick the closest industry.';
      if (!form.employee_count || Number(form.employee_count) < 1) e.employee_count = 'Enter at least 1 employee.';
      if (!form.location) e.location = 'Choose where you operate.';
    }
    if (step === 1 && !form.policy_type) e.policy_type = 'Choose the policy you want to create.';
    if (step === 2 && !form.framework_code) e.framework_code = 'Choose a framework. "General Best Practice" is a good default when available.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate() && setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const generate = async () => {
    setDrafting(true);
    try {
      const [res] = await Promise.all([
        api('/policies', {
          method: 'POST',
          body: {
            policy_type: form.policy_type,
            framework_code: form.framework_code,
            include: form.include,
            details: { company_name: form.company_name, industry: form.industry, employee_count: form.employee_count, location: form.location },
          },
        }),
        new Promise((r) => setTimeout(r, 2600)), // let the drafting animation breathe
      ]);
      toast('Policy drafted and saved as version 1.');
      navigate(`/editor/${res.id}`, { state: { justGenerated: true } });
    } catch (err) {
      setDrafting(false);
      toast(`We couldn't draft that policy. ${err.message}`, 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Policy generator" title="Generate a new policy"
        subtitle="Four quick steps. It's saved as a Draft you can edit, version and share." />

      {error && !data ? <ErrorState error={error} onRetry={reload} /> : (
        <AnimatePresence mode="wait">
          {drafting ? <Drafting key="d" /> : (
            <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass mx-auto max-w-4xl p-5 sm:p-8">
              <Stepper step={step} />
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  {step === 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <h2 className="text-lg font-semibold sm:col-span-2">Tell us about your company</h2>
                      <Field label="Company name" error={errors.company_name} className="sm:col-span-2">
                        <input className="input" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="e.g. Al Noor Construction LLC" />
                      </Field>
                      <Field label="Industry" error={errors.industry}>
                        <select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                          <option value="">Select industry…</option>
                          {[...new Set([...(form.industry ? [form.industry] : []), ...industries])].map((i) => <option key={i}>{i}</option>)}
                        </select>
                      </Field>
                      <Field label="Number of employees" error={errors.employee_count}>
                        <input type="number" min="1" inputMode="numeric" className="input" value={form.employee_count} onChange={(e) => set('employee_count', e.target.value)} />
                      </Field>
                      <Field label="Emirate / country" error={errors.location} className="sm:col-span-2">
                        <select className="input" value={form.location} onChange={(e) => set('location', e.target.value)}>
                          <option value="">Select location…</option>
                          {[...new Set([...(form.location ? [form.location] : []), ...locations])].map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </Field>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h2 className="mb-4 text-lg font-semibold">Which policy do you need?</h2>
                      {loading && !data ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Bone key={i} className="h-32 rounded-2xl" />)}</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {data.policy_types.map(({ type, frameworks }) => {
                            const meta = POLICY_TYPE_META[type] || { icon: FileText, blurb: '' };
                            const Icon = meta.icon;
                            return (
                              <OptionCard key={type} selected={form.policy_type === type} onClick={() => chooseType(type)}>
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/25 to-teal-400/20 text-teal-400"><Icon size={20} /></span>
                                <div className="mt-3 text-sm font-semibold">{type}</div>
                                <div className="mt-0.5 text-xs text-muted">{meta.blurb}</div>
                                <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{frameworks.length} frameworks</div>
                              </OptionCard>
                            );
                          })}
                        </div>
                      )}
                      {errors.policy_type && <ErrorText>{errors.policy_type}</ErrorText>}
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h2 className="mb-1 text-lg font-semibold">Align it to a framework</h2>
                      <p className="mb-4 text-sm text-muted">Frameworks with a dedicated <b className="text-ink">{form.policy_type}</b> template are selectable.</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {data.frameworks.map((f) => {
                          const ok = available.has(f.code);
                          return (
                            <OptionCard key={f.code} disabled={!ok} selected={form.framework_code === f.code} onClick={() => ok && set('framework_code', f.code)}>
                              <span className="chip bg-line/[0.06] text-muted">{ok ? FRAMEWORK_REGION[f.code] : 'No template yet'}</span>
                              <div className="mt-2 font-display text-base font-semibold">{f.name}</div>
                              <div className="mt-0.5 text-xs text-muted">{f.description}</div>
                            </OptionCard>
                          );
                        })}
                      </div>
                      {errors.framework_code && <ErrorText>{errors.framework_code}</ErrorText>}
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h2 className="mb-1 text-lg font-semibold">Optional sections</h2>
                      <p className="mb-4 text-sm text-muted">Purpose, Scope, Definitions and Procedure are always included.</p>
                      <div className="space-y-2">
                        {OPTIONAL_SECTIONS.map((s) => (
                          <label key={s.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line/10 bg-line/[0.02] p-4 hover:border-line/20">
                            <div>
                              <div className="text-sm font-semibold">{s.label}</div>
                              <div className="text-xs text-muted">{s.desc}</div>
                            </div>
                            <Toggle on={form.include[s.id]} onChange={() => setForm((f) => ({ ...f, include: { ...f.include, [s.id]: !f.include[s.id] } }))} />
                          </label>
                        ))}
                      </div>
                      <div className="mt-5 flex items-start gap-2 rounded-xl bg-indigo-500/10 p-3 text-xs text-muted ring-1 ring-indigo-500/20">
                        <Info size={14} className="mt-0.5 shrink-0 text-indigo-400" />
                        <span>Generating a <b className="text-ink">{form.policy_type}</b> policy for <b className="text-ink">{form.company_name}</b>, aligned to <b className="text-ink">{framework?.name}</b>. It will be saved to your library as a Draft (version 1).</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-line/[0.06] pt-5">
                <button onClick={back} disabled={step === 0} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
                {step < 3 ? (
                  <button onClick={next} disabled={step >= 1 && !data} className="btn-primary">Continue <ArrowRight size={16} /></button>
                ) : (
                  <button onClick={generate} className="btn-primary px-6"><Sparkles size={16} /> Generate policy</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
      <AlertTriangle size={12} /> {children}
    </motion.p>
  );
}
