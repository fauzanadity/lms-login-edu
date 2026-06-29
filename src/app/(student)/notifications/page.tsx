import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Bell, Megaphone } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Notifikasi',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get student's program
  const { data: student } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', user.id)
    .single()

  if (!student) return null

  // Get broadcasts for the program
  const { data: broadcastsData } = await supabase
    .from('broadcast_programs')
    .select(`
      broadcasts (
        id,
        title,
        message,
        created_at
      )
    `)
    .eq('program_id', student.program_id)
    .order('broadcast_id', { ascending: false })

  const broadcasts = broadcastsData?.map(bp => bp.broadcasts as any).filter(Boolean) || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-800 text-accent-gold rounded-lg border border-primary-700">
          <Bell size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary">Pengumuman</h1>
          <p className="text-on-dark-secondary text-sm">Informasi penting dari admin Login Edu</p>
        </div>
      </div>

      <div className="space-y-4">
        {broadcasts.length > 0 ? (
          broadcasts.map(broadcast => {
            if (!broadcast) return null
            return (
              <div key={broadcast.id} className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -right-4 -top-4 text-neutral-100 opacity-30 transform rotate-12">
                  <Megaphone size={120} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-light-primary bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full w-fit mb-4">
                    <Megaphone size={14} /> PENGUMUMAN
                  </div>
                  
                  <h3 className="text-xl font-bold text-on-light-primary mb-2">{broadcast.title}</h3>
                  
                  <div className="text-on-light-secondary whitespace-pre-wrap leading-relaxed">
                    {broadcast.message}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-neutral-100 text-sm text-neutral-500">
                    Dikirim pada: {formatDate(broadcast.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-card rounded-[--radius-lg] p-12 text-center border border-neutral-200 shadow-sm">
            <Bell size={48} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-bold text-on-light-primary mb-2">Belum ada pengumuman</h3>
            <p className="text-on-light-secondary">Anda akan melihat pengumuman dari admin di sini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
