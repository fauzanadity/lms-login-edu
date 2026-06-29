'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  durationMinutes: number
  startTimeIso: string | null
  onTimeUp: () => void
  isSubmitting?: boolean
}

export default function Timer({ durationMinutes, startTimeIso, onTimeUp, isSubmitting = false }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  
  useEffect(() => {
    if (!startTimeIso || isSubmitting) return

    const startTime = new Date(startTimeIso).getTime()
    const durationMs = durationMinutes * 60 * 1000
    const endTime = startTime + durationMs

    const updateTimer = () => {
      const now = new Date().getTime()
      const remaining = Math.max(0, endTime - now)
      
      setTimeLeft(remaining)

      if (remaining <= 0) {
        onTimeUp()
      }
    }

    // Initial update
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTimeIso, durationMinutes, onTimeUp, isSubmitting])

  if (timeLeft === null) return null

  // Format time left
  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  const isWarning = timeLeft < 5 * 60 * 1000 // Less than 5 minutes
  const isCritical = timeLeft < 60 * 1000 // Less than 1 minute

  let colorClass = 'bg-primary-900 text-white'
  if (isCritical) {
    colorClass = 'bg-danger text-white animate-pulse'
  } else if (isWarning) {
    colorClass = 'bg-warning text-white'
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold shadow-sm transition-colors ${colorClass}`}>
      <Clock size={18} className={isCritical ? 'animate-bounce' : ''} />
      <span>
        {hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
