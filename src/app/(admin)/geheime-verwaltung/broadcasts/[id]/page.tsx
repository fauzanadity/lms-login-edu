import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BroadcastForm from '@/components/admin/BroadcastForm'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Pengumuman',
}

export default async function EditBroadcastPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: broadcast } = await supabase
    .from('broadcasts')
    .select('*, broadcast_programs(program_id)')
    .eq('id', id)
    .single()

  if (!broadcast) {
    notFound()
  }

  // Restructure the data to match the form props
  const formattedBroadcast = {
    ...broadcast,
    programs: (broadcast.broadcast_programs as any[])?.map(bp => ({ id: bp.program_id })) || []
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <Megaphone /> Edit Pengumuman
        </h1>
        <p className="text-neutral-600">Perbarui isi pengumuman atau target program</p>
      </div>

      <BroadcastForm initialData={formattedBroadcast} programs={programs || []} isEditing={true} />
    </div>
  )
}
