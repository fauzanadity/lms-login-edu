import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BroadcastForm from '@/components/admin/BroadcastForm'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buat Pengumuman',
}

export default async function NewBroadcastPage() {
  const supabase = await createClient()

  // Get active programs to populate dropdown
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Megaphone /> Buat Pengumuman Baru
        </h1>
        <p className="text-neutral-600">Tulis pesan yang akan muncul di dashboard siswa</p>
      </div>

      <BroadcastForm programs={programs || []} />
    </div>
  )
}
