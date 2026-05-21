'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

/**
 * Decodes a JWT and returns the exp timestamp (seconds), or null if invalid.
 */
function getJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

const WARNING_THRESHOLD_SECONDS = 10 * 60 // warn 10 minutes before expiry

export function SessionBanner() {
  const { user, logout } = useAuth()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user?.token || dismissed) return

    const check = () => {
      const exp = getJwtExp(user.token)
      if (!exp) return
      const secondsLeft = exp - Math.floor(Date.now() / 1000)
      setShow(secondsLeft > 0 && secondsLeft < WARNING_THRESHOLD_SECONDS)
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [user?.token, dismissed])

  if (!show || dismissed) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto clay-alert-warning p-4.5 shadow-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-xs font-bold">
        <AlertCircle className="w-4.5 h-4.5 shrink-0 text-[#92400e] animate-pulse" />
        <span>Your session is expiring soon.</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Button
          size="sm"
          className="clay-btn-secondary px-3.5 py-2 text-xxs font-bold"
          onClick={() => { logout(); window.location.href = '/login' }}
        >
          Sign in again
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#92400e]/70 hover:text-[#92400e] transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  )
}
