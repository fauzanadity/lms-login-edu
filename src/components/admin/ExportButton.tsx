'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  exerciseId?: string
  programId?: string
}

export default function ExportButton({ exerciseId, programId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (exerciseId) query.append('exercise_id', exerciseId)
      if (programId) query.append('program_id', programId)

      const res = await fetch(`/api/admin/exports/attempts?${query.toString()}`)
      if (!res.ok) throw new Error('Gagal mengambil data')

      const { data } = await res.json()
      
      if (!data || data.length === 0) {
        alert('Tidak ada data untuk diekspor.')
        return
      }

      // Format data for Excel
      const excelData = data.map((attempt: any) => ({
        'Nama Siswa': attempt.students?.full_name,
        'Email': attempt.students?.email,
        'Universitas': attempt.students?.university,
        'Program': attempt.students?.programs?.name,
        'Judul Soal': attempt.exercises?.title,
        'Tipe': attempt.exercise_type,
        'Skor Akhir': attempt.score,
        'Status': attempt.is_graded ? 'Selesai' : 'Belum Selesai',
        'Waktu Mulai': new Date(attempt.started_at).toLocaleString('id-ID'),
        'Waktu Kumpul': attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString('id-ID') : '-'
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Penilaian')

      // Generate filename
      const date = new Date().toISOString().split('T')[0]
      const filename = `Hasil_Penilaian_${date}.xlsx`

      XLSX.writeFile(workbook, filename)
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat mengekspor data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="bg-success/10 hover:bg-success/20 text-success-700 px-4 py-2 rounded-[--radius-sm] font-semibold flex items-center gap-2 transition-colors border border-success/20 disabled:opacity-70"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
      Ekspor .xlsx
    </button>
  )
}
