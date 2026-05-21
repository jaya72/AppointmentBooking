'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope } from 'lucide-react'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Check localStorage for existing session and redirect accordingly
    try {
      const token = localStorage.getItem('token')
      const role = localStorage.getItem('role')
      if (token && role === 'doctor') {
        router.replace('/doctor')
      } else if (token && role === 'patient') {
        router.replace('/patient')
      } else {
        router.replace('/login')
      }
    } catch {
      router.replace('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Stethoscope className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold text-foreground">MediBook</span>
      </div>
    </div>
  )
}
