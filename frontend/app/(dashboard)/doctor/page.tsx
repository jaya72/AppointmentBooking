'use client'

import { useState, useCallback } from 'react'
import { Stethoscope, LogOut, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import api, { type Appointment } from '@/lib/api'
import AnalyticsBar from '@/components/doctor/AnalyticsBar'
import AppointmentTimeline from '@/components/doctor/AppointmentTimeline'
import PatientDrawer from '@/components/doctor/PatientDrawer'
import { AppointmentSkeletonList } from '@/components/AppointmentSkeleton'
import { DoctorBadge } from '@/components/StatusBadge'

async function fetchAppointments(): Promise<Appointment[]> {
  const res = await api.get('/appointments')
  return res.data
}

export default function DoctorPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  const { data, error, isLoading, mutate } = useSWR(
    'doctor-appointments',
    fetchAppointments,
    { revalidateOnFocus: false }
  )

  const refresh = useCallback(() => mutate(), [mutate])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const appointments = data || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/85 backdrop-blur-md sticky top-0 z-30 border-b border-white/60 shadow-[0_8px_32px_rgba(163,177,198,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.5),2px_2px_5px_rgba(163,177,198,0.3)]">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">MediBook</span>
            <DoctorBadge />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground hidden sm:block">{user?.name || 'Doctor'}</span>
            <Button size="sm" className="gap-1.5 clay-btn-secondary px-3 py-1.5 text-xs" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
              Good to see you, {user?.name ? user.name.split(' ')[0] : 'Doctor'}
            </h1>
            <p className="text-muted-foreground text-sm">Here is your schedule overview.</p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 clay-btn-secondary px-3 py-2 text-xs shrink-0"
            onClick={refresh}
            aria-label="Sync schedule"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span className="hidden sm:inline">Sync Schedule</span>
          </Button>
        </div>

        {/* Analytics */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0,1,2].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="skeleton-shimmer h-9 w-9 rounded-xl" />
                <div className="skeleton-shimmer h-6 w-12 rounded-lg" />
                <div className="skeleton-shimmer h-3 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <AnalyticsBar appointments={appointments} />
        )}

        {/* Timeline */}
        <div>
          <h2 className="font-semibold text-foreground mb-4">Schedule</h2>
          {isLoading && <AppointmentSkeletonList count={3} />}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 text-sm text-destructive">
              Failed to load appointments.{' '}
              <button onClick={refresh} className="underline">Retry</button>
            </div>
          )}
          {!isLoading && !error && (
            <AppointmentTimeline
              appointments={appointments}
              onSelect={setSelectedAppt}
            />
          )}
        </div>
      </main>

      {/* Floating sync button for mobile */}
      <button
        onClick={refresh}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center sm:hidden hover:bg-primary/90 transition-colors"
        aria-label="Sync schedule"
      >
        <RefreshCw className="w-5 h-5" />
      </button>

      <PatientDrawer
        appointment={selectedAppt}
        allAppointments={appointments}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  )
}
