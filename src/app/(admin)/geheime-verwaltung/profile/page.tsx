'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Lock, User, Loader2 } from 'lucide-react'

export default function AdminProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminData, setAdminData] = useState<{ id: string; full_name: string; email: string } | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/geheime-verwaltung/login')
        return
      }

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setAdminData(data)
      setFullName(data.full_name)
    } catch (error) {
      console.error('Error fetching admin profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!adminData) return
    
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('admins')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', adminData.id)

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Gagal memperbarui profil.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' })
      return
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Password berhasil diperbarui.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Gagal memperbarui password.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900">Profil Admin</h1>
        <p className="text-neutral-600 mt-1">Kelola data profil dan keamanan akun Anda</p>
      </div>

      {message && (
        <div className={`p-4 rounded-[--radius-sm] mb-6 flex items-start gap-3 ${
          message.type === 'success' ? 'bg-success/10 text-success-700 border border-success/20' : 'bg-danger/10 text-danger-700 border border-danger/20'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Info Form */}
        <div className="bg-card border border-neutral-200 rounded-[--radius-md] overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
            <User size={18} className="text-neutral-500" />
            <h2 className="font-semibold text-primary-900">Informasi Dasar</h2>
          </div>
          
          <form onSubmit={handleSaveProfile} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={adminData?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] bg-neutral-50 text-neutral-500 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500 mt-1">Email tidak dapat diubah.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 focus:border-accent-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving || !fullName}
                className="bg-primary-900 hover:bg-primary-800 text-white px-4 py-2 rounded-[--radius-sm] font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Profil
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-card border border-neutral-200 rounded-[--radius-md] overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center gap-2">
            <Lock size={18} className="text-neutral-500" />
            <h2 className="font-semibold text-primary-900">Ganti Password</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 focus:border-accent-600 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 focus:border-accent-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving || !newPassword || !confirmPassword}
                className="bg-primary-900 hover:bg-primary-800 text-white px-4 py-2 rounded-[--radius-sm] font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Ganti Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
