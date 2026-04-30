'use client'

import { useEffect, useState, useCallback } from 'react'
import { Filter, Search, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency, todayARG } from '@/lib/utils'

interface ProductoVendido {
  nombre: string; cantidadVendida: number; totalVenta: number; porcentaje: number
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#a78bfa', '#34d399']

export default function MasVendidosPage() {
  const today = todayARG()
  const firstDayOfMonth = today.slice(0, 8) + '01'
  const [fechaDesde, setFechaDesde] = useState(firstDayOfMonth)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [modo, setModo] = useState<'rango' | 'historico'>('rango')
  const [productos, setProductos] = useState<ProductoVendido[]>([])
  const [totalGeneral, setTotalGeneral] = useState(0)
  const [loading, setLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = modo === 'rango'
      ? `?modo=rango&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
      : '?modo=historico'
    try {
      const res = await fetch(`/api/mas-vendidos${params}`)
      const d = await res.json()
      setProductos(d.productos)
      setTotalGeneral(d.totalGeneral)
    } catch { /* empty */ }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta, modo])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Productos Más Vendidos</h1>
        <p className="text-zinc-500 text-sm">Top 10 productos por facturación</p>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <Filter size={16} className="text-zinc-500 self-center" />
        <div>
          <label className="label">Modo</label>
          <select className="select" value={modo} onChange={(e) => setModo(e.target.value as 'rango' | 'historico')}>
            <option value="rango">Por rango de fechas</option>
            <option value="historico">Histórico total</option>
          </select>
        </div>
        {modo === 'rango' && (
          <>
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" className="input" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </>
        )}
        <button onClick={cargar} className="btn-primary flex items-center gap-2">
          <Search size={16} /> Consultar
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-zinc-500">Cargando...</div>
      ) : productos.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          <Star size={32} className="mx-auto mb-2 opacity-30" />
          <p>Sin datos para mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Gráfico */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-4">Facturación por producto</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productos} layout="vertical">
                <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nombre" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={130}
                  axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#18181b', border: '1px solid #27272a', color: '#fafafa' }} />
                <Bar dataKey="totalVenta" radius={[0, 6, 6, 0]}>
                  {productos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100">Ranking</h3>
              <p className="text-xs text-zinc-500">Total: <span className="text-zinc-300 font-medium">{formatCurrency(totalGeneral)}</span></p>
            </div>
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/50">
                <tr>
                  {['#', 'Producto', 'Unid.', 'Facturado', '%'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {productos.map((p, i) => (
                  <tr key={p.nombre} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="table-cell">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: COLORS[i % COLORS.length] + '33', color: COLORS[i % COLORS.length] }}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="table-cell font-medium text-sm">{p.nombre}</td>
                    <td className="table-cell">{p.cantidadVendida.toFixed(2).replace(/\.?0+$/, '')}</td>
                    <td className="table-cell font-semibold text-emerald-400">{formatCurrency(p.totalVenta)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-800 rounded-full h-1.5 max-w-16">
                          <div className="h-1.5 rounded-full" style={{ width: `${p.porcentaje}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="text-xs text-zinc-500">{p.porcentaje.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
