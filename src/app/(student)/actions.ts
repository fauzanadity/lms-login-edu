'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startAttempt(exerciseId: string, exerciseType: string, path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  // Check if attempt already exists
  const { data: existingAttempt } = await supabase
    .from('attempts')
    .select('id')
    .eq('student_id', user.id)
    .eq('exercise_id', exerciseId)
    .single()

  if (existingAttempt) {
    // Already started, just redirect
    revalidatePath(path)
    return { success: true }
  }

  // Create new attempt
  const { error } = await supabase
    .from('attempts')
    .insert({
      student_id: user.id,
      exercise_id: exerciseId,
      exercise_type: exerciseType,
      answers_json: {},
      started_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error starting attempt:', error)
    if (error.code === '23505') {
      // Unique violation - already exists
      revalidatePath(path)
      return { success: true }
    }
    throw new Error('Gagal memulai pengerjaan')
  }

  revalidatePath(path)
  return { success: true }
}
