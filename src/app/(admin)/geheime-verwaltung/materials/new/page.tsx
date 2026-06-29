import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import MaterialForm from '@/components/admin/MaterialForm'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tambah Materi Baru',
}

export default async function NewMaterialPage() {
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
          <BookOpen /> Tambah Materi Baru
        </h1>
        <p className="text-neutral-600">Unggah tautan materi dan atur akses program siswa</p>
      </div>

      <MaterialForm programs={programs || []} />
    </div>
  )
}
