import { useId } from 'react';
import { Link } from 'react-router-dom';

export function ShieldMark({ size = 32 }) {
  // Unique gradient id per instance: a shared id breaks when the first SVG is display:none.
  const gid = `cp-shield-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <path d="M32 4 L54 12 V30 C54 44 44.5 54.5 32 60 C19.5 54.5 10 44 10 30 V12 Z" fill={`url(#${gid})`} />
      <path d="M22 32 L29 39 L43 24" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-[15px] sm:text-base' : 'text-xl';
  return (
    <Link to={to} className="group inline-flex shrink-0 items-center gap-2" aria-label="GIDO ComplyPilot home">
      <span className="drop-shadow-[0_0_12px_rgba(45,212,191,0.45)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <ShieldMark size={size === 'lg' ? 38 : size === 'sm' ? 24 : 32} />
      </span>
      <span className={`whitespace-nowrap font-display font-bold tracking-tight ${text}`}>
        <span className="text-ink">GIDO</span>{' '}
        <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-teal-400 bg-clip-text text-transparent">Comply</span>
        <span className="text-ink">Pilot</span>
      </span>
    </Link>
  );
}
