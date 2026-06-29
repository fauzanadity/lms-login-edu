import AutoSubmitSelect from '@/components/admin/AutoSubmitSelect'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, PenTool, Trophy, Archive } from 'lucide-react'
import ItemActions from '@/components/admin/ItemActions'

export const metadata: Metadata = {
  title: 'Manajemen Latihan & Tryout',
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>
}) {
  const { q, type, status } = await searchParams
  const isArchive = status === 'archive'
  const supabase = await createClient()

  let query = supabase
    .from('exercises')
    .select('id, title, subtitle, type, time_limit_minutes, question_count, created_at, exercise_programs(programs(name, deleted_at))', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (isArchive) {
    query = query.not('deleted_at', 'is', null)
  } else {
    query = query.is('deleted_at', null)
  }

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }
  
  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  const { data: exercises, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <PenTool /> Manajemen Latihan & Tryout {isArchive && <span className="text-sm font-normal text-neutral-400">(Arsip)</span>}
          </h1>
          <p className="text-on-dark-secondary">Total: {count || 0} Soal {isArchive ? 'Dihapus' : 'Aktif'}</p>
        </div>
        
        {!isArchive && (
          <Link 
            href="/geheime-verwaltung/exercises/new" 
            className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-4 py-2 rounded-[--radius-sm] font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} /> Buat Paket Soal
          </Link>
        )}
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 overflow-hidden">
        {/* Tab Toggle */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          <Link 
            href={`/geheime-verwaltung/exercises${q ? `?q=${q}` : ''}${type ? `&type=${type}` : ''}`}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              !isArchive 
                ? 'border-primary-600 text-primary-900 bg-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Aktif
          </Link>
          <Link 
            href={`/geheime-verwaltung/exercises?status=archive${q ? `&q=${q}` : ''}${type ? `&type=${type}` : ''}`}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              isArchive 
                ? 'border-primary-600 text-primary-900 bg-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Archive size={16} /> Arsip / Sampah
          </Link>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col md:flex-row items-center gap-4">
          <form className="relative flex-1 w-full max-w-md">
            {type && <input type="hidden" name="type" value={type} />}
            {status && <input type="hidden" name="status" value={status} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              name="q"
              defaultValue={q || ''}
              placeholder="Cari judul soal..." 
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
            />
          </form>

          <form className="w-full md:w-auto flex gap-2">
            {q && <input type="hidden" name="q" value={q} />}
            {status && <input type="hidden" name="status" value={status} />}
            <AutoSubmitSelect 
              name="type" 
              defaultValue={type || 'all'}
              className="w-full md:w-auto px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
            >
              <option value="all">Semua Tipe</option>
              <option value="exercise">Latihan Mandiri</option>
              <option value="tryout">Tryout</option>
            </AutoSubmitSelect>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm border-b border-neutral-200">
                <th className="p-4 font-semibold">Judul & Info</th>
                <th className="p-4 font-semibold">Program</th>
                <th className="p-4 font-semibold text-center">Spesifikasi</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {exercises && exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${exercise.type === 'tryout' ? 'bg-warning/10 text-warning-700' : 'bg-primary-50 text-primary-700'}`}>
                          {exercise.type === 'tryout' ? <Trophy size={18} /> : <PenTool size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-primary-900">{exercise.title}</p>
                          <p className="text-xs font-semibold mt-1">
                            {exercise.type === 'tryout' ? (
                              <span className="text-warning-700 uppercase">Tryout</span>
                            ) : (
                              <span className="text-primary-700 uppercase">Latihan Mandiri</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(exercise.exercise_programs as any[])?.map((ep, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ep.programs?.deleted_at 
                                ? 'bg-red-50 text-red-600 border border-red-100 line-through' 
                                : 'bg-accent-100 text-accent-700'
                            }`}
                            title={ep.programs?.deleted_at ? 'Program ini telah dihapus' : undefined}
                          >
                            {ep.programs?.name} {ep.programs?.deleted_at && ' (Terhapus)'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-neutral-800">{exercise.question_count}</span>
                          <span className="text-xs text-neutral-500 uppercase font-semibold">Soal</span>
                        </div>
                        <div className="w-px bg-neutral-200 h-8"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-neutral-800">{exercise.time_limit_minutes}</span>
                          <span className="text-xs text-neutral-500 uppercase font-semibold">Menit</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <ItemActions 
                        id={exercise.id}
                        name={exercise.title}
                        type="exercises"
                        isArchive={isArchive}
                        editUrl={isArchive ? undefined : `/geheime-verwaltung/exercises/${exercise.id}`}
                        deleteConfirmText={`Apakah Anda yakin ingin menghapus paket soal "${exercise.title}"?`}
                        restoreConfirmText={`Apakah Anda yakin ingin memulihkan paket soal "${exercise.title}"?`}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Tidak ada data soal ditemukan.
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
