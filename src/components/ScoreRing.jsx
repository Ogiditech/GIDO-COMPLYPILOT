import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export const scoreColor = (v) => (v >= 75 ? '#2dd4bf' : v >= 50 ? '#f59e0b' : '#f43f5e');
export const scoreLabel = (v) => (v >= 75 ? 'Strong' : v >= 50 ? 'Needs attention' : 'At risk');

export default function ScoreRing({ value, size = 200, stroke = 14, label = 'Compliance score', showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(value);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(var(--line) / 0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display font-bold leading-none" style={{ fontSize: size * 0.24 }}>
          <AnimatedCounter value={value} />
          <span className="text-muted" style={{ fontSize: size * 0.11 }}>%</span>
        </div>
        {showLabel && (
          <>
            <div className="mt-1 text-[11px] uppercase tracking-widest text-muted">{label}</div>
            <div className="mt-1 text-xs font-semibold" style={{ color }}>{scoreLabel(value)}</div>
          </>
        )}
      </div>
    </div>
  );
}
