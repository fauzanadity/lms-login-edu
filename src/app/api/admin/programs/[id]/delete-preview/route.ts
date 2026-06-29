import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Count active materials linked exclusively to this program
    const { data: matProgs } = await supabase
      .from('material_programs')
      .select('material_id, materials!inner(deleted_at)')
      .eq('program_id', id)
      .is('materials.deleted_at', null)

    const activeMatIds = matProgs?.map(mp => mp.material_id) || []
    let exclusiveMaterialsCount = 0
    if (activeMatIds.length > 0) {
      const { data: allMatAssoc } = await supabase
        .from('material_programs')
        .select('material_id, programs!inner(deleted_at)')
        .in('material_id', activeMatIds)
        .is('programs.deleted_at', null)
      
      const counts: Record<string, number> = {}
      allMatAssoc?.forEach(assoc => {
        counts[assoc.material_id] = (counts[assoc.material_id] || 0) + 1
      })
      exclusiveMaterialsCount = Object.values(counts).filter(c => c === 1).length
    }

    // 2. Count active exercises linked exclusively to this program
    const { data: exeProgs } = await supabase
      .from('exercise_programs')
      .select('exercise_id, exercises!inner(deleted_at)')
      .eq('program_id', id)
      .is('exercises.deleted_at', null)

    const activeExeIds = exeProgs?.map(ep => ep.exercise_id) || []
    let exclusiveExercisesCount = 0
    if (activeExeIds.length > 0) {
      const { data: allExeAssoc } = await supabase
        .from('exercise_programs')
        .select('exercise_id, programs!inner(deleted_at)')
        .in('exercise_id', activeExeIds)
        .is('programs.deleted_at', null)
      
      const counts: Record<string, number> = {}
      allExeAssoc?.forEach(assoc => {
        counts[assoc.exercise_id] = (counts[assoc.exercise_id] || 0) + 1
      })
      exclusiveExercisesCount = Object.values(counts).filter(c => c === 1).length
    }

    // 3. Count active broadcasts linked exclusively to this program
    const { data: broadProgs } = await supabase
      .from('broadcast_programs')
      .select('broadcast_id, broadcasts!inner(deleted_at)')
      .eq('program_id', id)
      .is('broadcasts.deleted_at', null)

    const activeBroadIds = broadProgs?.map(bp => bp.broadcast_id) || []
    let exclusiveBroadcastsCount = 0
    if (activeBroadIds.length > 0) {
      const { data: allBroadAssoc } = await supabase
        .from('broadcast_programs')
        .select('broadcast_id, programs!inner(deleted_at)')
        .in('broadcast_id', activeBroadIds)
        .is('programs.deleted_at', null)
      
      const counts: Record<string, number> = {}
      allBroadAssoc?.forEach(assoc => {
        counts[assoc.broadcast_id] = (counts[assoc.broadcast_id] || 0) + 1
      })
      exclusiveBroadcastsCount = Object.values(counts).filter(c => c === 1).length
    }

    // 4. Count active students in this program
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', id)
      .is('deleted_at', null)

    return NextResponse.json({
      materialsCount: exclusiveMaterialsCount,
      exercisesCount: exclusiveExercisesCount,
      broadcastsCount: exclusiveBroadcastsCount,
      studentsCount: studentsCount || 0
    })
  } catch (error) {
    console.error('[Delete Preview]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
