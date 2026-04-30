'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Download, Trash2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, formatCantidad, todayARG } from '@/lib/utils'

interface Venta {
  venta_id: number; nombre_producto: string; cantidad: number
  precio_unitario: number; total: number; fecha: string; tipo_pago: string; dni_cliente: string | null
}
interface Reparacion {
  reparacion_id: number; nombre_servicio: string; cantidad: number
  precio_unitario: number; total: number; fecha: string; tipo_pago: string
}

export default function HistorialPage() {
  const today = todayARG()
  const [fechaDesde, setFechaDesde] = useState(today)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'ventas' | 'reparaciones'>('ventas')

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/historial?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
      const data = await res.json()
      setVentas(data.ventas)
      setReparaciones(data.reparaciones)
    } catch { toast.error('Error al cargar el historial') }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  async function anularVenta(id: number) {
    if (!confirm('¿Seguro que querés anular esta venta? No se restaura el stock.')) return
    const res = await fetch(`/api/ventas/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Venta anulada'); cargarDatos() }
    else toast.error('Error al anular la venta')
  }

  function exportarExcel() {
    window.location.href = `/api/historial/export?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`
  }

  const totalVentas = ventas.reduce((a, v) => a + (v.total ?? 0), 0)
  const totalRep = reparaciones.reduce((a, r) => a + (r.total ?? 0), 0)

  // Totales por tipo de pago
  const totalPorPago: Record<string, number> = {}
  ;[...ventas.map(v => ({ tipo: v.tipo_pago, total: v.total ?? 0 })),
    ...reparaciones.map(r => ({ tipo: r.tipo_pago, total: r.total ?? 0 }))
  ].forEach(({ tipo, total }) => {
    totalPorPago[tipo] = (totalPorPago[tipo] || 0) + total
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Historial de Ventas</h1>
          <p className="text-zinc-500 text-sm">Ventas y servicios registrados</p>
        </div>
        <button onClick={exportarExcel} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Exportar Excel
        </button>
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
        <button onClick={cargarDatos} className="btn-primary flex items-center gap-2">
          <Search size={16} /> Buscar
        </button>
      </div>

      {/* Totales por tipo de pago */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(totalPorPago).map(([tipo, total]) => (
          <div key={tipo} className="card p-4">
            <p className="text-xs text-zinc-500">{tipo}</p>
            <p className="text-lg font-bold text-zinc-100">{formatCurrency(total)}</p>
          </div>
        ))}
        <div className="card p-4 bg-blue-950/20 border-blue-800/40">
          <p className="text-xs text-blue-400">Total General</p>
          <p className="text-lg font-bold text-blue-300">{formatCurrency(totalVentas + totalRep)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {(['ventas', 'reparaciones'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'ventas' ? `Ventas (${ventas.length})` : `Servicios (${reparaciones.length})`}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500">Cargando...</div>
        ) : tab === 'ventas' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  {['#', 'Producto', 'Cant.', 'Precio unit.', 'Total', 'Fecha', 'Pago', 'DNI', ''].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {ventas.length === 0 && (
                  <tr><td colSpan={9} className="table-cell text-center text-zinc-500 py-8">Sin ventas en este período</td></tr>
                )}
                {ventas.map((v) => (
                  <tr key={v.venta_id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="table-cell text-zinc-500 text-xs">#{v.venta_id}</td>
                    <td className="table-cell font-medium">{v.nombre_producto}</td>
                    <td className="table-cell">{formatCantidad(v.cantidad)}</td>
                    <td className="table-cell">{formatCurrency(v.precio_unitario)}</td>
                    <td className="table-cell font-semibold text-emerald-400">{formatCurrency(v.total ?? 0)}</td>
                    <td className="table-cell text-zinc-400 text-xs">{formatDate(v.fecha)}</td>
                    <td className="table-cell"><span className="badge-blue">{v.tipo_pago}</span></td>
                    <td className="table-cell text-zinc-500">{v.dni_cliente || '—'}</td>
                    <td className="table-cell">
                      <button onClick={() => anularVenta(v.venta_id)} className="text-zinc-600 hover:text-red-400 transition-colors" title="Anular">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {ventas.length > 0 && (
                <tfoot className="border-t border-zinc-700 bg-zinc-900/50">
                  <tr>
                    <td colSpan={4} className="table-cell text-right text-zinc-400 font-medium">Total:</td>
                    <td className="table-cell font-bold text-emerald-400">{formatCurrency(totalVentas)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  {['#', 'Servicio', 'Cant.', 'Precio', 'Total', 'Fecha', 'Pago'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {reparaciones.length === 0 && (
                  <tr><td colSpan={7} className="table-cell text-center text-zinc-500 py-8">Sin servicios en este período</td></tr>
                )}
                {reparaciones.map((r) => (
                  <tr key={r.reparacion_id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="table-cell text-zinc-500 text-xs">#{r.reparacion_id}</td>
                    <td className="table-cell font-medium">{r.nombre_servicio}</td>
                    <td className="table-cell">{formatCantidad(r.cantidad)}</td>
                    <td className="table-cell">{formatCurrency(r.precio_unitario)}</td>
                    <td className="table-cell font-semibold text-violet-400">{formatCurrency(r.total ?? 0)}</td>
                    <td className="table-cell text-zinc-400 text-xs">{formatDate(r.fecha)}</td>
                    <td className="table-cell"><span className="badge-blue">{r.tipo_pago}</span></td>
                  </tr>
                ))}
              </tbody>
              {reparaciones.length > 0 && (
                <tfoot className="border-t border-zinc-700 bg-zinc-900/50">
                  <tr>
                    <td colSpan={4} className="table-cell text-right text-zinc-400 font-medium">Total:</td>
                    <td className="table-cell font-bold text-violet-400">{formatCurrency(totalRep)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
