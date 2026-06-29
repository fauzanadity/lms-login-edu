import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ExerciseForm from '@/components/admin/ExerciseForm'
import { PenTool } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buat Soal Baru',
}

export default async function NewExercisePage() {
  const supabase = await createClient()

  // Get active programs to populate dropdown
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <PenTool /> Buat Soal / Tryout Baru
        </h1>
        <p className="text-neutral-600">Unggah file JSON format Login Edu dan pilih program akses</p>
      </div>

      <ExerciseForm programs={programs || []} />
    </div>
  )
}
