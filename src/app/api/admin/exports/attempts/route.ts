import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exercise_id')
    const programId = searchParams.get('program_id')

    let query = supabase
      .from('attempts')
      .select(`
        id, 
        score, 
        is_graded, 
        exercise_type, 
        started_at, 
        submitted_at,
        students!inner(full_name, email, university, program_id, programs(name)),
        exercises!inner(title)
      `)
      .order('submitted_at', { ascending: false })

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
    }

    if (programId) {
      query = query.eq('students.program_id', programId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Since Supabase might filter out rows if inner joins fail, we don't need additional strict filtering here
    // But we should ensure the nested structure is robust
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
