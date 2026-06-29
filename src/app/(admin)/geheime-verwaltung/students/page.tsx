import AutoSubmitSelect from '@/components/admin/AutoSubmitSelect'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Users, Edit, UserX } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Manajemen Siswa',
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string, program?: string }>
}) {
  const { q, program: programFilter } = await searchParams
  const supabase = await createClient()

  // Fetch active programs for the filter dropdown
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  let query = supabase
    .from('students')
    .select('id, full_name, email, university, major, created_at, programs(name, deleted_at)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  if (programFilter) {
    query = query.eq('program_id', programFilter)
  }

  const { data: students, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <Users /> Manajemen Siswa
          </h1>
          <p className="text-on-dark-secondary">Total: {count || 0} Siswa Aktif</p>
        </div>
        
        <Link 
          href="/geheime-verwaltung/students/new" 
          className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-4 py-2 rounded-[--radius-sm] font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={18} /> Tambah Siswa
        </Link>
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col md:flex-row items-center gap-4">
          <form className="relative flex-1 w-full max-w-md">
            {programFilter && <input type="hidden" name="program" value={programFilter} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              name="q"
              defaultValue={q || ''}
              placeholder="Cari nama atau email..." 
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
            />
          </form>

          <form className="w-full md:w-auto">
            {q && <input type="hidden" name="q" value={q} />}
            <AutoSubmitSelect 
              name="program" 
              defaultValue={programFilter || ''}
              className="w-full md:w-auto px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
            >
              <option value="">Semua Program</option>
              {programs?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
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
                <th className="p-4 font-semibold">Program</th>
                <th className="p-4 font-semibold">Universitas & Jurusan</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-primary-900">{student.full_name}</p>
                      <p className="text-sm text-neutral-500">{student.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-block bg-accent-100 text-accent-700 px-2 py-1 rounded-md text-xs font-bold">
                          {(student.programs as any)?.name || 'Tidak ada program'}
                        </span>
                        {(student.programs as any)?.deleted_at && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mt-1 animate-pulse">
                            Program Terhapus (Perlu Dipindahkan)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      <p className="font-medium text-neutral-800">{student.university}</p>
                      <p>{student.major}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/geheime-verwaltung/students/${student.id}`}
                          className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Tidak ada data siswa ditemukan.
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
