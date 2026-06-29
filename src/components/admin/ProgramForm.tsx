'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Program } from '@/types/database'
import { Save, Loader2, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ProgramFormProps {
  initialData?: Program | null
  isEditing?: boolean
}

export default function ProgramForm({ initialData, isEditing = false }: ProgramFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    token: initialData?.token || '',
    token_valid_from: initialData?.token_valid_from ? new Date(initialData.token_valid_from).toISOString().slice(0, 16) : '',
    token_valid_until: initialData?.token_valid_until ? new Date(initialData.token_valid_until).toISOString().slice(0, 16) : '',
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    description: initialData?.description || '',
    drive_access_notice: initialData?.drive_access_notice || '',
    drive_access_form_url: initialData?.drive_access_form_url || '',
    is_active: initialData?.is_active ?? true
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let token = ''
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, token }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing && initialData 
        ? `/api/admin/programs/${initialData.id}` 
        : '/api/admin/programs'
        
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          token_valid_from: new Date(formData.token_valid_from).toISOString(),
          token_valid_until: new Date(formData.token_valid_until).toISOString(),
        })
      })

      if (res.ok) {
        router.push('/geheime-verwaltung/programs')
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
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Informasi Dasar</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nama Program (Internal) *</label>
              <input 
                type="text" 
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: UTBK Super Camp 2024"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Kode Akses / Token *</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="token"
                  required
                  value={formData.token}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-[--radius-sm] font-mono uppercase focus:ring-2 focus:ring-accent-400 outline-none"
                />
                <button 
                  type="button"
                  onClick={generateToken}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-[--radius-sm] hover:bg-neutral-200 font-medium text-sm transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Berlaku Mulai *</label>
                <input 
                  type="datetime-local" 
                  name="token_valid_from"
                  required
                  value={formData.token_valid_from}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Berlaku Sampai *</label>
                <input 
                  type="datetime-local" 
                  name="token_valid_until"
                  required
                  value={formData.token_valid_until}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-accent-600 rounded focus:ring-accent-500 border-neutral-300"
                />
                <span className="text-sm font-bold text-primary-900">Program Aktif (Dapat diakses siswa)</span>
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Tampilan Dashboard Siswa</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Judul Tampilan Utama</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Judul banner dashboard"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sub-judul / Pesan Slogan</label>
              <input 
                type="text" 
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Pesan motivasi atau penjelasan singkat"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Informasi Google Drive (Jika ada)</label>
              <textarea 
                name="drive_access_notice"
                value={formData.drive_access_notice}
                onChange={handleChange}
                rows={2}
                placeholder="Pemberitahuan terkait akses materi Google Drive"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Link Request Akses Google Drive</label>
              <input 
                type="url" 
                name="drive_access_form_url"
                value={formData.drive_access_form_url}
                onChange={handleChange}
                placeholder="https://forms.gle/..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
          <Link 
            href="/geheime-verwaltung/programs"
            className="px-6 py-2 border border-neutral-300 text-neutral-700 font-semibold rounded-[--radius-sm] hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <X size={18} /> Batal
          </Link>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-accent-600 text-white font-semibold rounded-[--radius-sm] hover:bg-accent-500 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Program
          </button>
        </div>
      </form>
    </div>
  )
}
