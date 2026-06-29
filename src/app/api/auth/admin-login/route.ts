import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { rateLimiters } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validations/auth'
import { getClientIp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { email, password, turnstileToken } = parsed.data

    // Rate limit
    const ip = getClientIp(request.headers)
    const { success: rateLimitOk } = await rateLimiters.login(`admin:${ip}`)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Coba lagi nanti.' },
        { status: 429 }
      )
    }

    // Verify Turnstile
    const turnstileValid = await verifyTurnstileToken(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Verifikasi keamanan gagal.' },
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

    // Check user is an admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (!admin) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses admin.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Admin Login]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
