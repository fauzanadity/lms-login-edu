import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { rateLimiters } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/validations/auth'
import { getClientIp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      const flat = parsed.error.flatten().fieldErrors
      for (const [key, messages] of Object.entries(flat)) {
        if (messages && messages.length > 0) fieldErrors[key] = messages[0]
      }
      return NextResponse.json(
        { error: 'Data tidak valid', fieldErrors },
        { status: 400 }
      )
    }

    const { fullName, university, major, birthDate, email, password, token, turnstileToken } = parsed.data

    // Rate limit
    const ip = getClientIp(request.headers)
    const { success: rateLimitOk } = await rateLimiters.register(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' },
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

    // Look up token in programs
    const supabaseAdmin = createAdminClient()
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, name, is_active, token_valid_from, token_valid_until')
      .eq('token', token)
      .single()

    if (programError || !program) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan, periksa kembali token yang diberikan.' },
        { status: 400 }
      )
    }

    if (!program.is_active) {
      return NextResponse.json(
        { error: 'Program ini sudah tidak aktif. Hubungi admin untuk informasi lebih lanjut.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const validFrom = new Date(program.token_valid_from)
    const validUntil = new Date(program.token_valid_until)

    if (now < validFrom) {
      return NextResponse.json(
        { error: `Token belum bisa digunakan, berlaku mulai ${validFrom.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.` },
        { status: 400 }
      )
    }

    if (now > validUntil) {
      return NextResponse.json(
        { error: `Token ini sudah tidak berlaku sejak ${validUntil.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}.` },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (signUpError) {
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.' },
          { status: 400 }
        )
      }
      console.error('[Register] Auth error:', signUpError)
      return NextResponse.json(
        { error: 'Gagal membuat akun. Coba lagi nanti.' },
        { status: 500 }
      )
    }

    // Insert student record
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        university,
        major,
        birth_date: birthDate,
        email,
        program_id: program.id,
      })

    if (studentError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('[Register] Student insert error:', studentError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data siswa. Coba lagi nanti.' },
        { status: 500 }
      )
    }

    // Sign in the user
    const supabase = await createClient()
    await supabase.auth.signInWithPassword({ email, password })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Register]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    )
  }
}
