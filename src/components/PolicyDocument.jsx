import { useEffect, useMemo, useState } from 'react';
import { FastForward } from 'lucide-react';
import { fmtDate } from '../data/constants';

function useTypewriter(full, enabled, onDone) {
  const [n, setN] = useState(enabled ? 0 : full.length);
  useEffect(() => {
    if (!enabled) { setN(full.length); return undefined; }
    setN(0);
    const t = setInterval(() => setN((x) => (x >= full.length ? x : x + 9)), 16);
    return () => clearInterval(t);
  }, [full, enabled]);
  const done = n >= full.length;
  useEffect(() => { if (enabled && done) onDone?.(); }, [enabled, done]); // eslint-disable-line react-hooks/exhaustive-deps
  return [Math.min(n, full.length), () => setN(full.length)];
}

export function DocHeader({ company, title, version, effectiveDate, framework }) {
  return (
    <header className="border-b-2 border-indigo-900/80 pb-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-600">{company}</div>
      <h2 className="mt-1 font-display text-2xl font-bold text-indigo-950 sm:text-3xl">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
        <span><b className="text-slate-700">Version:</b> {version}</span>
        <span><b className="text-slate-700">Effective date:</b> {fmtDate(effectiveDate, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <span><b className="text-slate-700">Framework:</b> {framework}</span>
      </div>
    </header>
  );
}

export function SectionBody({ content }) {
  return content.split('\n').map((line, i) => (line.startsWith('• ') ? (
    <p key={i} className="flex gap-2 pl-1"><span className="text-teal-600">•</span><span>{line.slice(2)}</span></p>
  ) : <p key={i} className="whitespace-pre-wrap">{line}</p>));
}

/** Read-only document with optional typewriter reveal */
export default function PolicyDocument({ doc, typed = false, onDone }) {
  const flat = useMemo(() => doc.sections.map((s) => `${s.title}\n${s.content}`).join('\n\n'), [doc]);
  const [count, skip] = useTypewriter(flat, typed, onDone);
  const done = count >= flat.length;

  let remaining = count;
  const visible = doc.sections.map((s) => {
    const titleLen = s.title.length + 1;
    const total = titleLen + s.content.length + 2;
    const take = Math.max(0, Math.min(remaining, total));
    remaining -= total;
    return { ...s, showTitle: take > 0, body: s.content.slice(0, Math.max(0, take - titleLen)), active: take > 0 && take < total };
  });

  return (
    <div className="relative">
      {typed && !done && (
        <button onClick={skip} className="btn-ghost absolute right-3 top-3 z-10 !bg-white/90 !px-3 !py-1.5 text-xs !text-slate-700">
          <FastForward size={14} /> Skip
        </button>
      )}
      <article className="rounded-2xl bg-white p-6 text-slate-800 shadow-2xl ring-1 ring-black/5 sm:p-10">
        <DocHeader {...doc} />
        <div className="mt-6 space-y-6">
          {visible.map((s) => s.showTitle && (
            <section key={`${s.number}-${s.title}`}>
              <h3 className="font-display text-base font-bold text-indigo-950">
                <span className="mr-2 text-teal-600">{s.number}.</span>{s.title}
              </h3>
              <div className="mt-2 space-y-1.5 text-sm leading-relaxed">
                <SectionBody content={s.body} />
                {s.active && <span className="inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-teal-600" />}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
