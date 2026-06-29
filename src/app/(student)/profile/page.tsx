'use client'

import { useState, useEffect } from 'react'
import { User, Mail, GraduationCap, Calendar, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    major: '',
    birth_date: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/student/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.student)
        setFormData({
          full_name: data.student.full_name || '',
          university: data.student.university || '',
          major: data.student.major || '',
          birth_date: data.student.birth_date || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess('Profil berhasil diperbarui')
        fetchProfile() // Refresh data
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal memperbarui profil')
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })

      if (res.ok) {
        setPasswordSuccess('Password berhasil diubah')
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
      } else {
        const data = await res.json()
        setPasswordError(data.error || 'Gagal mengubah password')
      }
    } catch (err) {
      setPasswordError('Terjadi kesalahan jaringan')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary-500" size={48} /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-800 text-accent-gold rounded-lg border border-primary-700">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary">Profil Saya</h1>
          <p className="text-on-dark-secondary text-sm">Kelola informasi akun Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200 text-center">
            <div className="w-24 h-24 mx-auto bg-primary-800 text-on-dark-primary border border-primary-700 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-sm">
              {profile?.full_name?.charAt(0) || 'S'}
            </div>
            <h2 className="text-xl font-bold text-on-light-primary mb-1">{profile?.full_name}</h2>
            <p className="text-sm text-on-light-secondary mb-4">{profile?.email}</p>
            
            <div className="inline-block bg-neutral-100 text-on-light-secondary border border-neutral-200 px-3 py-1 rounded-full text-xs font-bold mb-6 shadow-sm">
              Siswa {profile?.programs?.name}
            </div>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-on-light-secondary pb-3 border-b border-neutral-100">
                <Mail size={16} className="text-neutral-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-light-secondary pb-3 border-b border-neutral-100">
                <GraduationCap size={16} className="text-neutral-400" />
                <span className="truncate">{profile?.university}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200">
            <h3 className="text-lg font-bold text-on-light-primary mb-4 border-b border-neutral-100 pb-4">Edit Informasi Pribadi</h3>
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center gap-2 text-sm">
                <CheckCircle size={16} /> {success}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-light-secondary mb-1">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><User size={18} /></div>
                  <input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-light-secondary mb-1">Universitas</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><GraduationCap size={18} /></div>
                    <input type="text" required value={formData.university} onChange={(e) => setFormData({...formData, university: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-light-secondary mb-1">Jurusan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><GraduationCap size={18} /></div>
                    <input type="text" required value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-light-secondary mb-1">Tanggal Lahir</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Calendar size={18} /></div>
                  <input type="date" required value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={saving} className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-6 py-2 rounded-[--radius-sm] font-bold transition-all disabled:opacity-70 flex items-center gap-2 shadow-md hover:shadow-lg">
                  {saving && <Loader2 size={16} className="animate-spin" />} Simpan Perubahan
                </button>
              </div>
            </form>
          </div>

          <div className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200">
            <h3 className="text-lg font-bold text-on-light-primary mb-4 border-b border-neutral-100 pb-4">Ubah Password</h3>
            
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 flex items-center gap-2 text-sm">
                <CheckCircle size={16} /> {passwordSuccess}
              </div>
            )}
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-light-secondary mb-1">Password Saat Ini</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Lock size={18} /></div>
                  <input type="password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-light-secondary mb-1">Password Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Lock size={18} /></div>
                    <input type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-light-secondary mb-1">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Lock size={18} /></div>
                    <input type="password" required value={passwordData.confirmNewPassword} onChange={(e) => setPasswordData({...passwordData, confirmNewPassword: e.target.value})} className="pl-10 w-full px-4 py-2 border border-neutral-200 rounded-[--radius-sm] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-800" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-light-secondary">Password harus terdiri dari minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.</p>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={passwordSaving} className="bg-gradient-gold-cta hover:bg-accent-gold-hover text-on-gold px-6 py-2 rounded-[--radius-sm] font-bold transition-all disabled:opacity-70 flex items-center gap-2 shadow-md hover:shadow-lg">
                  {passwordSaving && <Loader2 size={16} className="animate-spin" />} Ubah Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
