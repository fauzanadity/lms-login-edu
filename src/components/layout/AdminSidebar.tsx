'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FolderKey, 
  BookOpen, 
  PenTool, 
  Trophy, 
  Megaphone,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  UserCog
} from 'lucide-react'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/geheime-verwaltung/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { name: 'Dashboard', href: '/geheime-verwaltung/dashboard', icon: LayoutDashboard },
    { name: 'Program', href: '/geheime-verwaltung/programs', icon: FolderKey },
    { name: 'Siswa', href: '/geheime-verwaltung/students', icon: Users },
    { name: 'Materi', href: '/geheime-verwaltung/materials', icon: BookOpen },
    { name: 'Latihan & Tryout', href: '/geheime-verwaltung/exercises', icon: PenTool },
    { name: 'Penilaian', href: '/geheime-verwaltung/grading', icon: ClipboardCheck },
    { name: 'Pengumuman', href: '/geheime-verwaltung/broadcasts', icon: Megaphone },
  ]

  const SidebarContent = () => (
    <>
      <div className={`h-16 flex items-center justify-between px-4 border-b border-primary-800 ${isCollapsed ? 'justify-center' : ''}`}>
        {!isCollapsed && (
          <Link href="/geheime-verwaltung/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center overflow-hidden border border-primary-700 shadow-sm">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-white font-black text-lg tracking-tight leading-none">Login Edu</span>
            <span className="text-white font-bold text-xs bg-accent-600 px-2 py-0.5 rounded-md">ADMIN</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-accent-600 rounded-md flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[--radius-sm] transition-colors group relative ${
                isActive 
                  ? 'bg-primary-800 text-white' 
                  : 'text-primary-200 hover:bg-primary-800/50 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon size={20} className={isActive ? 'text-accent-400' : 'text-primary-300 group-hover:text-white'} />
              {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-primary-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-primary-800 space-y-2">
        <Link
          href="/geheime-verwaltung/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[--radius-sm] text-primary-200 hover:bg-primary-800 hover:text-white transition-colors w-full group relative ${isCollapsed ? 'justify-center' : ''}`}
        >
          <UserCog size={20} className="text-primary-300 group-hover:text-white" />
          {!isCollapsed && <span className="font-medium text-sm">Profil Admin</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-primary-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Profil Admin
            </div>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[--radius-sm] text-danger hover:bg-red-900/30 transition-colors w-full group relative ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Keluar</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-primary-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              Keluar
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      <div className="hidden md:flex justify-end p-2">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-primary-300 hover:text-white hover:bg-primary-800 rounded-md transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-gradient-linear-nav h-16 px-4 sticky top-0 z-40 border-b border-primary-800 shadow-sm">
        <Link href="/geheime-verwaltung/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center overflow-hidden border border-primary-700 shadow-sm">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="w-full h-full object-cover" 
            />
          </div>
          <span className="text-white font-black text-lg tracking-tight leading-none">Login Edu</span>
          <span className="text-white font-bold text-xs bg-accent-600 px-1.5 py-0.5 rounded">ADMIN</span>
        </Link>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="text-white p-2"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 bg-gradient-linear-nav flex flex-col shadow-xl">
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 text-primary-200 hover:text-white p-1"
            >
              <X size={24} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-gradient-linear-nav border-r border-primary-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent />
      </aside>
    </>
  )
}
