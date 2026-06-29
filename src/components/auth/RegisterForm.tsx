'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react'
import TurnstileWidget from './TurnstileWidget'

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    major: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: '',
    token: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Selesaikan verifikasi keamanan terlebih dahulu')
      return
    }

    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        }
        setError(data.error || 'Registrasi gagal')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Coba lagi nanti.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-neutral-800 placeholder:text-neutral-300'
  const labelCls = 'block text-sm font-medium text-on-light-secondary mb-1.5'
  const errorCls = 'text-red-500 text-xs mt-1'

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-20 h-20 rounded-full bg-primary-900 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
            <Image
              src="/logo.png"
              alt="Login Edu"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="text-3xl font-black text-on-dark-primary tracking-tight leading-none mt-1">Login Edu</span>
        </div>
        <p className="text-white text-lg font-medium italic">&ldquo;Login Aja Dulu!&rdquo;</p>
      </div>

      <div className="bg-card rounded-[--radius-lg] shadow-elevated p-8">
        <h1 className="text-2xl font-bold text-on-light-primary mb-1">Daftar Akun</h1>
        <p className="text-on-light-secondary mb-6">Buat akun siswa baru di Login Edu</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Nama Lengkap */}
          <div>
            <label htmlFor="fullName" className={labelCls}>Nama Lengkap</label>
            <input id="fullName" type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} required placeholder="Masukkan nama lengkap" className={inputCls} />
            {fieldErrors.fullName && <p className={errorCls}>{fieldErrors.fullName}</p>}
          </div>

          {/* 2. Universitas */}
          <div>
            <label htmlFor="university" className={labelCls}>Universitas</label>
            <input id="university" type="text" value={formData.university} onChange={(e) => updateField('university', e.target.value)} required placeholder="Contoh: Institut Teknologi Bandung (jangan disingkat ITB)" className={inputCls} />
            {fieldErrors.university && <p className={errorCls}>{fieldErrors.university}</p>}
          </div>

          {/* 3. Jurusan */}
          <div>
            <label htmlFor="major" className={labelCls}>Jurusan</label>
            <input id="major" type="text" value={formData.major} onChange={(e) => updateField('major', e.target.value)} required placeholder="Contoh: Teknik Informatika (jangan disingkat TI)" className={inputCls} />
            <p className="text-xs text-on-light-secondary mt-1">Khusus mahasiswa ITB semester 1, tulis &ldquo;TPB&rdquo;.</p>
            {fieldErrors.major && <p className={errorCls}>{fieldErrors.major}</p>}
          </div>

          {/* 4. Tanggal Lahir */}
          <div>
            <label htmlFor="birthDate" className={labelCls}>Tanggal Lahir</label>
            <input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => updateField('birthDate', e.target.value)} required className={inputCls} />
            {fieldErrors.birthDate && <p className={errorCls}>{fieldErrors.birthDate}</p>}
          </div>

          {/* 5. Email */}
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required placeholder="nama@email.com" className={inputCls} />
            {fieldErrors.email && <p className={errorCls}>{fieldErrors.email}</p>}
          </div>

          {/* 6. Password */}
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => updateField('password', e.target.value)} required placeholder="Min. 8 karakter, huruf besar, kecil, angka" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-on-light-primary transition-colors" aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className={errorCls}>{fieldErrors.password}</p>}
          </div>

          {/* 7. Konfirmasi Password */}
          <div>
            <label htmlFor="confirmPassword" className={labelCls}>Ulangi Password</label>
            <div className="relative">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required placeholder="Ketik ulang password" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-on-light-primary transition-colors" aria-label={showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className={errorCls}>{fieldErrors.confirmPassword}</p>}
          </div>

          {/* 8. Token Program */}
          <div>
            <label htmlFor="token" className={labelCls}>Token Program</label>
            <input id="token" type="text" value={formData.token} onChange={(e) => updateField('token', e.target.value)} required placeholder="Masukkan token yang diberikan" className={inputCls} />
            {fieldErrors.token && <p className={errorCls}>{fieldErrors.token}</p>}
          </div>

          <TurnstileWidget onSuccess={setTurnstileToken} onError={() => setTurnstileToken(null)} onExpire={() => setTurnstileToken(null)} />

          <button type="submit" disabled={loading || !turnstileToken} className="w-full bg-gradient-gold-cta hover:bg-accent-gold-hover disabled:bg-neutral-200 disabled:text-neutral-300 text-on-gold font-bold py-2.5 px-4 rounded-[--radius-sm] transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-light-secondary">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-on-light-primary hover:text-primary-600 font-bold transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
