'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  PenTool, 
  Trophy, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react'

export default function StudentNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Beranda', href: '/dashboard', icon: Home },
    { name: 'Materi', href: '/materials', icon: BookOpen },
    { name: 'Latihan', href: '/exercises', icon: PenTool },
    { name: 'Tryout', href: '/tryouts', icon: Trophy },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-gradient-linear-nav shadow-md sticky top-0 z-40 border-b border-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center overflow-hidden border-2 border-accent-100 shadow-sm">
                <Image 
                  src="/logo.png" 
                  alt="Login Edu" 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="font-black text-xl text-gold-outline tracking-tight leading-none">Login Edu</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[--radius-sm] text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary-800 text-on-dark-primary border border-primary-700 shadow-sm' 
                        : 'text-on-dark-secondary hover:bg-primary-800/50 hover:text-on-dark-primary'
                    }`}
                  >
                    <Icon size={18} />
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop Right Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/notifications" 
              className="p-2 text-on-dark-secondary hover:text-on-dark-primary hover:bg-primary-800/50 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              {/* Notification badge dot placeholder */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full badge-pulse"></span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-primary-800/50 transition-colors border border-primary-700"
              >
                <div className="w-8 h-8 rounded-full bg-white text-primary-900 flex items-center justify-center font-black text-sm shadow-sm">
                  S
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-[--radius-md] shadow-elevated border border-neutral-200 py-1 z-50">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <User size={16} /> Profil Saya
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 text-left"
                  >
                    <LogOut size={16} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
            <Link 
              href="/notifications" 
              className="p-2 text-on-dark-secondary hover:text-on-dark-primary transition-colors relative"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-on-dark-secondary hover:text-on-dark-primary hover:bg-primary-800/50 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-primary-800 bg-gradient-linear-nav">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-800 text-on-dark-primary border border-primary-700 shadow-sm' 
                      : 'text-on-dark-secondary hover:bg-primary-800/50 hover:text-on-dark-primary'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              )
            })}
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-on-dark-secondary hover:bg-primary-800/50 hover:text-on-dark-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={20} /> Profil Saya
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-danger hover:bg-primary-800/50 transition-colors text-left"
            >
              <LogOut size={20} /> Keluar
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
