import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Building2, Layers, Download, ShieldCheck, FileText, AlertTriangle, ClipboardCheck, Scale, Sun, Moon, Check, Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';
import AnimatedCounter from '../components/AnimatedCounter';
import ScoreRing from '../components/ScoreRing';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

const FRAMEWORKS = ['ISO 45001', 'ISO 27001', 'UAE PDPL', 'Abu Dhabi OSHAD', 'GDPR', 'General Best Practice'];

// Above-the-fold: animate on mount
const enter = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] },
});

// Below-the-fold: animate when scrolled into view
const fade = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] },
});

const STEPS = [
  { icon: Building2, title: 'Describe your business', text: 'Industry, headcount and location. Takes about 30 seconds.' },
  { icon: Layers, title: 'Pick a framework', text: 'ISO 45001, ISO 27001, UAE PDPL, OSHAD, GDPR or best practice.' },
  { icon: Download, title: 'Download your policy', text: 'A numbered, versioned policy ready to edit, share and export to PDF.' },
];

const FEATURES = [
  { icon: FileText, title: 'Policy generator', text: '8 policy types × 6 frameworks, tailored to your organisation.' },
  { icon: AlertTriangle, title: 'Risk register', text: 'A likelihood × impact heat map, with every risk linked to its controlling policy.' },
  { icon: ClipboardCheck, title: 'Staff sign-off', text: 'Track who has read and acknowledged each policy, and nudge everyone else.' },
  { icon: Scale, title: 'Audit-ready', text: 'Version history, review deadlines and exportable evidence.' },
];

function HeroPreview() {
  return (
    <motion.div initial={{ opacity: 0, y: 30, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md [perspective:1000px]">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-600/30 to-teal-400/30 blur-3xl" />
      <div className="glass relative p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted">Example workspace</div>
            <div className="font-display text-lg font-semibold">Compliance overview</div>
          </div>
          <span className="chip bg-teal-400/15 text-teal-500 ring-1 ring-teal-400/30 dark:text-teal-300">● Preview</span>
        </div>
        <div className="mt-4 flex items-center gap-5">
          <ScoreRing value={78} size={132} stroke={11} showLabel={false} />
          <div className="flex-1 space-y-2.5">
            {[['Active policies', '12', 'text-teal-400'], ['Reviews due', '3', 'text-amber-400'], ['Open risks', '7', 'text-rose-400']].map(([k, v, c]) => (
              <div key={k} className="flex items-center justify-between rounded-lg bg-line/[0.04] px-3 py-2 text-sm">
                <span className="text-muted">{k}</span><b className={c}>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-line/10 bg-line/[0.03] p-3 font-mono text-[11px] leading-relaxed text-muted">
          <span className="text-teal-400">✓</span> 1. Purpose: Your company is committed to…<br />
          <span className="text-teal-400">✓</span> 2. Scope: applies to all 240 employees…<br />
          <span className="text-indigo-400">▍</span> 3. Policy Statement<span className="animate-blink">_</span>
        </div>
      </div>
      <motion.div className="glass absolute -bottom-6 -left-4 hidden items-center gap-2 !bg-surface px-3 py-2 text-xs sm:flex"
        animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
        <ShieldCheck size={16} className="text-teal-400" /> ISO 45001 aligned
      </motion.div>
      <motion.div className="glass absolute -right-4 -top-5 hidden items-center gap-2 !bg-surface px-3 py-2 text-xs sm:flex"
        animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 6 }}>
        <Check size={16} className="text-teal-400" /> 38 / 40 staff signed
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useApp();
  const { user } = useAuth();
  const { data: stats } = useApi('/stats');
  const ctaTo = user ? '/generate' : '/signup';
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="bg-mesh pointer-events-none fixed inset-0 -z-10" />
      <div className="grid-lines pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-line/[0.06] bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#frameworks" className="hover:text-ink">Frameworks</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-line/[0.06] hover:text-ink" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <Link to="/dashboard" className="btn-ghost hidden sm:inline-flex">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden !border-transparent !bg-transparent sm:inline-flex">Log in</Link>
                <Link to="/signup" className="btn-primary hidden !py-2 sm:inline-flex">Sign up free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <motion.div {...enter(0)} className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-600 dark:text-teal-300">
            <Sparkles size={13} className="shrink-0" /> <span><b>GIDO ComplyPilot</b> · Built for safety officers, DPOs & busy managers</span>
          </motion.div>
          <motion.h1 {...enter(0.05)} className="text-[2.6rem] font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            Compliance,<br /><span className="text-gradient">done in minutes.</span>
          </motion.h1>
          <motion.p {...enter(0.12)} className="mt-6 max-w-xl text-base text-muted sm:text-lg">
            <b className="text-ink">GIDO ComplyPilot</b> drafts workplace safety, data protection and compliance policies tailored to your business,
            then helps you track risks, review dates and staff sign-off in one calm, audit-ready place.
          </motion.p>
          <motion.div {...enter(0.2)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={ctaTo} className="btn-primary px-6 py-3.5 text-base">
              Generate Your First Policy <ArrowRight size={18} />
            </Link>
            <Link to={user ? '/dashboard' : '/login'} className="btn-ghost px-6 py-3.5 text-base">{user ? 'Open dashboard' : 'Log in'}</Link>
          </motion.div>

          <motion.dl {...enter(0.28)} className="mt-12 grid max-w-lg grid-cols-3 gap-4">
            {[
              [stats?.policies_generated ?? 0, 'Policies generated', ''],
              [stats?.organisations_protected ?? 0, 'Organisations protected', ''],
              [stats?.frameworks_covered ?? 0, 'Frameworks covered', ''],
            ].map(([v, l, s]) => (
              <div key={l}>
                <dd className="font-display text-2xl font-bold sm:text-3xl">
                  <AnimatedCounter value={v} duration={2.2} />{s}
                </dd>
                <dt className="mt-1 text-xs text-muted">{l}</dt>
              </div>
            ))}
          </motion.dl>
        </div>
        <HeroPreview />
      </section>

      {/* Frameworks marquee */}
      <section id="frameworks" className="border-y border-line/[0.06] bg-line/[0.02] py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-semibold text-muted">
          {FRAMEWORKS.map((f) => (
            <span key={f} className="flex items-center gap-2"><ShieldCheck size={15} className="text-teal-400" />{f}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.div {...fade()} className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-500 dark:text-teal-400">How it works</div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From blank page to signed-off policy in three steps</h2>
        </motion.div>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <motion.div key={s.title} {...fade(i * 0.12)} whileHover={{ y: -6 }} className="glass relative p-6 transition-shadow hover:shadow-glow">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-glow">
                  <s.icon size={22} />
                </div>
                <span className="font-display text-4xl font-bold text-line/10">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fade(i * 0.08)} whileHover={{ y: -4 }} className="glass p-5 transition-shadow hover:shadow-glow">
              <f.icon size={22} className="text-teal-400" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div {...fade()} className="relative mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-teal-600 p-8 text-white sm:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Your next audit, without the panic.</h2>
              <p className="mt-2 max-w-xl text-white/80">Generate your first policy free. No credit card, no consultants, no 40-page templates.</p>
            </div>
            <Link to={ctaTo} className="btn bg-white px-6 py-3.5 text-base text-indigo-700 hover:bg-white/90">
              Generate Your First Policy <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-line/[0.06] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted sm:flex-row sm:px-6">
          <Logo size="sm" />
          <p className="text-center text-xs">© {new Date().getFullYear()} GIDO ComplyPilot. Generated policies are a starting point and are not legal advice.</p>
        </div>
      </footer>
    </div>
  );
}
