import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const materialSchema = z.object({
  title: z.string().min(1, 'Judul materi wajib diisi').max(255),
  subtitle: z.string().nullable().optional(),
  drive_url: z.string().url('URL tidak valid'),
  program_ids: z.array(z.string().uuid()).min(1, 'Pilih minimal 1 program')
})

export async function PUT(
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

    const body = await request.json()
    const validatedData = materialSchema.parse(body)

    // 1. Update materials table
    const { data: material, error: updateError } = await supabase
      .from('materials')
      .update({
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        drive_url: validatedData.drive_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 2. Update junction table: delete existing and insert new
    await supabase.from('material_programs').delete().eq('material_id', id)

    const junctionData = validatedData.program_ids.map(programId => ({
      material_id: id,
      program_id: programId
    }))

    const { error: junctionError } = await supabase
      .from('material_programs')
      .insert(junctionData)

    if (junctionError) {
      return NextResponse.json({ error: junctionError.message }, { status: 500 })
    }

    return NextResponse.json({ material })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Manual delete: set deleted_at = now() and deleted_by_program_id = NULL
    const { data, error } = await supabase
      .from('materials')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by_program_id: null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ material: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
