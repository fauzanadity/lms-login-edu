import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters } from '@/lib/rate-limit'
import { z } from 'zod'

const autosaveSchema = z.object({
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
    const { success: rateLimitOk } = await rateLimiters.autosave(user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = autosaveSchema.safeParse(body)
    if (!parsed.success) {
      if (parsed.error instanceof z.ZodError) {
        return NextResponse.json({ error: (parsed.error as any).errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const { answers, attempt_id } = parsed.data

    // Upsert - update answers and autosave timestamp
    // Only if not yet submitted (don't overwrite submitted answers)
    const { error } = await supabase
      .from('attempts')
      .update({
        answers_json: answers,
        last_autosaved_at: new Date().toISOString(),
      })
      .eq('id', attempt_id)
      .eq('student_id', user.id)
      .eq('exercise_id', exerciseId)
      .is('submitted_at', null) // Only auto-save if not yet submitted

    if (error) {
      console.error('[Autosave]', error)
      return NextResponse.json({ error: 'Gagal auto-save' }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved_at: new Date().toISOString() })
  } catch (error) {
    console.error('[Autosave]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
