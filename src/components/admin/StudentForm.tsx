'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Student, Program } from '@/types/database'
import { Save, Loader2, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StudentFormProps {
  initialData?: Student | null
  programs: Pick<Program, 'id' | 'name'>[]
  isEditing?: boolean
}

export default function StudentForm({ initialData, programs, isEditing = false }: StudentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    password: '',
    full_name: initialData?.full_name || '',
    university: initialData?.university || '',
    major: initialData?.major || '',
    birth_date: initialData?.birth_date || '',
    program_id: initialData?.program_id || (programs.length > 0 ? programs[0].id : '')
  })

  // If no program selected but there are programs available, select the first one
  useEffect(() => {
    if (!formData.program_id && programs.length > 0) {
      setFormData(prev => ({ ...prev, program_id: programs[0].id }))
    }
  }, [programs, formData.program_id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing && initialData 
        ? `/api/admin/students/${initialData.id}` 
        : '/api/admin/students'
        
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/geheime-verwaltung/students')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan saat menyimpan data.')
      }
    } catch (err) {
      setError('Koneksi terputus. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-[--radius-md] flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Gagal Menyimpan</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Informasi Akun</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
              <input 
                type="email" 
                name="email"
                required
                disabled={isEditing}
                value={formData.email}
                onChange={handleChange}
                placeholder="email@contoh.com"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none disabled:bg-neutral-100 disabled:text-neutral-500"
              />
              {isEditing && <p className="text-xs text-neutral-500 mt-1">Email tidak dapat diubah setelah akun dibuat.</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {isEditing ? 'Password Baru (Kosongkan jika tidak ingin diubah)' : 'Password *'}
              </label>
              <input 
                type="password" 
                name="password"
                required={!isEditing}
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? '***' : 'Minimal 8 karakter'}
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Program Belajar *</label>
              <select 
                name="program_id"
                required
                value={formData.program_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
              >
                {programs.length === 0 && <option value="" disabled>Belum ada program tersedia</option>}
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Data Pribadi</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nama Lengkap *</label>
              <input 
                type="text" 
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Universitas *</label>
                <input 
                  type="text" 
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Jurusan *</label>
                <input 
                  type="text" 
                  name="major"
                  required
                  value={formData.major}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tanggal Lahir *</label>
              <input 
                type="date" 
                name="birth_date"
                required
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
          <Link 
            href="/geheime-verwaltung/students"
            className="px-6 py-2 border border-neutral-300 text-neutral-700 font-semibold rounded-[--radius-sm] hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <X size={18} /> Batal
          </Link>
          <button 
            type="submit"
            disabled={loading || programs.length === 0}
            className="px-6 py-2 bg-accent-600 text-white font-semibold rounded-[--radius-sm] hover:bg-accent-500 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Data Siswa
          </button>
        </div>
      </form>
    </div>
  )
}
