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
      <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground text-sm">
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
          <div key={date}>
            {/* Date header */}
            <button
              className="w-full flex items-center justify-between group mb-3"
              onClick={() => setExpanded(prev => ({ ...prev, [date]: !isOpen }))}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isToday(parseISO(date)) ? 'bg-primary' : 'bg-border'}`} />
                <span className={`text-sm font-semibold ${isToday(parseISO(date)) ? 'text-primary' : 'text-foreground'}`}>
                  {dateLabel(date)}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {slots.length} {slots.length === 1 ? 'patient' : 'patients'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Timeline items */}
            {isOpen && (
              <div className="ml-[5px] border-l-2 border-border pl-5 space-y-2">
                {slots
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(appt => (
                    <button
                      key={appt._id}
                      className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all group"
                      onClick={() => onSelect(appt)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{appt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {appt.time} &middot; Age {appt.age}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={appt.paymentStatus} />
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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
