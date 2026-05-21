'use client'

import { useState } from 'react'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { User, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import type { Appointment } from '@/lib/api'

interface Props {
  appointments: Appointment[]
  onSelect: (appt: Appointment) => void
}

function groupByDate(appointments: Appointment[]): Record<string, Appointment[]> {
  return appointments.reduce((acc, appt) => {
    const key = appt.date
    if (!acc[key]) acc[key] = []
    acc[key].push(appt)
    return acc
  }, {} as Record<string, Appointment[]>)
}

function dateLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return `Today — ${format(d, 'MMMM d')}`
    if (isTomorrow(d)) return `Tomorrow — ${format(d, 'MMMM d')}`
    return format(d, 'EEEE, MMMM d, yyyy')
  } catch {
    return dateStr
  }
}

export default function AppointmentTimeline({ appointments, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const grouped = groupByDate(appointments)
  const sortedDates = Object.keys(grouped).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="clay-card p-10 text-center text-muted-foreground text-sm font-medium">
        No appointments found.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {sortedDates.map(date => {
        const isDefaultOpen = isToday(parseISO(date)) || expanded[date] !== false
        const isOpen = expanded[date] === undefined ? true : expanded[date]
        const slots = grouped[date]

        return (
          <div key={date} className="space-y-3">
            {/* Date header */}
            <button
              className="w-full flex items-center justify-between group py-2"
              onClick={() => setExpanded(prev => ({ ...prev, [date]: !isOpen }))}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isToday(parseISO(date)) ? 'bg-primary shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-muted border border-white/60 shadow-[inset_1px_1px_2px_rgba(163,177,198,0.2)]'}`} />
                <span className={`text-sm font-bold tracking-tight ${isToday(parseISO(date)) ? 'text-primary' : 'text-foreground'}`}>
                  {dateLabel(date)}
                </span>
                <span className="text-xxs font-bold text-muted-foreground clay-chip px-2.5 py-0.5">
                  {slots.length} {slots.length === 1 ? 'patient' : 'patients'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Timeline items */}
            {isOpen && (
              <div className="ml-[5px] border-l-2 border-dashed border-white/80 pl-5 space-y-3">
                {slots
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(appt => (
                    <button
                      key={appt._id}
                      className="w-full clay-card clay-card-interactive p-4.5 text-left group"
                      onClick={() => onSelect(appt)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="clay-inset w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-emerald-600 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-sm tracking-tight truncate">{appt.name}</p>
                            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                              {appt.time} &middot; Age {appt.age}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <StatusBadge status={appt.paymentStatus} />
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
