'use client'

import { useState } from 'react'
import { startAttempt } from '@/app/(student)/actions'
import { Trophy, Clock, BookMarked, Play, Loader2 } from 'lucide-react'

interface StartTryoutProps {
  exerciseId: string
  exerciseType: string
  title: string
  timeLimit: number
  questionCount: number
  path: string
}

export default function StartTryout({ exerciseId, exerciseType, title, timeLimit, questionCount, path }: StartTryoutProps) {
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    const confirm = window.confirm(
      exerciseType === 'tryout' 
        ? 'PERHATIAN: Waktu akan mulai berjalan saat Anda menekan OK. Tryout ini hanya dapat dikerjakan SATU KALI. Pastikan koneksi internet stabil. Lanjutkan?'
        : 'Mulai kerjakan latihan sekarang?'
    )
    
    if (!confirm) return
    
    setLoading(true)
    try {
      await startAttempt(exerciseId, exerciseType, path)
    } catch (error) {
      console.error(error)
      alert('Gagal memulai pengerjaan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-card rounded-[--radius-xl] shadow-elevated overflow-hidden border border-neutral-100">
        <div className="p-8 text-center text-white bg-primary-900">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-white/80">Siap untuk memulai? Waktu akan dihitung mundur.</p>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center">
              <BookMarked size={24} className="mx-auto text-accent-gold mb-2" />
              <div className="text-sm text-neutral-500 font-bold uppercase tracking-wider mb-1">Jumlah Soal</div>
              <div className="text-2xl font-black text-primary-900">{questionCount}</div>
            </div>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center">
              <Clock size={24} className="mx-auto text-accent-gold mb-2" />
              <div className="text-sm text-neutral-500 font-bold uppercase tracking-wider mb-1">Durasi Waktu</div>
              <div className="text-2xl font-black text-primary-900">{timeLimit} Menit</div>
            </div>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-8 text-sm text-neutral-800 shadow-sm">
            <strong className="text-primary-900">Catatan Penting:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {exerciseType === 'tryout' && (
                <li>Tryout ini menggunakan <strong>Mode Fokus</strong>. Jika Anda keluar layar penuh atau pindah tab, sistem akan memberikan peringatan.</li>
              )}
              <li>Waktu akan terus berjalan meskipun Anda menutup halaman atau mengalami putus koneksi.</li>
              <li>Jawaban akan tersimpan otomatis setiap Anda berpindah soal.</li>
            </ul>
          </div>
          
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 rounded-[--radius-md] font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md text-on-gold bg-gradient-gold-cta hover:bg-accent-gold-hover"
          >
            {loading ? (
              <><Loader2 size={24} className="animate-spin" /> Menyiapkan Soal...</>
            ) : (
              <><Play size={24} /> Mulai Sekarang</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
