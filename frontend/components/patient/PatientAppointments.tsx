'use client'

import { useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, MapPin, User, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import api, { type Appointment } from '@/lib/api'
import { AppointmentSkeletonList } from '@/components/AppointmentSkeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { MeetingButton } from '@/components/MeetingButton'
import { Button } from '@/components/ui/button'

async function fetchAppointments(): Promise<Appointment[]> {
  const res = await api.get('/appointments')
  return res.data
}

interface Props {
  refreshKey?: number
}

export default function PatientAppointments({ refreshKey }: Props) {
  const { data, error, isLoading, mutate } = useSWR(
    ['appointments', refreshKey],
    fetchAppointments,
    { revalidateOnFocus: false }
  )

  const refresh = useCallback(() => mutate(), [mutate])

  if (isLoading) return <AppointmentSkeletonList count={2} />

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 text-sm text-destructive">
        Failed to load appointments. <button onClick={refresh} className="underline">Retry</button>
      </div>
    )
  }

  const appointments = data || []

  if (appointments.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No visits yet</p>
          <p className="text-sm text-muted-foreground mt-1">You don&apos;t have any visits yet. Book your first appointment above.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">My Appointments</h3>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={refresh}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {appointments.map(appt => (
        <div key={appt._id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{appt.name}</p>
                <p className="text-xs text-muted-foreground">Age {appt.age}</p>
              </div>
            </div>
            <StatusBadge status={appt.paymentStatus} />
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span>
                {format(parseISO(appt.date), 'EEE, MMM d, yyyy')} &mdash; {appt.time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{appt.address}</span>
            </div>
          </div>

          <MeetingButton date={appt.date} time={appt.time} meetingLink={appt.meetingLink} />
        </div>
      ))}
    </div>
  )
}
