import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { rateLimiters } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validations/auth'
import { getClientIp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password, turnstileToken } = parsed.data

    // Rate limit
    const ip = getClientIp(request.headers)
    const { success: rateLimitOk } = await rateLimiters.login(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' },
        { status: 429 }
      )
    }

    // Verify Turnstile
    const turnstileValid = await verifyTurnstileToken(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.' },
        { status: 400 }
      )
    }

    // Sign in
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Check user is a student (not deleted) and check their program status
    const { data: student } = await supabase
      .from('students')
      .select('id, deleted_at, program_id, programs(deleted_at)')
      .eq('id', authData.user.id)
      .single()

    if (!student) {
      // Not a student - sign out
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Akun tidak ditemukan sebagai siswa.' },
        { status: 403 }
      )
    }

    if (student.deleted_at) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' },
        { status: 403 }
      )
    }

    if ((student as any).programs?.deleted_at) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Program Anda sudah tidak tersedia, hubungi admin.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Login]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
