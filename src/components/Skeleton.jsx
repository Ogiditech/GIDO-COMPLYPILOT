// Glass-style loading skeletons
export function Bone({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-line/[0.07] ${className}`}>
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(var(--line)/0.08),transparent)] bg-[length:200%_100%]" />
    </div>
  );
}

export function SkeletonCard({ className = '', lines = 3 }) {
  return (
    <div className={`glass p-5 ${className}`} aria-hidden="true">
      <Bone className="h-10 w-10 rounded-xl" />
      <Bone className="mt-4 h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => <Bone key={i} className={`mt-2 h-3 ${i % 2 ? 'w-1/2' : 'w-5/6'}`} />)}
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' }) {
  return (
    <div className={className} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2"><Bone className="h-3.5 w-1/2" /><Bone className="h-3 w-1/3" /></div>
          <Bone className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <Bone className="h-8 w-64" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass flex flex-col items-center p-6 lg:row-span-2">
          <Bone className="h-[210px] w-[210px] rounded-full" />
          <Bone className="mt-6 h-24 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}</div>
        <div className="lg:col-span-2"><SkeletonCard lines={1} /></div>
      </div>
    </div>
  );
}
