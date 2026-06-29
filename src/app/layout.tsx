import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Login Edu — Login Aja Dulu!',
    template: '%s | Login Edu',
  },
  description:
    'Platform bimbingan belajar online Login Edu. Login Aja Dulu! Akses materi, latihan soal, dan tryout UTBK dengan mudah.',
  keywords: ['bimbel', 'UTBK', 'belajar online', 'Login Edu', 'tryout'],
  authors: [{ name: 'Login Edu' }],
  openGraph: {
    title: 'Login Edu — Login Aja Dulu!',
    description:
      'Platform bimbingan belajar online Login Edu. Akses materi, latihan soal, dan tryout UTBK.',
    siteName: 'Login Edu',
    type: 'website',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-neutral-bg font-sans text-neutral-800">
        {children}
      </body>
    </html>
  )
}
