import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TryoutClient from '@/components/tryout/TryoutClient'
import StartTryout from '@/components/tryout/StartTryout'

export const metadata: Metadata = {
  title: 'Mengerjakan Latihan',
}

export default async function ExerciseExecutionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Get the exercise and ensure it's an exercise
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .eq('type', 'exercise')
    .is('deleted_at', null)
    .single()

  if (!exercise) {
    notFound()
  }

  // 2. Ensure student has access via program
  const { data: student } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', user.id)
    .single()

  if (!student) {
    notFound()
  }

  const { data: hasAccess } = await supabase
    .from('exercise_programs')
    .select('*')
    .eq('program_id', student.program_id)
    .eq('exercise_id', id)
    .single()

  if (!hasAccess) {
    notFound()
  }

  // 3. Get existing attempt
  const { data: attempt } = await supabase
    .from('attempts')
    .select('*')
    .eq('student_id', user.id)
    .eq('exercise_id', id)
    .single()

  // 4. If no attempt, show start screen
  if (!attempt) {
    return (
      <StartTryout 
        exerciseId={exercise.id}
        exerciseType="exercise"
        title={exercise.title}
        timeLimit={exercise.time_limit_minutes}
        questionCount={exercise.question_count}
        path={`/exercises/${id}`}
      />
    )
  }

  // 5. Run exercise
  return (
    <TryoutClient 
      exercise={exercise}
      attempt={attempt}
      isTryout={false}
    />
  )
}
