import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit'
import { calculateScore } from '@/lib/scoring'
import { z } from 'zod'

const submitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  attempt_id: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit
    const { success: rateLimitOk } = await rateLimiters.submit(user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Terlalu banyak request.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      const error = parsed.error
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const { answers, attempt_id } = parsed.data

    // Get attempt and verify ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('id, student_id, exercise_id, submitted_at')
      .eq('id', attempt_id)
      .eq('student_id', user.id)
      .eq('exercise_id', exerciseId)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt tidak ditemukan' }, { status: 404 })
    }

    // Idempotent guard: if already submitted, return existing result
    if (attempt.submitted_at) {
      return NextResponse.json({ error: 'Jawaban sudah disubmit sebelumnya.', already_submitted: true }, { status: 400 })
    }

    // Get exercise for scoring
    const { data: exercise } = await supabase
      .from('exercises')
      .select('questions_json, type')
      .eq('id', exerciseId)
      .single()

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise tidak ditemukan' }, { status: 404 })
    }

    // Calculate score (O(n) in-memory)
    const scoreResult = calculateScore(exercise.questions_json, answers)

    // Server-authoritative submit time
    const { error: updateError } = await supabase
      .from('attempts')
      .update({
        answers_json: answers,
        score: scoreResult.totalScore,
        is_graded: !scoreResult.hasManualGradeQuestions,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', attempt_id)
      .eq('student_id', user.id)

    if (updateError) {
      console.error('[Submit]', updateError)
      return NextResponse.json({ error: 'Gagal menyimpan jawaban' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      score: scoreResult.totalScore,
      maxScore: scoreResult.maxPossibleScore,
      correct: scoreResult.correctCount,
      incorrect: scoreResult.incorrectCount,
      unanswered: scoreResult.unansweredCount,
      hasManualGrade: scoreResult.hasManualGradeQuestions,
      breakdown: scoreResult.breakdown,
    })
  } catch (error) {
    console.error('[Submit]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
