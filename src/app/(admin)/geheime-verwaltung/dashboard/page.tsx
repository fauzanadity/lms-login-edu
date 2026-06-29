import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Users, FolderKey, BookOpen, PenTool, TrendingUp, ShieldCheck, Trophy } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch summary stats in parallel
  const [
    { count: studentsCount },
    { count: programsCount },
    { count: materialsCount },
    { count: exercisesCount },
    { data: recentAttempts }
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('programs').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('materials').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('exercises').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('attempts')
      .select(`
        id, 
        score, 
        submitted_at,
        exercise_type,
        students (full_name),
        exercises (title)
      `)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(5)
  ])

  const stats = [
    { title: 'Total Siswa Aktif', value: studentsCount || 0, icon: Users, color: 'bg-blue-100 text-blue-600', link: '/geheime-verwaltung/students' },
    { title: 'Program Aktif', value: programsCount || 0, icon: FolderKey, color: 'bg-indigo-100 text-indigo-600', link: '/geheime-verwaltung/programs' },
    { title: 'Total Materi', value: materialsCount || 0, icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', link: '/geheime-verwaltung/materials' },
    { title: 'Latihan & Tryout', value: exercisesCount || 0, icon: PenTool, color: 'bg-orange-100 text-orange-600', link: '/geheime-verwaltung/exercises' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-dark-primary flex items-center gap-2">
            <LayoutDashboardIcon /> Dashboard Admin
          </h1>
          <p className="text-on-dark-secondary">Ringkasan aktivitas platform Login Edu</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.link} className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200 card-hover flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-on-light-secondary mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-on-light-primary">{stat.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <h2 className="text-lg font-bold text-on-light-primary flex items-center gap-2">
              <TrendingUp className="text-accent-gold-hover" /> Pengerjaan Terbaru
            </h2>
            <Link href="/geheime-verwaltung/grading" className="text-sm font-bold text-on-light-primary hover:text-primary-600">
              Lihat Semua
            </Link>
          </div>
          
          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-[--radius-md] border border-neutral-100 hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${attempt.exercise_type === 'tryout' ? 'bg-warning/10 text-warning' : 'bg-primary-900/10 text-primary-900'}`}>
                      {attempt.exercise_type === 'tryout' ? <Trophy size={20} /> : <PenTool size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-on-light-primary line-clamp-1">{(attempt.students as any)?.full_name}</p>
                      <p className="text-sm text-on-light-secondary line-clamp-1">Mengerjakan: {(attempt.exercises as any)?.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg text-green-600">{attempt.score ?? '-'}</div>
                    <div className="text-xs text-neutral-400">{formatDate(attempt.submitted_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-on-light-secondary">
              Belum ada data pengerjaan terbaru.
            </div>
          )}
        </div>

        {/* Quick Actions / System Info */}
        <div className="space-y-6">
          <div className="bg-gradient-linear-nav rounded-[--radius-lg] p-6 shadow-elevated text-white border border-primary-800">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 pb-3 border-b border-primary-800">
              <ShieldCheck className="text-accent-gold" /> Status Sistem
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-on-dark-secondary text-sm">Database (Supabase)</span>
                <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-dark-secondary text-sm">Turnstile Security</span>
                <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Active
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-[--radius-lg] p-6 shadow-sm border border-neutral-200">
            <h2 className="text-lg font-bold text-on-light-primary mb-4">Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/geheime-verwaltung/programs/new" className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 p-3 rounded-md text-center text-sm font-semibold text-on-light-primary hover:text-primary-600 transition-colors">
                + Program Baru
              </Link>
              <Link href="/geheime-verwaltung/students/new" className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 p-3 rounded-md text-center text-sm font-semibold text-on-light-primary hover:text-primary-600 transition-colors">
                + Siswa Baru
              </Link>
              <Link href="/geheime-verwaltung/exercises/new" className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 p-3 rounded-md text-center text-sm font-semibold text-on-light-primary hover:text-primary-600 transition-colors">
                + Buat Latihan
              </Link>
              <Link href="/geheime-verwaltung/broadcasts/new" className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 p-3 rounded-md text-center text-sm font-semibold text-on-light-primary hover:text-primary-600 transition-colors">
                + Pengumuman
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LayoutDashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard text-accent-600"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
  )
}
