import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, PenTool, Trophy, ChevronRight, Clock, BookMarked } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Dashboard Siswa',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch student and their program details
  const { data: student } = await supabase
    .from('students')
    .select(`
      full_name,
      programs (
        id,
        name,
        title,
        subtitle
      )
    `)
    .eq('id', user.id)
    .single()

  if (!student || !student.programs) return null

  const programId = (student.programs as any).id

  // Fetch recent materials for this program
  const { data: materials } = await supabase
    .from('material_programs')
    .select(`
      materials (
        id,
        title,
        subtitle,
        created_at
      )
    `)
    .eq('program_id', programId)
    .order('material_id', { ascending: false })
    .limit(3)

  // Fetch recent exercises (latihan & tryout) for this program
  const { data: exercises } = await supabase
    .from('exercise_programs')
    .select(`
      exercises (
        id,
        title,
        subtitle,
        type,
        time_limit_minutes,
        question_count
      )
    `)
    .eq('program_id', programId)
    .order('exercise_id', { ascending: false })
    .limit(4)

  // Fetch recent attempts to show status
  const { data: recentAttempts } = await supabase
    .from('attempts')
    .select('exercise_id, score, is_graded, submitted_at')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const attemptMap = new Map(recentAttempts?.map(a => [a.exercise_id, a]) || [])

  const materialsList = materials?.map(mp => mp.materials as any).filter(Boolean) || []
  const exercisesList = exercises?.map(ep => ep.exercises as any).filter(Boolean) || []
  
  const latihanList = exercisesList.filter(e => e?.type === 'exercise')
  const tryoutList = exercisesList.filter(e => e?.type === 'tryout')

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-primary rounded-[--radius-xl] p-8 text-white shadow-elevated relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Halo, {student.full_name}! 👋</h1>
          <p className="text-on-dark-secondary text-lg max-w-2xl">
            Selamat datang di {(student.programs as any).name}. {(student.programs as any).subtitle || 'Mari mulai belajar dan capai targetmu hari ini!'}
          </p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-20 -top-40 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latihan Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-dark-primary">
              <PenTool className="text-accent-gold" /> Latihan Terbaru
            </h2>
            <Link href="/exercises" className="text-sm font-bold text-on-dark-secondary hover:text-on-dark-primary flex items-center gap-0.5">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          
          {latihanList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latihanList.slice(0, 2).map(ex => {
                if (!ex) return null
                const attempt = attemptMap.get(ex.id)
                const isCompleted = !!attempt?.submitted_at
                
                return (
                  <div key={ex.id} className="bg-card rounded-[--radius-lg] p-5 shadow-card border border-neutral-100 card-hover flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-block px-2.5 py-1 bg-primary-800 text-on-dark-primary text-xs font-bold rounded-full">
                        Latihan
                      </span>
                      {isCompleted && (
                        <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          Selesai
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-on-light-primary mb-1 line-clamp-1">{ex.title}</h3>
                    {ex.subtitle && <p className="text-sm text-on-light-secondary mb-4 line-clamp-2">{ex.subtitle}</p>}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-100 text-sm text-on-light-secondary">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><BookMarked size={14}/> {ex.question_count} Soal</span>
                        <span className="flex items-center gap-1.5"><Clock size={14}/> {ex.time_limit_minutes} Min</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/exercises/${ex.id}`}
                      className={`mt-4 w-full text-center py-2 rounded-[--radius-sm] text-sm font-bold transition-all ${
                        isCompleted 
                          ? 'bg-neutral-100 text-on-light-secondary hover:bg-neutral-200' 
                          : 'bg-gradient-gold-cta text-on-gold hover:bg-accent-gold-hover shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isCompleted ? 'Lihat Hasil' : 'Mulai Kerjakan'}
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
             <div className="bg-card rounded-[--radius-lg] p-8 shadow-sm border border-neutral-200 text-center text-on-light-secondary">
               Belum ada latihan yang tersedia.
             </div>
          )}

          {/* Tryout Section */}
          <div className="flex items-center justify-between pt-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-dark-primary">
              <Trophy className="text-accent-gold" /> Tryout Aktif
            </h2>
            <Link href="/tryouts" className="text-sm font-bold text-on-dark-secondary hover:text-on-dark-primary flex items-center gap-0.5">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          
          {tryoutList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tryoutList.slice(0, 2).map(ex => {
                if (!ex) return null
                const attempt = attemptMap.get(ex.id)
                const isCompleted = !!attempt?.submitted_at
                
                return (
                  <div key={ex.id} className="bg-card rounded-[--radius-lg] p-5 shadow-card border border-neutral-200 card-hover flex flex-col h-full">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-block px-2.5 py-1 bg-primary-800 text-on-dark-primary text-xs font-bold rounded-full">
                        Tryout
                      </span>
                      {isCompleted && (
                        <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          Selesai
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-on-light-primary mb-1 line-clamp-1">{ex.title}</h3>
                    {ex.subtitle && <p className="text-sm text-on-light-secondary mb-4 line-clamp-2">{ex.subtitle}</p>}
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-200 text-sm text-on-light-secondary">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><BookMarked size={14}/> {ex.question_count} Soal</span>
                        <span className="flex items-center gap-1.5"><Clock size={14}/> {ex.time_limit_minutes} Min</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/tryouts/${ex.id}`}
                      className={`mt-4 w-full text-center py-2 rounded-[--radius-sm] text-sm font-bold transition-all ${
                        isCompleted 
                          ? 'bg-neutral-100 text-on-light-secondary hover:bg-neutral-200' 
                          : 'bg-gradient-gold-cta text-on-gold hover:bg-accent-gold-hover shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isCompleted ? 'Lihat Hasil' : 'Mulai Tryout'}
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
             <div className="bg-card rounded-[--radius-lg] p-8 shadow-sm border border-neutral-200 text-center text-on-light-secondary">
               Belum ada tryout yang tersedia.
             </div>
          )}
        </div>

        {/* Sidebar - Materi Terbaru */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-dark-primary">
              <BookOpen className="text-accent-gold" /> Materi
            </h2>
            <Link href="/materials" className="text-sm font-bold text-on-dark-secondary hover:text-on-dark-primary flex items-center">
              Lihat Semua
            </Link>
          </div>

          <div className="bg-card rounded-[--radius-lg] shadow-card border border-neutral-100 overflow-hidden">
            {materialsList.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {materialsList.map(mat => {
                  if (!mat) return null
                  return (
                    <div key={mat.id} className="p-4 hover:bg-neutral-50 transition-colors">
                      <h3 className="font-bold text-on-light-primary text-sm mb-1">{mat.title}</h3>
                      {mat.subtitle && <p className="text-xs text-on-light-secondary mb-2 line-clamp-1">{mat.subtitle}</p>}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {formatDate(mat.created_at)}
                        </span>
                        <Link 
                          href={`/materials?id=${mat.id}`}
                          className="text-xs font-bold text-on-light-primary hover:text-primary-600 flex items-center gap-0.5"
                        >
                          Buka Materi <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-on-light-secondary">
                Belum ada materi terbaru.
              </div>
            )}
            
            {materialsList.length > 0 && (
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
                <Link href="/materials" className="text-xs font-bold text-on-light-secondary hover:text-on-light-primary">
                  Lihat Semua Materi
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
