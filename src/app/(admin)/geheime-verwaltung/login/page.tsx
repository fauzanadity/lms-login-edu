import { Metadata } from 'next'
import AdminLoginForm from '@/components/auth/AdminLoginForm'

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="page-enter">
        <AdminLoginForm errorParam={error} />
      </div>
    </div>
  )
}
