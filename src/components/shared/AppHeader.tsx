'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, Menu, X, ShoppingCart, LayoutDashboard, Package, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConnectivityIndicator } from './ConnectivityIndicator'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [userData, setUserData] = useState<{ name: string; role: string }>({ name: 'User', role: 'Kasir' })
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch from profile table for real name
        const { data: profile } = await supabase
          .from('users')
          .select('nama_lengkap, role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserData({ 
            name: profile.nama_lengkap, 
            role: profile.role 
          })
        } else {
          // Fallback to metadata or email
          setUserData({ 
            name: user.user_metadata?.nama_lengkap || user.email?.split('@')[0] || 'User', 
            role: user.app_metadata?.role || 'Kasir' 
          })
        }
      }
    }
    getUserData()
  }, [supabase])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      toast.success('Berhasil keluar')
      router.push('/login')
      router.refresh()
    } else {
      toast.error('Gagal keluar')
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Kasir', href: '/kasir', icon: ShoppingCart },
    { label: 'Obat', href: '/obat', icon: Package, roles: ['pemilik', 'apoteker'] },
    { label: 'Laporan', href: '/laporan', icon: FileText, roles: ['pemilik', 'apoteker'] },
    { label: 'Pengaturan', href: '/settings', icon: Settings, roles: ['pemilik'] },
    { label: 'Manajemen User', href: '/admin', icon: User, roles: ['pemilik'] },
  ]

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(userData.role))

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition">
                <ShoppingCart className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-800 leading-none group-hover:text-blue-600 transition">Apotek Ulebi</h1>
                <p className="text-[10px] text-gray-400 font-medium">Sistem POS Premium</p>
              </div>
            </Link>
            
            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block" />
            
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">{title}</h2>
              {pathname !== '/' && (
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-blue-600 font-bold gap-1 px-2 hover:bg-blue-50">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Panel Utama</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectivityIndicator />
          
          <div className="hidden md:flex items-center gap-3 pl-4 border-l">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-800 leading-none">{userData.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{userData.role.replace('_', ' ')}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-red-50 hover:text-red-600 transition"
              onClick={handleLogout}
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden rounded-full hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden p-6`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bold text-xl uppercase tracking-widest text-blue-600">Apotek Ulebi</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="space-y-2">
          {filteredNav.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 p-3 rounded-xl font-bold transition ${
                pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-6 right-6 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600 w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 truncate text-sm">{userData.name}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{userData.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 font-bold hover:bg-red-50 p-2 rounded-lg gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </Button>
        </div>
      </div>
    </header>
  )
}
