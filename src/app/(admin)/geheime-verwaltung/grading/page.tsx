import AutoSubmitSelect from '@/components/admin/AutoSubmitSelect'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Search, Clock } from 'lucide-react'
import Link from 'next/link'
import ExportButton from '@/components/admin/ExportButton'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Penilaian & Hasil',
}

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string, program?: string }>
}) {
  const { exercise: exerciseFilter, program: programFilter } = await searchParams
  const supabase = await createClient()

  // Fetch lookups for filters
  const { data: exercises } = await supabase.from('exercises').select('id, title').order('created_at', { ascending: false })
  const { data: programs } = await supabase.from('programs').select('id, name').eq('is_active', true).order('name')

  let query = supabase
    .from('attempts')
    .select(`
      id, 
      score, 
      is_graded, 
      exercise_type, 
      started_at, 
      submitted_at,
      students!inner(full_name, program_id, programs(name)),
      exercises!inner(title)
    `, { count: 'exact' })
    .order('submitted_at', { ascending: false, nullsFirst: true })

  if (exerciseFilter) {
    query = query.eq('exercise_id', exerciseFilter)
  }

  if (programFilter) {
    query = query.eq('students.program_id', programFilter)
  }

  const { data: attempts, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <CheckCircle /> Penilaian & Hasil
          </h1>
          <p className="text-on-dark-secondary">Total: {count || 0} Riwayat Pengerjaan</p>
        </div>
        
        <ExportButton exerciseId={exerciseFilter} programId={programFilter} />
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col md:flex-row items-center gap-4">
          <form className="w-full flex flex-col md:flex-row gap-4">
            <AutoSubmitSelect 
              name="program" 
              defaultValue={programFilter || ''}
              className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
            >
              <option value="">Semua Program</option>
              {programs?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </AutoSubmitSelect>

            <AutoSubmitSelect 
              name="exercise" 
              defaultValue={exerciseFilter || ''}
              className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
            >
              <option value="">Semua Soal / Tryout</option>
              {exercises?.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </AutoSubmitSelect>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm border-b border-neutral-200">
                <th className="p-4 font-semibold">Nama Siswa</th>
                <th className="p-4 font-semibold">Soal yang Dikerjakan</th>
                <th className="p-4 font-semibold">Status / Skor</th>
                <th className="p-4 font-semibold">Waktu Kumpul</th>
                <th className="p-4 font-semibold text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {attempts && attempts.length > 0 ? (
                attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-primary-900">{(attempt.students as any)?.full_name}</p>
                      <p className="text-xs text-neutral-500 mt-1">{(attempt.students as any)?.programs?.name}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-neutral-800 line-clamp-1">{(attempt.exercises as any)?.title}</p>
                      <p className="text-xs font-semibold mt-1">
                        {attempt.exercise_type === 'tryout' ? (
                          <span className="text-warning-700 uppercase">Tryout</span>
                        ) : (
                          <span className="text-primary-700 uppercase">Latihan</span>
                        )}
                      </p>
                    </td>
                    <td className="p-4">
                      {attempt.submitted_at ? (
                        <div className="flex flex-col items-start">
                          <span className="text-lg font-bold text-success-700">{attempt.score !== null ? attempt.score : '0'}</span>
                          {attempt.is_graded ? (
                            <span className="text-xs text-success bg-success/10 px-2 rounded-full font-bold">Selesai</span>
                          ) : (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded-full font-bold">Perlu Penilaian</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-xs text-warning-700 bg-warning/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Clock size={12} /> Sedang Dikerjakan
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {attempt.submitted_at ? formatDate(attempt.submitted_at) : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {attempt.submitted_at && (
                        <Link 
                          href={`/geheime-verwaltung/grading/${attempt.id}`}
                          className="px-3 py-1 bg-accent-50 text-accent-700 hover:bg-accent-100 font-medium rounded transition-colors text-sm"
                        >
                          Lihat Detail
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    Tidak ada riwayat pengerjaan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
