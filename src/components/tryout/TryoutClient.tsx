'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle, Save, AlertCircle, Loader2 } from 'lucide-react'
import FocusMode from './FocusMode'
import Timer from './Timer'
import QuestionRenderer from './QuestionRenderer'

interface TryoutClientProps {
  exercise: any
  attempt: any
  isTryout: boolean
}

export default function TryoutClient({ exercise, attempt, isTryout }: TryoutClientProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, any>>(attempt.answers_json || {})
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [isFocusMode, setIsFocusMode] = useState(isTryout) // Auto-enable for tryout
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(attempt.last_autosaved_at ? new Date(attempt.last_autosaved_at) : null)
  const [error, setError] = useState<string | null>(null)
  
  const questions = exercise.questions_json.questions
  const currentQuestion = questions[currentQuestionIdx]
  const isCompleted = !!attempt.submitted_at

  // Auto-save logic
  const saveAnswers = useCallback(async (currentAnswers: Record<string, any>, showSavingIndicator = true) => {
    if (isCompleted || isSubmitting) return
    
    if (showSavingIndicator) setIsSaving(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/student/exercises/${exercise.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          answers: currentAnswers
        })
      })
      
      if (res.ok) {
        setLastSaved(new Date())
      } else {
        // Only show error if it's not a rate limit (which might happen often on fast clicks)
        if (res.status !== 429) {
          setError('Gagal menyimpan jawaban otomatis.')
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Koneksi terputus. Gagal menyimpan.')
    } finally {
      if (showSavingIndicator) setIsSaving(false)
    }
  }, [attempt.id, exercise.id, isCompleted, isSubmitting])

  // Save when answers change (debounced)
  useEffect(() => {
    if (isCompleted) return
    
    const timeoutId = setTimeout(() => {
      saveAnswers(answers, false) // Silent save
    }, 5000) // Auto-save 5 seconds after last change
    
    return () => clearTimeout(timeoutId)
  }, [answers, isCompleted, saveAnswers])

  const handleAnswerChange = (answer: any) => {
    if (isCompleted) return
    
    const newAnswers = {
      ...answers,
      [currentQuestion.id.toString()]: answer
    }
    
    setAnswers(newAnswers)
    
    // Explicitly trigger a save immediately for better UX
    saveAnswers(newAnswers, true)
  }

  const handleSubmit = async () => {
    if (isCompleted || isSubmitting) return
    
    const unAnsweredCount = questions.length - Object.keys(answers).length
    
    if (unAnsweredCount > 0) {
      const confirmSubmit = window.confirm(`Masih ada ${unAnsweredCount} soal yang belum dijawab. Yakin ingin mengumpulkan?`)
      if (!confirmSubmit) return
    } else {
      const confirmSubmit = window.confirm('Anda yakin ingin mengumpulkan jawaban sekarang?')
      if (!confirmSubmit) return
    }

    executeSubmit()
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/student/exercises/${exercise.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attempt.id,
          answers: answers
        })
      })
      
      if (res.ok) {
        // Refresh page to show results
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal mengumpulkan jawaban.')
        setIsSubmitting(false)
      }
    } catch (err) {
      setError('Koneksi terputus. Gagal mengumpulkan jawaban.')
      setIsSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    if (!isCompleted && !isSubmitting) {
      alert('Waktu habis! Jawaban Anda akan dikumpulkan secara otomatis.')
      executeSubmit()
    }
  }

  // Navigation map
  const renderQuestionNavMap = () => (
    <div className="bg-card rounded-[--radius-lg] p-4 shadow-sm border border-neutral-200">
      <h3 className="font-bold text-on-light-primary mb-3 text-sm flex justify-between items-center">
        <span>Navigasi Soal</span>
        <span className="text-xs font-normal bg-neutral-100 px-2 py-1 rounded text-on-light-secondary">
          {Object.keys(answers).length} / {questions.length} Dijawab
        </span>
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {questions.map((q: any, idx: number) => {
          const isAnswered = answers[q.id.toString()] !== undefined
          const isCurrent = currentQuestionIdx === idx
          
          let btnClass = 'w-10 h-10 rounded-md font-bold text-sm flex items-center justify-center transition-all'
          
          if (isCurrent) {
            btnClass += ' bg-primary-800 text-on-dark-primary ring-2 ring-primary-800 ring-offset-2'
          } else if (isAnswered) {
            btnClass += ' bg-neutral-100 text-on-light-primary border border-neutral-300 hover:bg-neutral-200'
          } else {
            btnClass += ' bg-white text-on-light-secondary border border-neutral-200 hover:bg-neutral-50'
          }
          
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIdx(idx)}
              className={btnClass}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>
      
      {!isCompleted && (
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-[--radius-sm] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin"/> Mengirim...</>
            ) : (
              <><CheckCircle size={18} /> Kumpulkan Jawaban</>
            )}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <FocusMode isActive={isFocusMode} onToggle={setIsFocusMode} requireFullscreen={isTryout}>
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        
        {/* Header Bar */}
        <div className="bg-card rounded-[--radius-lg] p-4 shadow-sm border border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-lg text-on-light-primary">{exercise.title}</h1>
            {!isCompleted && (
              <div className="flex items-center gap-2 text-xs text-on-light-secondary mt-1">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-on-light-secondary">
                    <Loader2 size={12} className="animate-spin" /> Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Save size={12} /> {lastSaved ? `Tersimpan: ${lastSaved.toLocaleTimeString('id-ID')}` : 'Belum tersimpan'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full flex items-center gap-1 border border-red-100">
              <AlertCircle size={14}/> {error}
            </div>
          )}

          {!isCompleted && (
            <Timer 
              durationMinutes={exercise.time_limit_minutes} 
              startTimeIso={attempt.started_at} 
              onTimeUp={handleTimeUp}
              isSubmitting={isSubmitting}
            />
          )}
          
          {isCompleted && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
              <CheckCircle size={18} /> Selesai
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIdx + 1}
              answer={answers[currentQuestion.id.toString()]}
              onChange={handleAnswerChange}
              disabled={isCompleted || isSubmitting}
            />
            
            {/* Prev/Next Navigation */}
            <div className="flex justify-between items-center bg-card rounded-[--radius-lg] p-4 shadow-sm border border-neutral-100">
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-[--radius-sm] font-bold transition-all disabled:opacity-50 text-on-light-secondary bg-neutral-100 hover:bg-neutral-200"
              >
                <ChevronLeft size={20} /> Sebelumnya
              </button>
              
              <button
                onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIdx === questions.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-[--radius-sm] font-bold transition-all disabled:opacity-50 text-on-gold bg-gradient-gold-cta hover:bg-accent-gold-hover shadow-md hover:shadow-lg"
              >
                Selanjutnya <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Sidebar Area */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              {renderQuestionNavMap()}
            </div>
          </div>
        </div>
      </div>
    </FocusMode>
  )
}
