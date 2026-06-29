import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExerciseForm from '@/components/admin/ExerciseForm'
import { PenTool } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Soal',
}

export default async function EditExercisePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*, exercise_programs(program_id)')
    .eq('id', id)
    .single()

  if (!exercise) {
    notFound()
  }

  // Restructure the data to match the form props
  const formattedExercise = {
    ...exercise,
    programs: (exercise.exercise_programs as any[])?.map(ep => ({ id: ep.program_id })) || []
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <PenTool /> Edit Soal: {exercise.title}
        </h1>
        <p className="text-neutral-600">Perbarui spesifikasi atau revisi JSON data soal</p>
      </div>

      <ExerciseForm initialData={formattedExercise as any} programs={programs || []} isEditing={true} />
    </div>
  )
}
