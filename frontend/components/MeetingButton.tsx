'use client'

import { useState, useEffect } from 'react'
import { Video, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseISO, differenceInMinutes, format } from 'date-fns'

interface MeetingButtonProps {
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

export function MeetingButton({ date, time, meetingLink }: MeetingButtonProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const apptTime = parseDatetime(date, time)
  if (!apptTime) {
    return (
      <a href={meetingLink} target="_blank" rel="noopener noreferrer">
        <Button size="sm" className="rounded-xl gap-1.5">
          <Video className="w-4 h-4" /> Join Meeting
        </Button>
      </a>
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
      <Button size="sm" variant="secondary" className="rounded-xl gap-1.5 cursor-not-allowed opacity-70" disabled>
        <Clock className="w-4 h-4" />
        {label}
      </Button>
    )
  }

  if (isLive || isSoon) {
    return (
      <a href={meetingLink} target="_blank" rel="noopener noreferrer">
        <Button size="sm" className="rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
          <span className="w-2 h-2 rounded-full bg-white blink" />
          <Video className="w-4 h-4" />
          Join Meeting
        </Button>
      </a>
    )
  }

  // Past
  return (
    <Button size="sm" variant="secondary" className="rounded-xl gap-1.5 opacity-60" disabled>
      <Video className="w-4 h-4" />
      {format(apptTime, 'MMM d, h:mm a')}
    </Button>
  )
}
