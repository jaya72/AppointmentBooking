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
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Your session is expiring soon.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => { logout(); window.location.href = '/login' }}
          >
            Sign in again
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-700"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
