import { CalendarDays, Users, Clock } from 'lucide-react'
import { isToday, parseISO } from 'date-fns'
import type { Appointment } from '@/lib/api'

interface Props {
  appointments: Appointment[]
}

export default function AnalyticsBar({ appointments }: Props) {
  const total = appointments.length
  const todayCount = appointments.filter(a => {
    try { return isToday(parseISO(a.date)) } catch { return false }
  }).length

  // 30 min per slot estimate
  const estimatedHours = (total * 0.5).toFixed(1)

  const metrics = [
    {
      label: 'Total Bookings',
      value: total,
      icon: CalendarDays,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: "Today's Patients",
      value: todayCount,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Est. Hours',
      value: `${estimatedHours}h`,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {metrics.map(m => (
        <div key={m.label} className="clay-card clay-card-interactive p-4 md:p-5">
          <div className="clay-inset w-9.5 h-9.5 rounded-xl flex items-center justify-center mb-3.5">
            <m.icon className={`w-5 h-5 ${m.color} animate-pulse`} />
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{m.value}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 leading-relaxed">{m.label}</p>
        </div>
      ))}
    </div>
  )
}
