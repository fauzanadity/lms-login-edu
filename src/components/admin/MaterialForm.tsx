'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Material, Program } from '@/types/database'
import { Save, Loader2, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface MaterialFormProps {
  initialData?: Material & { programs?: Pick<Program, 'id'>[] } | null
  programs: Pick<Program, 'id' | 'name'>[]
  isEditing?: boolean
}

export default function MaterialForm({ initialData, programs, isEditing = false }: MaterialFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const initialProgramIds = initialData?.programs?.map(p => p.id) || []
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    drive_url: initialData?.drive_url || '',
    program_ids: initialProgramIds
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProgramToggle = (programId: string) => {
    setFormData(prev => {
      const isSelected = prev.program_ids.includes(programId)
      if (isSelected) {
        return { ...prev, program_ids: prev.program_ids.filter(id => id !== programId) }
      } else {
        return { ...prev, program_ids: [...prev.program_ids, programId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.program_ids.length === 0) {
      setError('Pilih minimal 1 program untuk materi ini.')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const url = isEditing && initialData 
        ? `/api/admin/materials/${initialData.id}` 
        : '/api/admin/materials'
        
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/geheime-verwaltung/materials')
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Informasi Materi</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Judul Materi *</label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Modul TPS Penalaran Umum"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sub-judul / Deskripsi Singkat</label>
              <input 
                type="text" 
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Penjelasan singkat materi"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">URL Google Drive *</label>
              <input 
                type="url" 
                name="drive_url"
                required
                value={formData.drive_url}
                onChange={handleChange}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Akses Program *</h3>
            <p className="text-sm text-neutral-500 mb-2">Pilih program mana saja yang bisa mengakses materi ini.</p>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-[--radius-sm] p-4 max-h-[300px] overflow-y-auto space-y-2">
              {programs.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4">Belum ada program tersedia.</p>
              ) : (
                programs.map(p => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={formData.program_ids.includes(p.id)}
                      onChange={() => handleProgramToggle(p.id)}
                      className="w-4 h-4 text-accent-600 rounded focus:ring-accent-500 border-neutral-300"
                    />
                    <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                  </label>
                ))
              )}
            </div>
            {formData.program_ids.length === 0 && (
              <p className="text-xs text-danger">Minimal pilih 1 program.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
          <Link 
            href="/geheime-verwaltung/materials"
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
            Simpan Materi
          </button>
        </div>
      </form>
    </div>
  )
}
