import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MaterialForm from '@/components/admin/MaterialForm'
import { BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Materi',
}

export default async function EditMaterialPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: material } = await supabase
    .from('materials')
    .select('*, material_programs(program_id)')
    .eq('id', id)
    .single()

  if (!material) {
    notFound()
  }

  // Restructure the data to match the form props
  const formattedMaterial = {
    ...material,
    programs: (material.material_programs as any[])?.map(mp => ({ id: mp.program_id })) || []
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
          <BookOpen /> Edit Materi: {material.title}
        </h1>
        <p className="text-neutral-600">Perbarui informasi tautan dan akses program</p>
      </div>

      <MaterialForm initialData={formattedMaterial} programs={programs || []} isEditing={true} />
    </div>
  )
}
