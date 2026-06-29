import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentForm from '@/components/admin/StudentForm'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Siswa',
}

export default async function EditStudentPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!student) {
    notFound()
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
          <Users /> Edit Data Siswa: {student.full_name}
        </h1>
        <p className="text-neutral-600">Perbarui informasi profil dan program siswa</p>
      </div>

      <StudentForm initialData={student} programs={programs || []} isEditing={true} />
    </div>
  )
}
