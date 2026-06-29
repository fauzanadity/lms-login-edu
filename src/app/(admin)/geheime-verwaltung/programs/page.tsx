import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, FolderKey, ShieldCheck, ShieldAlert, Archive } from 'lucide-react'
import ProgramActions from '@/components/admin/ProgramActions'

export const metadata: Metadata = {
  title: 'Kelola Program',
}

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const isArchive = status === 'archive'
  const supabase = await createClient()

  let query = supabase
    .from('programs')
    .select('id, name, token, is_active, token_valid_from, token_valid_until, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (isArchive) {
    query = query.not('deleted_at', 'is', null)
  } else {
    query = query.is('deleted_at', null)
  }

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: programs, count } = await query

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <FolderKey /> Kelola Program {isArchive && <span className="text-sm font-normal text-neutral-400">(Arsip)</span>}
          </h1>
          <p className="text-on-dark-secondary">Total: {count || 0} Program {isArchive ? 'Dihapus' : 'Aktif'}</p>
        </div>
        
        {!isArchive && (
          <Link 
            href="/geheime-verwaltung/programs/new" 
            className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-4 py-2 rounded-[--radius-sm] font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} /> Program Baru
          </Link>
        )}
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 overflow-hidden">
        {/* Tab Toggle */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          <Link 
            href={`/geheime-verwaltung/programs${q ? `?q=${q}` : ''}`}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              !isArchive 
                ? 'border-primary-600 text-primary-900 bg-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Aktif
          </Link>
          <Link 
            href={`/geheime-verwaltung/programs?status=archive${q ? `&q=${q}` : ''}`}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              isArchive 
                ? 'border-primary-600 text-primary-900 bg-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Archive size={16} /> Arsip / Sampah
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center gap-4">
          <form className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              name="q"
              defaultValue={q || ''}
              placeholder="Cari nama program..." 
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-sm border-b border-neutral-200">
                <th className="p-4 font-semibold">Nama Program</th>
                <th className="p-4 font-semibold">Token</th>
                <th className="p-4 font-semibold">Masa Berlaku Token</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {programs && programs.length > 0 ? (
                programs.map((program) => {
                  const validFrom = new Date(program.token_valid_from)
                  const validUntil = new Date(program.token_valid_until)
                  const isTokenValid = now >= validFrom && now <= validUntil

                  return (
                    <tr key={program.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-bold text-primary-900">{program.name}</td>
                      <td className="p-4">
                        <span className="font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-700 font-semibold border border-neutral-200">
                          {program.token}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-neutral-600">
                        {validFrom.toLocaleDateString('id-ID')} - {validUntil.toLocaleDateString('id-ID')}
                        {!isTokenValid && (
                          <span className="ml-2 text-xs font-bold text-danger bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            Kedaluwarsa
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {program.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                            <ShieldCheck size={14} /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
                            <ShieldAlert size={14} /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <ProgramActions 
                          programId={program.id}
                          programName={program.name}
                          isArchive={isArchive}
                        />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    Tidak ada data program ditemukan.
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
