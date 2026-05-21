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
      <header className="bg-card/85 backdrop-blur-md sticky top-0 z-10 border-b border-white/60 shadow-[0_8px_32px_rgba(163,177,198,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.5),2px_2px_5px_rgba(163,177,198,0.3)]">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground tracking-tight">MediBook</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {user?.name || 'Patient'}
            </span>
            <Button size="sm" className="gap-1.5 clay-btn-secondary px-3 py-1.5 text-xs" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Hello, {user?.name || 'there'}
          </h1>
          <p className="text-muted-foreground text-sm">Manage and book your medical appointments.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 clay-tabs-container w-fit">
          <button
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'book'
                ? 'clay-tab-item-active'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'appointments'
                ? 'clay-tab-item-active'
                : 'text-muted-foreground hover:text-foreground font-medium'
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
