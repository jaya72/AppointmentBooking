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
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Patient Details"
      >
        {appointment && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{appointment.name}</p>
                  <p className="text-xs text-muted-foreground">Age {appointment.age}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Current Appointment */}
              <div className="bg-muted rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Appointment</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{format(parseISO(appointment.date), 'EEEE, MMM d, yyyy')} &mdash; {appointment.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{appointment.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <StatusBadge status={appointment.paymentStatus} />
                </div>
                <div className="pt-1">
                  <MeetingButton date={appointment.date} time={appointment.time} meetingLink={appointment.meetingLink} />
                </div>
              </div>

              {/* Patient History */}
              {patientHistory.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Visit History</p>
                  <div className="space-y-2">
                    {patientHistory
                      .filter(a => a._id !== appointment._id)
                      .map(a => (
                        <div key={a._id} className="flex items-center justify-between text-sm bg-muted rounded-xl px-3 py-2.5">
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
