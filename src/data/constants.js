// UI constants only (labels, icons, dropdown options). Business data lives in the database.
import { HardHat, Flame, Lock, ShieldCheck, Scale, AlertTriangle, DoorOpen, Users } from 'lucide-react';

export const POLICY_TYPE_META = {
  'Health & Safety': { icon: HardHat, blurb: 'Protect people from workplace hazards.' },
  'Fire Safety': { icon: Flame, blurb: 'Prevention, detection and response.' },
  'Data Protection': { icon: Lock, blurb: 'Lawful handling of personal data.' },
  'Information Security': { icon: ShieldCheck, blurb: 'Confidentiality, integrity, availability.' },
  'Anti-Bribery': { icon: Scale, blurb: 'Zero tolerance for corruption.' },
  'Incident Reporting': { icon: AlertTriangle, blurb: 'Report, investigate and learn.' },
  'Emergency Evacuation': { icon: DoorOpen, blurb: 'Get everyone out safely.' },
  'Code of Conduct': { icon: Users, blurb: 'How we work and behave.' },
};
export const POLICY_TYPES = Object.keys(POLICY_TYPE_META);

export const FRAMEWORK_REGION = {
  ISO45001: 'International', ISO27001: 'International', UAE_PDPL: 'UAE', OSHAD: 'Abu Dhabi', GDPR: 'EU', BEST_PRACTICE: 'Any',
};

export const OPTIONAL_SECTIONS = [
  { id: 'roles', label: 'Roles & Responsibilities', desc: 'Who owns, approves and follows the policy.' },
  { id: 'training', label: 'Training', desc: 'Induction, refresher and competency requirements.' },
  { id: 'reporting', label: 'Reporting', desc: 'How concerns, incidents and breaches are raised.' },
  { id: 'review', label: 'Review & Approval', desc: 'Effective date, review schedule and sign-off.' },
];

export const ROLES = ['Admin', 'Compliance Officer', 'Viewer'];
export const PLANS = ['Starter', 'Business', 'Enterprise'];

export const tips = [
  'Review high-risk policies at least every 12 months, or immediately after a serious incident.',
  'Under UAE PDPL, keep a record of processing activities and be ready to show it to the regulator.',
  'Near-miss reporting is a leading indicator. Celebrate reports, don\'t punish them.',
  'Assign one named owner to every policy. "Everyone" owning it means no one does.',
  'Run a fire evacuation drill at least twice a year and record the time it takes to clear the building.',
  'ISO 27001 auditors love evidence: keep training records and acknowledgement logs exportable.',
  'Keep policies short and plain-language. Procedures can carry the detail.',
];

export const industries = [
  'Construction', 'Logistics & Warehousing', 'Healthcare', 'Hospitality', 'Retail',
  'Manufacturing', 'Oil & Gas', 'Technology / SaaS', 'Financial Services', 'Education', 'Professional Services', 'Other',
];

export const locations = [
  'Abu Dhabi, UAE', 'Dubai, UAE', 'Sharjah, UAE', 'Ajman, UAE', 'Ras Al Khaimah, UAE',
  'Fujairah, UAE', 'Umm Al Quwain, UAE', 'Saudi Arabia', 'Qatar', 'United Kingdom', 'European Union', 'Other',
];

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  (d ? new Date(String(d).length === 10 ? `${d}T00:00:00` : d).toLocaleDateString(undefined, opts) : '—');

export const daysUntil = (d) => {
  if (!d) return null;
  const t = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 864e5);
};

export function timeAgo(ts) {
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'Yesterday';
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return fmtDate(ts);
}
