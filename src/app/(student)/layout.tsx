import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentNavbar from '@/components/layout/StudentNavbar'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check if user is a valid student (not deleted) and check program status
  const { data: student } = await supabase
    .from('students')
    .select('id, deleted_at, program_id, programs(deleted_at)')
    .eq('id', user.id)
    .single()

  if (!student || student.deleted_at) {
    await supabase.auth.signOut()
    redirect('/login?error=role-mismatch')
  }

  if ((student as any).programs?.deleted_at) {
    await supabase.auth.signOut()
    redirect('/login?error=program-deleted')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-radial-page">
      <StudentNavbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        {children}
      </main>
      
      <footer className="bg-white border-t border-neutral-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Login Edu. Hak Cipta Dilindungi.
        </div>
      </footer>
    </div>
  )
}
