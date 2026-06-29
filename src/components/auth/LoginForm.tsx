'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import TurnstileWidget from './TurnstileWidget'

export default function LoginForm({ errorParam }: { errorParam?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    errorParam === 'role-mismatch' 
      ? 'Akun Anda tidak terdaftar sebagai siswa.' 
      : errorParam === 'program-deleted'
        ? 'Program Anda sudah tidak tersedia, hubungi admin.'
        : null
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Selesaikan verifikasi keamanan terlebih dahulu')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login gagal. Periksa email dan password Anda.')
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

  return (
    <div className="w-full max-w-md">
      {/* Logo & Slogan */}
      <div className="text-center mb-8">
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
        <p className="text-white text-lg font-medium italic">
          &ldquo;Login Aja Dulu!&rdquo;
        </p>
      </div>

      {/* Card */}
      <div className="bg-card rounded-[--radius-lg] shadow-elevated p-8">
        <h1 className="text-2xl font-bold text-on-light-primary mb-1">Masuk</h1>
        <p className="text-on-light-secondary mb-6">Masuk ke akun siswa Login Edu</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[--radius-sm] mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-light-secondary mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-neutral-800 placeholder:text-neutral-300"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-light-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                className="w-full px-4 py-2.5 pr-11 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-neutral-800 placeholder:text-neutral-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-on-light-primary transition-colors"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <TurnstileWidget
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
          />

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-gradient-gold-cta hover:bg-accent-gold-hover disabled:bg-neutral-200 disabled:text-neutral-300 text-on-gold font-bold py-2.5 px-4 rounded-[--radius-sm] transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-on-light-secondary">
            Belum punya akun?{' '}
            <Link href="/register" className="text-on-light-primary hover:text-primary-600 font-bold transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
