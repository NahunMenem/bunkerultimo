'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, Package, History, TrendingDown,
  BarChart3, Wallet, Star, AlertTriangle, XCircle, TrendingUp,
  DollarSign, ArrowUpRight,
} from 'lucide-react'
import { formatCurrency, todayARG } from '@/lib/utils'

interface DashboardData {
  totalVentas: number
  totalEgresos: number
  totalCosto: number
  ganancia: number
  totalVentasProductos: number
  totalVentasReparaciones: number
}

export default function InicioPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const today = todayARG()

  useEffect(() => {
    fetch(`/api/dashboard?fecha_desde=${today}&fecha_hasta=${today}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [today])

  const quickActions = [
    { href: '/ventas', icon: ShoppingCart, label: 'Nueva Venta', color: 'bg-blue-600 hover:bg-blue-500' },
    { href: '/stock', icon: Package, label: 'Gestionar Stock', color: 'bg-violet-600 hover:bg-violet-500' },
    { href: '/egresos', icon: TrendingDown, label: 'Registrar Egreso', color: 'bg-rose-600 hover:bg-rose-500' },
    { href: '/historial', icon: History, label: 'Ver Historial', color: 'bg-zinc-700 hover:bg-zinc-600' },
    { href: '/analytics', icon: BarChart3, label: 'Dashboard', color: 'bg-amber-600 hover:bg-amber-500' },
    { href: '/caja', icon: Wallet, label: 'Caja', color: 'bg-emerald-600 hover:bg-emerald-500' },
    { href: '/mas-vendidos', icon: Star, label: 'Más Vendidos', color: 'bg-orange-600 hover:bg-orange-500' },
    { href: '/stock-bajo', icon: AlertTriangle, label: 'Stock Bajo', color: 'bg-yellow-600 hover:bg-yellow-500' },
    { href: '/fallados', icon: XCircle, label: 'Mercadería Fallada', color: 'bg-red-800 hover:bg-red-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Bienvenido</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Resumen del día de hoy</p>
      </div>

      {/* Stats de hoy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas de hoy"
          value={loading ? null : data?.totalVentas ?? 0}
          icon={<DollarSign size={20} />}
          color="blue"
          sub={`Productos: ${formatCurrency(data?.totalVentasProductos ?? 0)}`}
        />
        <StatCard
          title="Servicios de hoy"
          value={loading ? null : data?.totalVentasReparaciones ?? 0}
          icon={<TrendingUp size={20} />}
          color="violet"
          sub="Reparaciones / Manual"
        />
        <StatCard
          title="Egresos de hoy"
          value={loading ? null : data?.totalEgresos ?? 0}
          icon={<TrendingDown size={20} />}
          color="rose"
          sub={`Costo mercadería: ${formatCurrency(data?.totalCosto ?? 0)}`}
        />
        <StatCard
          title="Ganancia neta"
          value={loading ? null : data?.ganancia ?? 0}
          icon={<ArrowUpRight size={20} />}
          color={data && data.ganancia >= 0 ? 'emerald' : 'red'}
          sub="Ventas - Egresos - Costos"
        />
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {quickActions.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`${color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-colors text-center`}
            >
              <Icon size={24} />
              <span className="text-sm font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon, color, sub,
}: {
  title: string; value: number | null; icon: React.ReactNode; color: string; sub?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/30',
    violet: 'text-violet-400 bg-violet-900/30',
    rose: 'text-rose-400 bg-rose-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
    red: 'text-red-400 bg-red-900/30',
  }
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorMap[color] ?? colorMap.blue}`}>{icon}</div>
      </div>
      {value === null ? (
        <div className="h-7 w-24 bg-zinc-800 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-zinc-100">{formatCurrency(value)}</p>
      )}
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}
