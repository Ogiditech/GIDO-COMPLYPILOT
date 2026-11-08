import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Sparkles, FileText, AlertTriangle, ClipboardCheck, Building2, Bell, Sun, Moon, ShieldCheck, Plus, X, LogOut, Loader2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { scoreColor } from './ScoreRing';
import { initials, daysUntil } from '../data/constants';

export const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/generate', label: 'Generate Policy', icon: Sparkles },
  { to: '/library', label: 'Policy Library', icon: FileText },
  { to: '/risks', label: 'Risk Register', icon: AlertTriangle },
  { to: '/acknowledgements', label: 'Staff Acknowledgements', icon: ClipboardCheck },
  { to: '/settings', label: 'Organisation', icon: Building2 },
];

function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [score, setScore] = useState(null);
  useEffect(() => {
    let live = true;
    api('/dashboard').then((d) => live && setScore(d.score)).catch(() => {});
    return () => { live = false; };
  }, [pathname]);
  const org = user.organisation;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line/[0.06] bg-surface/40 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="px-2"><Logo to="/" /></div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'text-ink' : 'text-muted hover:bg-line/[0.04] hover:text-ink'
              }`}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-teal-400/10 ring-1 ring-teal-400/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                <Icon size={18} className={`relative ${isActive ? 'text-teal-400' : ''}`} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="glass mt-4 p-4">
        <div className="flex items-center gap-2 text-xs text-muted"><ShieldCheck size={14} className="text-teal-400" /> {org.plan} plan</div>
        <div className="mt-2 truncate text-sm font-semibold">{org.name}</div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/10">
          <motion.div className="h-full rounded-full" style={{ background: scoreColor(score ?? 0) }}
            initial={{ width: 0 }} animate={{ width: `${score ?? 0}%` }} transition={{ duration: 1.2 }} />
        </div>
        <div className="mt-1.5 text-[11px] text-muted">Compliance score <b className="text-ink">{score === null ? '…' : `${score}%`}</b></div>
      </div>
    </aside>
  );
}

function NotificationBell() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    let live = true;
    api('/policies').then(({ policies }) => {
      if (!live) return;
      setItems(policies
        .filter((p) => p.status !== 'Expired' && p.next_review_date)
        .map((p) => ({ ...p, days: daysUntil(p.next_review_date) }))
        .filter((p) => p.days <= 30)
        .sort((a, b) => a.days - b.days));
    }).catch(() => live && setItems([]));
    return () => { live = false; };
  }, [pathname]);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const count = items?.length || 0;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-line/[0.06] hover:text-ink" aria-label="Notifications">
        <Bell size={19} />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-bg">
            {count}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
            className="glass absolute right-0 z-50 mt-2 w-[min(88vw,22rem)] !bg-surface p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Upcoming reviews</span>
              <button onClick={() => setOpen(false)} className="p-1 text-muted hover:text-ink" aria-label="Close"><X size={14} /></button>
            </div>
            {items === null ? (
              <div className="grid place-items-center py-6 text-muted"><Loader2 size={18} className="animate-spin" /></div>
            ) : count === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted">You're all caught up. No reviews are due in the next 30 days. 🎉</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto scrollbar-thin">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link to={`/editor/${n.id}`} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-line/[0.05]">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.days < 0 ? 'bg-rose-500' : n.days <= 7 ? 'bg-amber-400' : 'bg-teal-400'}`} />
                      <span className="flex-1">
                        <span className="block text-sm font-medium leading-snug">{n.title}</span>
                        <span className="text-xs text-muted">
                          {n.days < 0 ? `Overdue by ${Math.abs(n.days)} days` : n.days === 0 ? 'Due today' : `Review due in ${n.days} days`}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Topbar() {
  const { theme, toggleTheme, toast } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const doLogout = async () => {
    setBusy(true);
    try { await logout(); toast('You\'ve been logged out. See you soon!', 'info'); navigate('/'); }
    catch { toast('We couldn\'t log you out. Please try again.', 'error'); setBusy(false); }
  };
  return (
    <header className="sticky top-0 z-30 border-b border-line/[0.06] bg-bg/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="lg:hidden"><Logo to="/" size="sm" /></div>
        <div className="hidden text-sm text-muted lg:block">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <span className="font-medium text-ink">{user.full_name.split(' ')[0]}</span> 👋
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link to="/generate" className="btn-primary mr-2 hidden !py-2 xl:inline-flex"><Plus size={16} /> New policy</Link>
          <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-line/[0.06] hover:text-ink" aria-label="Toggle theme">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="block">
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </motion.span>
            </AnimatePresence>
          </button>
          <NotificationBell />
          <Link to="/settings" className="flex items-center gap-2.5 rounded-xl p-0.5 hover:bg-line/[0.05] sm:ml-1 sm:py-1 sm:pl-1 sm:pr-3" aria-label="Organisation settings">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-xs font-bold text-white ring-2 ring-teal-400/30">
              {initials(user.full_name)}
            </span>
            <span className="hidden min-w-0 text-left leading-tight sm:block">
              <span className="block max-w-[10rem] truncate text-sm font-semibold">{user.full_name}</span>
              <span className="block max-w-[10rem] truncate text-[11px] text-muted">{user.organisation.name}</span>
            </span>
          </Link>
          <button onClick={doLogout} disabled={busy} className="grid h-10 w-10 place-items-center rounded-xl text-muted transition hover:bg-rose-500/10 hover:text-rose-400" aria-label="Log out" title="Log out">
            {busy ? <Loader2 size={19} className="animate-spin" /> : <LogOut size={19} />}
          </button>
        </div>
      </div>
    </header>
  );
}

const MOBILE = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/library', label: 'Library', icon: FileText },
  { to: '/generate', label: 'Generate', icon: Sparkles, fab: true },
  { to: '/risks', label: 'Risks', icon: AlertTriangle },
  { to: '/acknowledgements', label: 'Staff', icon: ClipboardCheck },
];

function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line/[0.08] bg-surface/80 backdrop-blur-xl lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {MOBILE.map(({ to, label, icon: Icon, fab }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-teal-400' : 'text-muted'}`}>
            {({ isActive }) =>
              fab ? (
                <span className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-white shadow-glow ring-4 ring-bg">
                  <Icon size={22} />
                </span>
              ) : (
                <>
                  {isActive && <motion.span layoutId="mob-dot" className="absolute top-1 h-1 w-6 rounded-full bg-teal-400" />}
                  <Icon size={20} />
                  {label}
                </>
              )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppShell() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return (
    <div className="relative min-h-screen">
      <div className="bg-mesh pointer-events-none fixed inset-0 -z-10" />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <motion.main key={location.pathname}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <Outlet />
        </motion.main>
        <footer className="hidden px-8 pb-6 text-xs text-muted lg:block">
          © {new Date().getFullYear()} GIDO ComplyPilot · Generated policies are a starting point, not legal advice.
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
