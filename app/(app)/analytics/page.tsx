'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Filter, Search, TrendingUp, TrendingDown, DollarSign, Banknote } from 'lucide-react'
import { formatCurrency, todayARG } from '@/lib/utils'

interface DashboardData {
  totalVentas: number; totalEgresos: number; totalCosto: number; ganancia: number
  totalVentasProductos: number; totalVentasReparaciones: number
  distribucionVentas: { tipo: string; total: number }[]
  egresosPorCategoria: { nombre: string; total: number }[]
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

function TooltipCurrency({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-zinc-300 mb-1">{label}</p>
        <p className="text-blue-400 font-semibold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const today = todayARG()
  const [fechaDesde, setFechaDesde] = useState(today)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
      const d = await res.json()
      setData(d)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { cargar() }, [cargar])

  const barData = data?.distribucionVentas.map((d) => ({ name: d.tipo, total: d.total })) ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Análisis financiero del período</p>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <Filter size={16} className="text-zinc-500 self-center" />
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>
        <button onClick={cargar} className="btn-primary flex items-center gap-2">
          <Search size={16} /> Analizar
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-28 animate-pulse bg-zinc-800" />)}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Ventas" value={data.totalVentas} icon={<DollarSign size={20} />} color="blue"
            sub={`Productos: ${formatCurrency(data.totalVentasProductos)} | Servicios: ${formatCurrency(data.totalVentasReparaciones)}`} />
          <KPI label="Total Egresos" value={data.totalEgresos} icon={<TrendingDown size={20} />} color="rose" />
          <KPI label="Costo de Productos" value={data.totalCosto} icon={<Banknote size={20} />} color="amber" />
          <KPI label="Ganancia Neta" value={data.ganancia} icon={<TrendingUp size={20} />}
            color={data.ganancia >= 0 ? 'emerald' : 'red'} sub="Ventas - Egresos - Costos" />
        </div>
      )}

      {/* Gráficos */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Distribución de ventas */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-4">Distribución de Ventas</h3>
            {barData.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Sin datos en este período</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<TooltipCurrency />} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Egresos por categoría */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-4">Egresos por Categoría</h3>
            {data.egresosPorCategoria.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Sin egresos en este período</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.egresosPorCategoria}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {data.egresosPorCategoria.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full mt-3 space-y-1">
                  {data.egresosPorCategoria.map((cat, i) => (
                    <div key={cat.nombre} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-zinc-400">{cat.nombre}</span>
                      </div>
                      <span className="font-medium text-zinc-200">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, icon, color, sub }: { label: string; value: number; icon: React.ReactNode; color: string; sub?: string }) {
  const map: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/30',
    rose: 'text-rose-400 bg-rose-900/30',
    amber: 'text-amber-400 bg-amber-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
    red: 'text-red-400 bg-red-900/30',
  }
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <div className={`p-1.5 rounded-lg ${map[color] ?? map.blue}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{formatCurrency(value)}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}
