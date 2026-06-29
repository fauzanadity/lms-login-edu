import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgramForm from '@/components/admin/ProgramForm'
import { FolderKey } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Program',
}

export default async function EditProgramPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (!program) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <FolderKey /> Edit Program: {program.name}
        </h1>
        <p className="text-neutral-600">Perbarui informasi program dan pengaturan akses</p>
      </div>

      <ProgramForm initialData={program} isEditing={true} />
    </div>
  )
}
