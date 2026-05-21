'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseISO, differenceInMinutes, format } from 'date-fns'

interface MeetingButtonProps {
  appointmentId: string
  date: string  // YYYY-MM-DD
  time: string  // e.g. "10:00 AM"
  meetingLink: string
}

function parseDatetime(date: string, time: string): Date | null {
  try {
    const combined = `${date} ${time}`
    const d = new Date(combined)
    if (isNaN(d.getTime())) {
      // Try manual parse e.g. "10:00 AM"
      const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!match) return null
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const ampm = match[3].toUpperCase()
      if (ampm === 'PM' && hours !== 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0
      const base = parseISO(date)
      base.setHours(hours, minutes, 0, 0)
      return base
    }
    return d
  } catch {
    return null
  }
}

export function MeetingButton({ appointmentId, date, time, meetingLink }: MeetingButtonProps) {
  const router = useRouter()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const apptTime = parseDatetime(date, time)
  if (!apptTime) {
    return (
      <Button size="sm" className="rounded-xl gap-1.5" onClick={() => router.push(`/meeting/${appointmentId}`)}>
        <Video className="w-4 h-4" /> Join Meeting
      </Button>
    )
  }

  const diffMinutes = differenceInMinutes(apptTime, now)
  const isLive = diffMinutes <= 0 && diffMinutes >= -60
  const isSoon = diffMinutes > 0 && diffMinutes <= 5
  const isFuture = diffMinutes > 5

  if (isFuture) {
    const hours = Math.floor(diffMinutes / 60)
    const mins = diffMinutes % 60
    const label = hours > 0
      ? `Opens in ${hours}h ${mins}m`
      : `Opens in ${mins}m`
    return (
      <Button size="sm" className="w-full clay-btn-secondary py-5.5 text-xs gap-1.5 cursor-not-allowed opacity-70" disabled>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {label}
      </Button>
    )
  }

  if (isLive || isSoon) {
    return (
      <Button
        className="w-full clay-btn py-5.5 text-xs flex items-center justify-center gap-2"
        onClick={() => router.push(`/meeting/${appointmentId}`)}
      >
        <span className="w-2 h-2 rounded-full bg-[#064e3b] blink shrink-0" />
        <Video className="w-4 h-4 text-[#064e3b] shrink-0" />
        Join Meeting
      </Button>
    )
  }

  // Past
  return (
    <Button size="sm" className="w-full clay-btn-secondary py-5.5 text-xs gap-1.5 opacity-60" disabled>
      <Video className="w-3.5 h-3.5 shrink-0" />
      {format(apptTime, 'MMM d, h:mm a')}
    </Button>
  )
}
