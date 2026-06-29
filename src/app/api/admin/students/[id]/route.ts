import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateStudentSchema = z.object({
  password: z.string().optional().or(z.literal('')),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  university: z.string().min(1, 'Universitas wajib diisi'),
  major: z.string().min(1, 'Jurusan wajib diisi'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  program_id: z.string().uuid('Pilih program yang valid')
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
    const validatedData = updateStudentSchema.parse(body)

    const adminAuthClient = createAdminClient()

    // 1. Update auth.users if password is provided
    if (validatedData.password && validatedData.password.length >= 8) {
      const { error: authError } = await adminAuthClient.auth.admin.updateUserById(id, {
        password: validatedData.password
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // 2. Update students table
    const { data, error: dbError } = await supabase
      .from('students')
      .update({
        full_name: validatedData.full_name,
        university: validatedData.university,
        major: validatedData.major,
        birth_date: validatedData.birth_date,
        program_id: validatedData.program_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ student: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Implement Soft Delete
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

    // Soft delete: set deleted_at to now()
    const { error: dbError } = await supabase
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
