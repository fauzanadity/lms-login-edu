import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStudentProfileSchema } from '@/lib/validations/student'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: student, error } = await supabase
      .from('students')
      .select('*, programs(name)')
      .eq('id', user.id)
      .is('deleted_at', null)
      .single()

    if (error || !student) {
      return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('[Profile GET]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = updateStudentProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('students')
      .update(parsed.data)
      .eq('id', user.id)

    if (error) {
      console.error('[Profile PUT]', error)
      return NextResponse.json({ error: 'Gagal update profil' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Profile PUT]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
