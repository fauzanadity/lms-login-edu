import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, ExternalLink, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Materi Pelajaran',
}

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get student's program
  const { data: student } = await supabase
    .from('students')
    .select('program_id, programs(drive_access_notice, drive_access_form_url)')
    .eq('id', user.id)
    .single()

  if (!student) return null

  // Get materials for the program
  const { data: materialsData } = await supabase
    .from('material_programs')
    .select(`
      materials (
        id,
        title,
        subtitle,
        drive_url,
        created_at
      )
    `)
    .eq('program_id', student.program_id)
    .order('material_id', { ascending: false })

  const materials = materialsData?.map(mp => mp.materials as any).filter(Boolean) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-800 text-accent-gold rounded-lg border border-primary-700">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary">Materi Pelajaran</h1>
          <p className="text-on-dark-secondary text-sm">Akses semua materi pembelajaran untuk programmu</p>
        </div>
      </div>

      {(student.programs as any)?.drive_access_notice && (
        <div className="bg-warning/10 border border-warning/20 rounded-[--radius-md] p-4 text-warning-900 text-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <strong>Informasi Akses Google Drive:</strong>
            <p className="mt-1">{(student.programs as any).drive_access_notice}</p>
          </div>
          {(student.programs as any).drive_access_form_url && (
            <a 
              href={(student.programs as any).drive_access_form_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whitespace-nowrap px-4 py-2 bg-warning text-white rounded-[--radius-sm] font-semibold hover:bg-yellow-600 transition-colors shadow-sm"
            >
              Request Akses
            </a>
          )}
        </div>
      )}

      {materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(mat => {
            if (!mat) return null
            return (
              <div key={mat.id} className="bg-card rounded-[--radius-md] border border-neutral-200 p-5 shadow-sm card-hover flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-1 text-accent-gold-hover">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-light-primary line-clamp-2">{mat.title}</h3>
                    {mat.subtitle && (
                      <p className="text-sm text-on-light-secondary mt-1 line-clamp-2">{mat.subtitle}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs text-neutral-500 font-medium">
                    {formatDate(mat.created_at)}
                  </span>
                  <a 
                    href={mat.drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-bold text-on-light-primary hover:text-primary-600 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Buka <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-[--radius-lg] p-12 text-center border border-neutral-200 shadow-sm">
          <BookOpen size={48} className="mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-bold text-on-light-primary mb-2">Belum ada materi</h3>
          <p className="text-on-light-secondary">Materi pembelajaran belum tersedia untuk program ini.</p>
        </div>
      )}
    </div>
  )
}
