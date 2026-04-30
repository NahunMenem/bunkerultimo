'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Home, ShoppingCart, Package, History, TrendingDown,
  BarChart3, Wallet, Star, AlertTriangle, XCircle,
  LogOut, Store, ChevronLeft, ChevronRight, User, Menu, X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/inicio', icon: Home, label: 'Inicio' },
  { href: '/ventas', icon: ShoppingCart, label: 'Registrar Venta' },
  { href: '/stock', icon: Package, label: 'Stock' },
  { href: '/historial', icon: History, label: 'Historial de Ventas' },
  { href: '/egresos', icon: TrendingDown, label: 'Egresos' },
  { href: '/analytics', icon: BarChart3, label: 'Dashboard' },
  { href: '/caja', icon: Wallet, label: 'Caja' },
  { href: '/mas-vendidos', icon: Star, label: 'Más Vendidos' },
  { href: '/stock-bajo', icon: AlertTriangle, label: 'Stock Bajo' },
  { href: '/fallados', icon: XCircle, label: 'Mercadería Fallada' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-800 flex-shrink-0">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store size={16} className="text-white" />
            </div>
            <span className="font-bold text-zinc-100 text-lg tracking-tight truncate">BUNKER</span>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto flex-shrink-0">
            <Store size={16} className="text-white" />
          </div>
        )}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        ) : (
          !collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
          )
        )}
      </div>

      {collapsed && !isMobile && (
        <button
          onClick={() => setCollapsed(false)}
          className="flex justify-center py-2 text-zinc-500 hover:text-zinc-300 transition-colors border-b border-zinc-800 flex-shrink-0"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !isMobile ? label : undefined}
              className={cn(
                'flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium whitespace-nowrap',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Usuario / Logout */}
      <div className="border-t border-zinc-800 p-2 flex-shrink-0">
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-zinc-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">
                {session?.user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-zinc-500 capitalize">
                {(session?.user as { role?: string })?.role || 'user'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed && !isMobile ? 'Cerrar sesión' : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all',
            collapsed && !isMobile && 'justify-center'
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Top bar mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Store size={14} className="text-white" />
          </div>
          <span className="font-bold text-zinc-100 text-base tracking-tight">BUNKER</span>
        </div>
      </div>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 h-full z-50 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent(true)}
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          'hidden md:flex sticky top-0 h-screen bg-zinc-900 border-r border-zinc-800 flex-col flex-shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  )
}
