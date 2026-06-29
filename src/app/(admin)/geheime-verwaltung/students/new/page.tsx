import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import StudentForm from '@/components/admin/StudentForm'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tambah Siswa Baru',
}

export default async function NewStudentPage() {
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
          <Users /> Tambah Siswa Baru
        </h1>
        <p className="text-neutral-600">Mendaftarkan siswa secara manual ke dalam sistem</p>
      </div>

      <StudentForm programs={programs || []} />
    </div>
  )
}
