'use client'

import { X, User, MapPin, CalendarDays, CreditCard } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { StatusBadge } from '@/components/StatusBadge'
import { MeetingButton } from '@/components/MeetingButton'
import { Button } from '@/components/ui/button'
import type { Appointment } from '@/lib/api'

interface Props {
  appointment: Appointment | null
  allAppointments: Appointment[]
  onClose: () => void
}

export default function PatientDrawer({ appointment, allAppointments, onClose }: Props) {
  const isOpen = !!appointment

  // All appointments for this patient (same userId)
  const patientHistory = appointment
    ? allAppointments
        .filter(a => a.userId === appointment.userId)
        .sort((a, b) => b.date.localeCompare(a.date))
    : []

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-white/40 shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } clay-elevation-5`}
        role="dialog"
        aria-label="Patient Details"
      >
        {appointment && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="clay-inset w-10.5 h-10.5 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-foreground tracking-tight">{appointment.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Age {appointment.age}</p>
                </div>
              </div>
              <Button size="icon" className="clay-btn-secondary size-8" onClick={onClose}>
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-background">
              {/* Current Appointment */}
              <div className="clay-inset p-4.5 space-y-3 rounded-2xl">
                <p className="text-xxs font-extrabold text-muted-foreground uppercase tracking-wider">Current Appointment</p>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                  <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{format(parseISO(appointment.date), 'EEEE, MMM d, yyyy')} &mdash; {appointment.time}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{appointment.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                  <StatusBadge status={appointment.paymentStatus} />
                </div>
                <div className="pt-1.5">
                  <MeetingButton date={appointment.date} time={appointment.time} meetingLink={appointment.meetingLink} />
                </div>
              </div>

              {/* Patient History */}
              {patientHistory.length > 1 && (
                <div className="space-y-3">
                  <p className="text-xxs font-extrabold text-muted-foreground uppercase tracking-wider">Visit History</p>
                  <div className="space-y-2">
                    {patientHistory
                      .filter(a => a._id !== appointment._id)
                      .map(a => (
                        <div key={a._id} className="flex items-center justify-between text-xs font-semibold border border-white/60 bg-muted/65 rounded-xl px-3.5 py-2.5 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),1px_1px_3px_rgba(163,177,198,0.1)]">
                          <span className="text-foreground">
                            {format(parseISO(a.date), 'MMM d, yyyy')} &mdash; {a.time}
                          </span>
                          <StatusBadge status={a.paymentStatus} />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
