import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Plus, Search, Megaphone, Archive } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import ItemActions from '@/components/admin/ItemActions'

export const metadata: Metadata = {
  title: 'Pengumuman / Broadcast',
}

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const isArchive = status === 'archive'
  const supabase = await createClient()

  let query = supabase
    .from('broadcasts')
    .select('id, title, message, created_at, broadcast_programs(programs(name, deleted_at))', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (isArchive) {
    query = query.not('deleted_at', 'is', null)
  } else {
    query = query.is('deleted_at', null)
  }

  if (q) {
    query = query.or(`title.ilike.%${q}%,message.ilike.%${q}%`)
  }

  const { data: broadcasts, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <Megaphone /> Pengumuman (Broadcast) {isArchive && <span className="text-sm font-normal text-neutral-400">(Arsip)</span>}
          </h1>
          <p className="text-on-dark-secondary">Total: {count || 0} Pengumuman {isArchive ? 'Dihapus' : 'Aktif'}</p>
        </div>
        
        {!isArchive && (
          <Link 
            href="/geheime-verwaltung/broadcasts/new" 
            className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-4 py-2 rounded-[--radius-sm] font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} /> Buat Pengumuman
          </Link>
        )}
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 overflow-hidden">
        {/* Tab Toggle */}
        <div className="flex border-b border-neutral-200 bg-neutral-50/50">
          <Link 
            href={`/geheime-verwaltung/broadcasts${q ? `?q=${q}` : ''}`}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              !isArchive 
                ? 'border-primary-600 text-primary-900 bg-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Aktif
          </Link>
          <Link 
            href={`/geheime-verwaltung/broadcasts?status=archive${q ? `&q=${q}` : ''}`}
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
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center gap-4">
          <form className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              name="q"
              defaultValue={q || ''}
              placeholder="Cari judul atau isi pesan..." 
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
                <th className="p-4 font-semibold">Pengumuman</th>
                <th className="p-4 font-semibold">Target Program</th>
                <th className="p-4 font-semibold">Tanggal Posting</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {broadcasts && broadcasts.length > 0 ? (
                broadcasts.map((broadcast) => (
                  <tr key={broadcast.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-primary-900">{broadcast.title}</p>
                      <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{broadcast.message}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(broadcast.broadcast_programs as any[])?.map((bp, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bp.programs?.deleted_at 
                                ? 'bg-red-50 text-red-600 border border-red-100 line-through' 
                                : 'bg-accent-100 text-accent-700'
                            }`}
                            title={bp.programs?.deleted_at ? 'Program ini telah dihapus' : undefined}
                          >
                            {bp.programs?.name} {bp.programs?.deleted_at && ' (Terhapus)'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-neutral-600">
                      {formatDate(broadcast.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      <ItemActions 
                        id={broadcast.id}
                        name={broadcast.title}
                        type="broadcasts"
                        isArchive={isArchive}
                        editUrl={isArchive ? undefined : `/geheime-verwaltung/broadcasts/${broadcast.id}`}
                        deleteConfirmText={`Apakah Anda yakin ingin menghapus pengumuman "${broadcast.title}"?`}
                        restoreConfirmText={`Apakah Anda yakin ingin memulihkan pengumuman "${broadcast.title}"?`}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    Tidak ada pengumuman ditemukan.
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
