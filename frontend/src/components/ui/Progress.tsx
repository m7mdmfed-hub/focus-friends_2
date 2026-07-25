import { cn } from '@/lib/utils';

export function Progress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
