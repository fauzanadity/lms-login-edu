import { Metadata } from 'next'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Daftar Akun Baru',
}

export default function RegisterPage() {
  return <RegisterForm />
}
