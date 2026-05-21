'use client'

import { useState } from 'react'
import { Stethoscope, CalendarDays, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import BookingForm from '@/components/patient/BookingForm'
import PatientAppointments from '@/components/patient/PatientAppointments'

export default function PatientPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'book' | 'appointments'>('book')
  const [refreshKey, setRefreshKey] = useState(0)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  function handleBooked() {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">MediBook</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name || 'Patient'}
            </span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground text-balance">
            Hello, {user?.name || 'there'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and book your medical appointments.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'book'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'appointments'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Appointments
          </button>
        </div>

        {activeTab === 'book' && <BookingForm onBooked={handleBooked} />}
        {activeTab === 'appointments' && <PatientAppointments refreshKey={refreshKey} />}
      </main>
    </div>
  )
}
