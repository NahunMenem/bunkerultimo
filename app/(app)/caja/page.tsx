'use client'

import { useEffect, useState, useCallback } from 'react'
import { Filter, Search, Wallet, TrendingDown, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, todayARG } from '@/lib/utils'

interface CajaData {
  netoPorPago: Record<string, number>
  ventasPorPago: Record<string, number>
  reparacionesPorPago: Record<string, number>
  egresosPorPago: Record<string, number>
  totalIngresos: number
  totalEgresos: number
  totalNeto: number
}

export default function CajaPage() {
  const today = todayARG()
  const [fechaDesde, setFechaDesde] = useState(today)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [data, setData] = useState<CajaData | null>(null)
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/caja?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
      const d = await res.json()
      setData(d)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { cargar() }, [cargar])

  const chartData = data
    ? Object.entries(data.netoPorPago).map(([tipo, neto]) => ({
        name: tipo,
        Ingresos: (data.ventasPorPago[tipo] || 0) + (data.reparacionesPorPago[tipo] || 0),
        Egresos: data.egresosPorPago[tipo] || 0,
        Neto: neto,
      }))
    : []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Caja</h1>
        <p className="text-zinc-500 text-sm">Resumen de ingresos y egresos por tipo de pago</p>
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
          <Search size={16} /> Calcular
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-zinc-800" />)}
        </div>
      ) : data && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Total Ingresos</span>
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.totalIngresos)}</p>
              <p className="text-xs text-zinc-600 mt-1">Ventas + Servicios</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Total Egresos</span>
                <TrendingDown size={18} className="text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400">{formatCurrency(data.totalEgresos)}</p>
            </div>
            <div className={`card p-5 ${data.totalNeto >= 0 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-red-950/20 border-red-800/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Neto del Período</span>
                <Wallet size={18} className={data.totalNeto >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              </div>
              <p className={`text-2xl font-bold ${data.totalNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(data.totalNeto)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Ingresos - Egresos</p>
            </div>
          </div>

          {/* Por tipo de pago */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-4">Detalle por Tipo de Pago</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-zinc-800">
                  <tr>
                    {['Tipo de pago', 'Ventas', 'Servicios', 'Total ingresos', 'Egresos', 'Neto'].map((h) => (
                      <th key={h} className="table-header">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {Object.keys(data.netoPorPago).length === 0 && (
                    <tr><td colSpan={6} className="table-cell text-center text-zinc-500 py-6">Sin movimientos en este período</td></tr>
                  )}
                  {Object.entries(data.netoPorPago).map(([tipo, neto]) => {
                    const ventas = data.ventasPorPago[tipo] || 0
                    const rep = data.reparacionesPorPago[tipo] || 0
                    const eg = data.egresosPorPago[tipo] || 0
                    return (
                      <tr key={tipo} className="hover:bg-zinc-800/30">
                        <td className="table-cell font-medium"><span className="badge-blue">{tipo}</span></td>
                        <td className="table-cell text-emerald-400">{formatCurrency(ventas)}</td>
                        <td className="table-cell text-violet-400">{formatCurrency(rep)}</td>
                        <td className="table-cell font-semibold">{formatCurrency(ventas + rep)}</td>
                        <td className="table-cell text-rose-400">{formatCurrency(eg)}</td>
                        <td className={`table-cell font-bold ${neto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(neto)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-zinc-100 mb-4">Comparativa por Tipo de Pago</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#18181b', border: '1px solid #27272a', color: '#fafafa' }} />
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Neto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
