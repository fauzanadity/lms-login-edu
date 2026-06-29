'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit, Trash2, RotateCcw, Loader2 } from 'lucide-react'

interface ItemActionsProps {
  id: string
  name: string
  type: 'materials' | 'exercises' | 'broadcasts'
  isArchive: boolean
  editUrl?: string
  deleteConfirmText: string
  restoreConfirmText: string
}

export default function ItemActions({
  id,
  name,
  type,
  isArchive,
  editUrl,
  deleteConfirmText,
  restoreConfirmText
}: ItemActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmDelete = window.confirm(deleteConfirmText)
    if (!confirmDelete) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal menghapus item.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    const confirmRestore = window.confirm(restoreConfirmText)
    if (!confirmRestore) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/${type}/${id}/restore`, {
        method: 'POST'
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal memulihkan item.')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  if (isArchive) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleRestore}
          disabled={loading}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors flex items-center gap-1 font-semibold text-xs border border-green-200"
          title="Pulihkan"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Pulihkan
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {editUrl && (
        <Link 
          href={editUrl}
          className="p-2 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded transition-colors"
          title="Edit"
        >
          <Edit size={18} />
        </Link>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        title="Hapus"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
      </button>
    </div>
  )
}
