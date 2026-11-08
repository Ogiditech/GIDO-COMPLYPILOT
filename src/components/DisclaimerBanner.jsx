import { AlertTriangle } from 'lucide-react';

export default function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm" role="note">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
      <p>
        <b className="font-semibold">Generated policies are a starting point.</b>{' '}
        <span className="text-muted">Have them reviewed by a qualified compliance or legal professional before adoption.</span>
      </p>
    </div>
  );
}
