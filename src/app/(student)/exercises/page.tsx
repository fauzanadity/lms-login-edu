import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PenTool, Clock, BookMarked, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Latihan Soal',
}

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', user.id)
    .single()

  if (!student) return null

  // Get exercises (type = 'exercise')
  const { data: exercisesData } = await supabase
    .from('exercise_programs')
    .select(`
      exercises (
        id,
        title,
        subtitle,
        type,
        time_limit_minutes,
        question_count,
        created_at
      )
    `)
    .eq('program_id', student.program_id)
    .order('exercise_id', { ascending: false })

  const exercises = exercisesData
    ?.map(ep => ep.exercises as any)
    .filter(e => e && e.type === 'exercise') || []

  // Get attempts
  const { data: attempts } = await supabase
    .from('attempts')
    .select('exercise_id, score, is_graded, submitted_at, created_at')
    .eq('student_id', user.id)

  const attemptMap = new Map(attempts?.map(a => [a.exercise_id, a]) || [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-800 text-accent-gold rounded-lg border border-primary-700">
          <PenTool size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary">Latihan Soal</h1>
          <p className="text-on-dark-secondary text-sm">Kerjakan latihan untuk mengasah kemampuanmu</p>
        </div>
      </div>

      {exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(ex => {
            if (!ex) return null
            const attempt = attemptMap.get(ex.id)
            const isCompleted = !!attempt?.submitted_at
            
            return (
              <div key={ex.id} className="bg-card rounded-[--radius-lg] border border-neutral-200 p-5 shadow-sm card-hover flex flex-col h-full relative overflow-hidden">
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    SELESAI
                  </div>
                )}
                
                <h3 className="font-bold text-lg text-on-light-primary mb-1 mt-2 line-clamp-2">{ex.title}</h3>
                {ex.subtitle && <p className="text-sm text-on-light-secondary mb-4 line-clamp-2">{ex.subtitle}</p>}
                
                <div className="flex flex-col gap-2 mt-auto pt-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-on-light-secondary bg-neutral-50 p-2 rounded-md">
                    <BookMarked size={16} className="text-accent-gold-hover" />
                    <span className="font-medium">{ex.question_count} Soal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-light-secondary bg-neutral-50 p-2 rounded-md">
                    <Clock size={16} className="text-accent-gold-hover" />
                    <span className="font-medium">{ex.time_limit_minutes} Menit Waktu Pengerjaan</span>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-md border border-green-100 mt-2">
                      <span className="text-sm font-medium text-green-800">Skor:</span>
                      <span className="font-bold text-lg text-green-700">
                        {attempt.is_graded ? (attempt.score !== null ? attempt.score : '0') : 'Menunggu Penilaian'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 pt-4 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    Ditambahkan: {formatDate(ex.created_at)}
                  </span>
                  
                  <Link 
                    href={`/exercises/${ex.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[--radius-sm] text-sm font-bold transition-all ${
                      isCompleted 
                        ? 'bg-neutral-100 text-on-light-secondary hover:bg-neutral-200' 
                        : 'bg-gradient-gold-cta text-on-gold hover:bg-accent-gold-hover shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isCompleted ? 'Lihat Hasil' : 'Mulai'} <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-[--radius-lg] p-12 text-center border border-neutral-200 shadow-sm">
          <PenTool size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-bold text-on-light-primary mb-2">Belum ada latihan</h3>
          <p className="text-on-light-secondary">Latihan soal belum tersedia untuk program ini.</p>
        </div>
      )}
    </div>
  )
}
