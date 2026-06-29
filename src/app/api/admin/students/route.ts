import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const studentSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
  university: z.string().min(1, 'Universitas wajib diisi'),
  major: z.string().min(1, 'Jurusan wajib diisi'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  program_id: z.string().uuid('Pilih program yang valid')
})

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
    const validatedData = studentSchema.parse(body)

    // Use admin client to create user in auth schema
    const adminAuthClient = createAdminClient()
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true // Auto-confirm
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Then insert into students table using the new user's ID
    const { error: dbError } = await adminAuthClient
      .from('students')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        university: validatedData.university,
        major: validatedData.major,
        birth_date: validatedData.birth_date,
        program_id: validatedData.program_id
      })

    if (dbError) {
      // If student table insert fails, ideally we should delete the auth user to rollback
      await adminAuthClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, studentId: authData.user.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
