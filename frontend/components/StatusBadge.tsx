import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'PAID' | 'PENDING'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border transition-all hover:scale-103',
      status === 'PAID'
        ? 'bg-[var(--paid-bg)] text-[var(--paid-text)] border-[rgba(52,211,153,0.35)] shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),2px_2px_4px_rgba(163,177,198,0.15)]'
        : 'bg-[var(--pending-bg)] text-[var(--pending-text)] border-[rgba(253,230,138,0.45)] shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),2px_2px_4px_rgba(163,177,198,0.15)]',
      className
    )}>
      {status === 'PAID' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
      {status === 'PENDING' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />}
      {status}
    </span>
  )
}

export function DoctorBadge() {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-indigo-200/50 bg-indigo-50 text-indigo-700 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.9),2px_2px_4px_rgba(163,177,198,0.12)]">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse" />
      Doctor
    </span>
  )
}
