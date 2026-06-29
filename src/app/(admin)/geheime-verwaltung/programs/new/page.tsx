import { Metadata } from 'next'
import ProgramForm from '@/components/admin/ProgramForm'
import { FolderKey } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Buat Program Baru',
}

export default function NewProgramPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
          <FolderKey /> Program Baru
        </h1>
        <p className="text-neutral-600">Buat program bimbingan belajar baru untuk siswa</p>
      </div>

      <ProgramForm />
    </div>
  )
}
