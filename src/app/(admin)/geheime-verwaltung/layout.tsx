import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Bypass auth checks and sidebar wrapper for the login page
  if (pathname === '/geheime-verwaltung/login') {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/geheime-verwaltung/login')
  }

  // Verify admin access
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!admin) {
    await supabase.auth.signOut()
    redirect('/geheime-verwaltung/login?error=role-mismatch')
  }

  return (
    <div className="min-h-screen bg-gradient-radial-page flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 w-full max-w-full md:max-w-[calc(100vw-5rem)] lg:max-w-[calc(100vw-16rem)] min-h-screen overflow-x-hidden flex flex-col relative">
        <div className="flex-grow p-4 md:p-6 lg:p-8 page-enter mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  )
}
