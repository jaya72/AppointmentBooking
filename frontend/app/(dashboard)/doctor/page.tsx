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
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">MediBook</span>
            <DoctorBadge />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name || 'Doctor'}</span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground text-balance">
              Good to see you, {user?.name ? user.name.split(' ')[0] : 'Doctor'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Here is your schedule overview.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl shrink-0"
            onClick={refresh}
            aria-label="Sync schedule"
          >
            <RefreshCw className="w-3.5 h-3.5" />
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
