'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Exercise, Program } from '@/types/database'
import { Save, Loader2, X, AlertCircle, UploadCloud, FileJson } from 'lucide-react'
import Link from 'next/link'

interface ExerciseFormProps {
  initialData?: Exercise & { programs?: Pick<Program, 'id'>[] } | null
  programs: Pick<Program, 'id' | 'name'>[]
  isEditing?: boolean
}

export default function ExerciseForm({ initialData, programs, isEditing = false }: ExerciseFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const initialProgramIds = initialData?.programs?.map(p => p.id) || []
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    type: initialData?.type || 'exercise',
    time_limit_minutes: initialData?.time_limit_minutes || 60,
    program_ids: initialProgramIds
  })

  const [questionsJson, setQuestionsJson] = useState<string>(
    initialData?.questions_json ? JSON.stringify(initialData.questions_json, null, 2) : ''
  )
  const [fileName, setFileName] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'time_limit_minutes' ? parseInt(value) || 0 : value 
    }))
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('File harus berformat JSON.')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        // Parse once to validate it's proper JSON
        JSON.parse(content)
        setQuestionsJson(content)
        setError(null)
      } catch (err) {
        setError('Format JSON tidak valid. Pastikan struktur file JSON benar.')
        setQuestionsJson('')
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.program_ids.length === 0) {
      setError('Pilih minimal 1 program untuk akses soal ini.')
      return
    }

    if (!questionsJson) {
      setError('Data soal JSON belum diunggah atau kosong.')
      return
    }

    let parsedQuestions
    try {
      parsedQuestions = JSON.parse(questionsJson)
    } catch (err) {
      setError('Format JSON tidak valid. Periksa kembali struktur JSON Anda.')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const url = isEditing && initialData 
        ? `/api/admin/exercises/${initialData.id}` 
        : '/api/admin/exercises'
        
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          questions_json: parsedQuestions
        })
      })

      if (res.ok) {
        router.push('/geheime-verwaltung/exercises')
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
            <h4 className="font-bold">Perhatian</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Config */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2">Informasi Umum</h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Judul Latihan / Tryout *</label>
              <input 
                type="text" 
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Tryout Akbar UTBK 2024"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Sub-judul / Keterangan Tambahan</label>
              <input 
                type="text" 
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="Misal: Dikerjakan paling lambat tanggal 10"
                className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipe *</label>
                <select 
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-white"
                >
                  <option value="exercise">Latihan Mandiri</option>
                  <option value="tryout">Tryout (1x Kerjakan)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Batas Waktu (Menit) *</label>
                <input 
                  type="number" 
                  name="time_limit_minutes"
                  required
                  min="1"
                  value={formData.time_limit_minutes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none"
                />
              </div>
            </div>

            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2 mt-8">Akses Program *</h3>
            <div className="bg-neutral-50 border border-neutral-200 rounded-[--radius-sm] p-4 max-h-[200px] overflow-y-auto space-y-2">
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
          </div>

          {/* Right Column: JSON Upload */}
          <div className="space-y-4">
            <h3 className="font-bold text-primary-900 border-b border-neutral-100 pb-2 flex justify-between items-center">
              Data Soal (JSON) *
              <a href="/format-soal.json" download className="text-xs font-semibold text-accent-600 hover:underline">
                Unduh Template
              </a>
            </h3>

            <div 
              className={`border-2 border-dashed rounded-[--radius-md] p-8 text-center transition-colors cursor-pointer
                ${fileName ? 'border-success bg-success/5' : 'border-neutral-300 hover:border-accent-400 hover:bg-accent-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="application/json" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              {fileName ? (
                <div className="flex flex-col items-center gap-2 text-success">
                  <FileJson size={40} />
                  <p className="font-bold">{fileName}</p>
                  <p className="text-sm text-success/80">Berhasil diunggah. Klik untuk mengganti.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                  <UploadCloud size={40} className="text-neutral-400" />
                  <p className="font-bold text-neutral-700 mt-2">Pilih File JSON</p>
                  <p className="text-sm">Maksimal 5MB. Sesuai format template Login Edu.</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1 flex justify-between">
                <span>Atau Tempel JSON Secara Manual:</span>
              </label>
              <textarea 
                value={questionsJson}
                onChange={(e) => {
                  setQuestionsJson(e.target.value)
                  setFileName(null)
                }}
                className="w-full h-64 p-3 font-mono text-sm border border-neutral-300 rounded-[--radius-sm] focus:ring-2 focus:ring-accent-400 outline-none bg-neutral-900 text-neutral-100"
                placeholder='{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "text": "Pertanyaan...",
      "scoring": { "correct": 4, "incorrect": -1, "unanswered": 0 },
      "options": [...],
      "correct_answer": "A"
    }
  ]
}'
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-100">
          <Link 
            href="/geheime-verwaltung/exercises"
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
            Simpan Soal
          </button>
        </div>
      </form>
    </div>
  )
}
