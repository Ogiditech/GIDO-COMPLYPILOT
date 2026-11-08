import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff, AlertTriangle, ShieldCheck, Sun, Moon, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { FullScreenLoader } from '../components/RequireAuth';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { industries, locations } from '../data/constants';

function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  const { theme, toggleTheme } = useApp();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="bg-mesh pointer-events-none fixed inset-0 -z-10" />
      <div className="grid-lines pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px]" />
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-line/[0.06] hover:text-ink" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <main className="flex justify-center px-4 pb-16 pt-6 sm:pt-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
          <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/25 to-teal-400/20 blur-3xl" />
          <div className="glass p-6 sm:p-8">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-5 text-center text-sm text-muted">{footer}</p>
        </motion.div>
      </main>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return <div className={className}><label className="label">{label}</label>{children}</div>;
}

function FormError({ message }) {
  if (!message) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert"
      className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-300">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {message}
    </motion.div>
  );
}

function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} className="input pr-10" value={value} onChange={onChange} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Login() {
  const { user, loading, login } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dest = location.state?.from || '/dashboard';

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to={dest} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(form.email, form.password);
      toast(`Welcome back, ${u.full_name.split(' ')[0]}!`);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your GIDO ComplyPilot workspace."
      footer={<>New to GIDO ComplyPilot? <Link to="/signup" className="font-semibold text-teal-500 hover:underline dark:text-teal-400">Create a free account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Work email"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required autoFocus /></Field>
        <Field label="Password"><PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></Field>
        <FormError message={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <>Log in <ArrowRight size={16} /></>}
        </button>
      </form>
    </AuthLayout>
  );
}

export function Signup() {
  const { user, loading, signup } = useAuth();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', company_name: '', industry: '', employee_count: '', emirate_or_country: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/generate" replace />;

  const pwOk = form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.industry || !form.emirate_or_country) { setError('Please choose your industry and emirate/country.'); return; }
    if (!pwOk) { setError('Your password needs at least 8 characters, including a letter and a number.'); return; }
    setBusy(true); setError('');
    try {
      const u = await signup(form);
      toast(`Welcome to GIDO ComplyPilot, ${u.full_name.split(' ')[0]}! Let's create your first policy.`);
      navigate('/generate', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout wide title="Create your workspace" subtitle="Free to start. Your first policy is a couple of minutes away."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-teal-500 hover:underline dark:text-teal-400">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-500 dark:text-teal-400"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal-400/15 text-[10px]">1</span> About you</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2"><input className="input" value={form.full_name} onChange={set('full_name')} autoComplete="name" required autoFocus /></Field>
            <Field label="Work email"><input type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" required /></Field>
            <Field label="Password">
              <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" />
              <p className={`mt-1.5 flex items-center gap-1 text-[11px] ${pwOk ? 'text-teal-500 dark:text-teal-400' : 'text-muted'}`}>
                {pwOk && <CheckCircle2 size={12} />} 8+ characters with a letter and a number
              </p>
            </Field>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-500 dark:text-teal-400"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal-400/15 text-[10px]">2</span> Your company</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" className="sm:col-span-2"><input className="input" value={form.company_name} onChange={set('company_name')} autoComplete="organization" placeholder="e.g. Al Noor Construction LLC" required /></Field>
            <Field label="Industry">
              <select className="input" value={form.industry} onChange={set('industry')} required>
                <option value="">Select industry…</option>
                {industries.map((i) => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Number of employees"><input type="number" min="1" inputMode="numeric" className="input" value={form.employee_count} onChange={set('employee_count')} required /></Field>
            <Field label="Emirate / country" className="sm:col-span-2">
              <select className="input" value={form.emirate_or_country} onChange={set('emirate_or_country')} required>
                <option value="">Select location…</option>
                {locations.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <FormError message={error} />
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <>Create account <ArrowRight size={16} /></>}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted"><ShieldCheck size={13} className="text-teal-400" /> Your password is encrypted and never stored in plain text.</p>
      </form>
    </AuthLayout>
  );
}
