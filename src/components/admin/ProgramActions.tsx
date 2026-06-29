'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'

interface PreviewData {
  materialsCount: number
  exercisesCount: number
  broadcastsCount: number
  studentsCount: number
}

interface ProgramActionsProps {
  programId: string
  programName: string
  isArchive: boolean
}

export default function ProgramActions({ programId, programName, isArchive }: ProgramActionsProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  const handleDeleteClick = async () => {
    setShowModal(true)
    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/admin/programs/${programId}/delete-preview`)
      if (res.ok) {
        const data = await res.json()
        setPreview(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleConfirmDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setShowModal(false)
        router.refresh()
      } else {
        alert('Gagal menghapus program.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestore = async () => {
    const confirmRestore = window.confirm(`Apakah Anda yakin ingin memulihkan program "${programName}"?`)
    if (!confirmRestore) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/programs/${programId}/restore`, {
        method: 'POST'
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal memulihkan program.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi.')
    } finally {
      setActionLoading(false)
    }
  }

  if (isArchive) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleRestore}
          disabled={actionLoading}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors flex items-center gap-1 font-semibold text-xs border border-green-200"
          title="Pulihkan Program"
        >
          {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Pulihkan
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Link 
          href={`/geheime-verwaltung/programs/${programId}`}
          className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded transition-colors"
          title="Edit"
        >
          <Edit size={18} />
        </Link>
        <button
          onClick={handleDeleteClick}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          title="Hapus"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[--radius-lg] max-w-md w-full p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={28} className="flex-shrink-0" />
              <h3 className="text-lg font-bold">Konfirmasi Hapus Program</h3>
            </div>

            <p className="text-neutral-600 text-sm mb-4">
              Apakah Anda yakin ingin menghapus program <strong>"{programName}"</strong>? Tindakan ini adalah soft-delete (data dipindahkan ke arsip).
            </p>

            {loadingPreview ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg mb-4 border border-neutral-100">
                <Loader2 size={16} className="animate-spin text-primary-500" />
                <span>Menghitung dampak cascade...</span>
              </div>
            ) : (
              preview && (
                <div className="bg-red-50/50 border border-red-200 text-red-950 text-xs rounded-lg p-3 mb-4 space-y-2">
                  <strong className="font-bold text-red-800">Peringatan Dampak Cascade:</strong>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Menyembunyikan <strong>{preview.materialsCount} materi</strong> yang hanya terhubung ke program ini.</li>
                    <li>Menyembunyikan <strong>{preview.exercisesCount} latihan/tryout</strong> yang hanya terhubung ke program ini.</li>
                    <li>Menyembunyikan <strong>{preview.broadcastsCount} pengumuman</strong> yang hanya terhubung ke program ini.</li>
                    <li>Siswa terdaftar: <strong>{preview.studentsCount} orang</strong> tidak akan bisa login/akses sistem sampai mereka dipindahkan ke program aktif lain.</li>
                  </ul>
                </div>
              )
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded hover:bg-neutral-50 transition-colors text-sm font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loadingPreview || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />} Ya, Hapus Program
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
