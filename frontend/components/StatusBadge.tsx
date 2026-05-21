import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'PAID' | 'PENDING'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
      status === 'PAID'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-amber-100 text-amber-700',
      className
    )}>
      {status}
    </span>
  )
}

export function DoctorBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-indigo-100 text-indigo-700">
      Doctor
    </span>
  )
}
