import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exerciseSchema, questionsPayloadSchema } from '@/lib/validations/exercise'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    const payloadToValidate = {
      title: body.title,
      subtitle: body.subtitle,
      type: body.type,
      time_limit_minutes: body.time_limit_minutes,
      program_ids: body.program_ids
    }

    const validatedData = exerciseSchema.parse(payloadToValidate)
    const validatedQuestions = questionsPayloadSchema.parse(body.questions_json)

    const question_count = validatedQuestions.questions.length

    // 1. Insert into exercises table
    const { data: exercise, error: insertError } = await supabase
      .from('exercises')
      .insert({
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        type: validatedData.type,
        time_limit_minutes: validatedData.time_limit_minutes,
        question_count: question_count,
        questions_json: validatedQuestions as any,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 2. Insert into exercise_programs junction table
    const junctionData = validatedData.program_ids.map(programId => ({
      exercise_id: exercise.id,
      program_id: programId
    }))

    const { error: junctionError } = await supabase
      .from('exercise_programs')
      .insert(junctionData)

    if (junctionError) {
      return NextResponse.json({ error: junctionError.message }, { status: 500 })
    }

    return NextResponse.json({ exercise })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
