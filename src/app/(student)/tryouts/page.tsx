import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Clock, BookMarked, ChevronRight, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Tryout',
}

export default async function TryoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: student } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', user.id)
    .single()

  if (!student) return null

  // Get exercises (type = 'tryout')
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

  const tryouts = exercisesData
    ?.map(ep => ep.exercises as any)
    .filter(e => e && e.type === 'tryout') || []

  // Get attempts
  const { data: attempts } = await supabase
    .from('attempts')
    .select('exercise_id, score, is_graded, submitted_at, started_at')
    .eq('student_id', user.id)

  const attemptMap = new Map(attempts?.map(a => [a.exercise_id, a]) || [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-800 text-accent-gold rounded-lg border border-primary-700">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-on-dark-primary">Tryout</h1>
            <p className="text-on-dark-secondary text-sm">Simulasi UTBK dengan waktu nyata</p>
          </div>
        </div>
      </div>
      
      <div className="bg-primary-800/50 border border-primary-700 rounded-[--radius-md] p-4 flex gap-3 mb-8">
        <AlertCircle className="text-accent-gold shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-on-dark-primary text-sm">Perhatian: Tryout Hanya Sekali Kerja!</h4>
          <p className="text-sm text-on-dark-secondary mt-1">
            Tryout UTBK memiliki sistem <strong>sekali pengerjaan</strong>. Waktu akan terus berjalan meskipun Anda menutup halaman. 
            Pastikan koneksi internet stabil dan waktu Anda cukup sebelum memulai.
          </p>
        </div>
      </div>

      {tryouts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tryouts.map(ex => {
            if (!ex) return null
            const attempt = attemptMap.get(ex.id)
            const isCompleted = !!attempt?.submitted_at
            const inProgress = attempt && !isCompleted
            
            return (
              <div key={ex.id} className="bg-card rounded-[--radius-lg] border border-neutral-200 p-6 shadow-card hover:border-primary-500 transition-colors flex flex-col h-full relative overflow-hidden">
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl shadow-sm">
                    SELESAI
                  </div>
                )}
                {inProgress && (
                  <div className="absolute top-0 right-0 bg-warning text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl shadow-sm">
                    SEDANG DIKERJAKAN
                  </div>
                )}
                
                <h3 className="font-bold text-xl text-on-light-primary mb-2 mt-2">{ex.title}</h3>
                {ex.subtitle && <p className="text-on-light-secondary mb-6">{ex.subtitle}</p>}
                
                <div className="grid grid-cols-2 gap-4 mt-auto mb-6">
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center items-center text-center">
                    <BookMarked size={20} className="text-accent-gold-hover mb-1" />
                    <span className="text-xs text-on-light-secondary uppercase font-bold tracking-wider">Jumlah Soal</span>
                    <span className="font-bold text-lg text-on-light-primary">{ex.question_count}</span>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex flex-col justify-center items-center text-center">
                    <Clock size={20} className="text-accent-gold-hover mb-1" />
                    <span className="text-xs text-on-light-secondary uppercase font-bold tracking-wider">Waktu</span>
                    <span className="font-bold text-lg text-on-light-primary">{ex.time_limit_minutes} Menit</span>
                  </div>
                </div>
                
                {isCompleted && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6 flex justify-between items-center">
                    <span className="font-bold text-green-800">Skor Akhir:</span>
                    <span className="font-black text-2xl text-green-700">
                      {attempt.is_graded ? (attempt.score !== null ? attempt.score : '0') : 'Menunggu'}
                    </span>
                  </div>
                )}
                
                <div className="mt-2 pt-4 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs font-medium text-neutral-500">
                    Rilis: {formatDate(ex.created_at)}
                  </span>
                  
                  <Link 
                    href={`/tryouts/${ex.id}`}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-[--radius-sm] text-sm font-bold transition-all ${
                      isCompleted 
                        ? 'bg-neutral-100 text-on-light-secondary hover:bg-neutral-200 border border-neutral-200' 
                        : inProgress
                          ? 'bg-warning text-white hover:bg-yellow-600 shadow-md'
                          : 'bg-gradient-gold-cta text-on-gold hover:bg-accent-gold-hover shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isCompleted ? 'Lihat Hasil' : inProgress ? 'Lanjutkan Tryout' : 'Mulai Tryout'} <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-[--radius-lg] p-16 text-center border border-neutral-200 shadow-sm">
          <Trophy size={56} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-xl font-bold text-on-light-primary mb-2">Belum ada tryout</h3>
          <p className="text-on-light-secondary max-w-md mx-auto">
            Tryout UTBK belum tersedia untuk program ini. Admin akan menambahkan tryout sesuai dengan jadwal program.
          </p>
        </div>
      )}
    </div>
  )
}
