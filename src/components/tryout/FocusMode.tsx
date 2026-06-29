'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Maximize, Minimize, AlertTriangle } from 'lucide-react'

interface FocusModeProps {
  children: ReactNode
  isActive: boolean
  onToggle: (active: boolean) => void
  requireFullscreen?: boolean
}

export default function FocusMode({ 
  children, 
  isActive, 
  onToggle,
  requireFullscreen = true
}: FocusModeProps) {
  const [warningCount, setWarningCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  // Handle fullscreen changes
  useEffect(() => {
    if (!requireFullscreen) return

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      if (isActive && !isFullscreen) {
        // User exited fullscreen while focus mode is active
        setWarningCount(prev => prev + 1)
        setShowWarning(true)
        onToggle(false)
        
        // Auto-hide warning after 5 seconds
        setTimeout(() => setShowWarning(false), 5000)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isActive, onToggle, requireFullscreen])

  // Handle tab visibility (prevent cheating by switching tabs)
  useEffect(() => {
    if (!isActive) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setWarningCount(prev => prev + 1)
        setShowWarning(true)
        // We don't automatically turn off focus mode, but we log the warning
        setTimeout(() => setShowWarning(false), 5000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isActive])

  // Prevent copying text
  useEffect(() => {
    if (!isActive) return
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
    }
    
    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [isActive])

  // Prevent right click
  useEffect(() => {
    if (!isActive) return
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }
    
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [isActive])

  const toggleFocusMode = async () => {
    try {
      if (!isActive) {
        if (requireFullscreen && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
        onToggle(true)
      } else {
        if (requireFullscreen && document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen()
        }
        onToggle(false)
      }
    } catch (err) {
      console.error('Error toggling focus mode:', err)
      // Fallback if fullscreen is blocked (e.g., some browsers)
      onToggle(!isActive)
    }
  }

  return (
    <div className={`transition-all duration-300 ${isActive ? 'fixed inset-0 z-50 bg-gradient-radial-page overflow-auto' : 'relative'}`}>
      {/* Focus Mode Header */}
      <div className={`sticky top-0 z-40 bg-gradient-linear-nav border-b border-primary-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-md transition-all ${isActive ? 'mb-6' : 'hidden'}`}>
        <div className="flex items-center gap-3">
          <div className="relative w-2 h-2 bg-green-500 rounded-full badge-pulse"></div>
          <span className="font-bold text-on-dark-primary">Mode Fokus Ujian</span>
        </div>
        
        <div className="flex items-center gap-4">
          {warningCount > 0 && (
            <span className="text-xs font-bold text-warning flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
              <AlertTriangle size={14} /> Peringatan: {warningCount}
            </span>
          )}
          
          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-2 text-sm font-bold text-on-dark-secondary hover:text-on-dark-primary bg-primary-800 hover:bg-primary-700 px-3 py-1.5 rounded-[--radius-sm] transition-all border border-primary-700"
          >
            <Minimize size={16} /> Keluar Mode Fokus
          </button>
        </div>
      </div>

      {/* Warning Toast */}
      {showWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-danger text-white px-6 py-3 rounded-[--radius-md] shadow-elevated flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
          <AlertTriangle size={24} />
          <div>
            <p className="font-bold">Peringatan Pelanggaran!</p>
            <p className="text-sm opacity-90">Aktivitas mencurigakan terdeteksi (pindah tab atau keluar layar penuh).</p>
          </div>
        </div>
      )}

      {/* Trigger Button (when not active) */}
      {!isActive && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-2 text-sm font-bold text-on-dark-primary hover:bg-primary-700 bg-primary-800 border border-primary-700 px-4 py-2 rounded-[--radius-sm] transition-all shadow-sm"
          >
            <Maximize size={16} /> Aktifkan Mode Fokus
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isActive ? 'max-w-5xl mx-auto px-4 pb-20 no-select' : ''}`}>
        {children}
      </div>
    </div>
  )
}
