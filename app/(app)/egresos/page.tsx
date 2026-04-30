'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Filter, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, todayARG, TIPOS_PAGO, CATEGORIAS_EGRESO } from '@/lib/utils'

interface Egreso {
  id: number; fecha: string; monto: number; descripcion: string; tipoPago: string; categoria: string
}

const emptyForm = { fecha: '', monto: '', descripcion: '', tipoPago: 'Efectivo', categoria: 'Otros' }

export default function EgresosPage() {
  const today = todayARG()
  const [fechaDesde, setFechaDesde] = useState(today)
  const [fechaHasta, setFechaHasta] = useState(today)
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, fecha: today })
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/egresos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`)
      const data = await res.json()
      setEgresos(data)
    } catch { toast.error('Error al cargar egresos') }
    finally { setLoading(false) }
  }, [fechaDesde, fechaHasta])

  useEffect(() => { cargar() }, [cargar])

  async function agregar() {
    if (!form.fecha || !form.monto || !form.descripcion) { toast.error('Completá todos los campos obligatorios'); return }
    const monto = parseFloat(form.monto)
    if (isNaN(monto) || monto <= 0) { toast.error('Monto inválido'); return }
    setGuardando(true)
    const res = await fetch('/api/egresos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: form.fecha, monto, descripcion: form.descripcion, tipoPago: form.tipoPago, categoria: form.categoria }),
    })
    setGuardando(false)
    if (res.ok) { toast.success('Egreso registrado'); setForm({ ...emptyForm, fecha: today }); cargar() }
    else toast.error('Error al registrar el egreso')
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este egreso?')) return
    const res = await fetch(`/api/egresos/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Egreso eliminado'); cargar() }
    else toast.error('Error al eliminar')
  }

  const total = egresos.reduce((a, e) => a + e.monto, 0)

  // Totales por categoría
  const porCategoria: Record<string, number> = {}
  egresos.forEach((e) => { porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + e.monto })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Egresos</h1>
        <p className="text-zinc-500 text-sm">Control de gastos del negocio</p>
      </div>

      {/* Formulario */}
      <div className="card p-5">
        <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Plus size={18} /> Nuevo Egreso</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Fecha *</label>
            <input type="date" className="input" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div>
            <label className="label">Monto ($) *</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Descripción *</label>
            <input className="input" placeholder="Descripción del gasto" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS_EGRESO.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de pago</label>
            <select className="select" value={form.tipoPago} onChange={(e) => setForm({ ...form, tipoPago: e.target.value })}>
              {TIPOS_PAGO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={agregar} disabled={guardando} className="btn-danger mt-4 flex items-center gap-2">
          {guardando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
          Registrar Egreso
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
        <button onClick={cargar} className="btn-primary flex items-center gap-2">
          <Search size={16} /> Filtrar
        </button>
      </div>

      {/* Resumen por categoría */}
      {Object.keys(porCategoria).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => (
            <div key={cat} className="card p-3">
              <p className="text-xs text-zinc-500">{cat}</p>
              <p className="text-base font-bold text-rose-400">{formatCurrency(monto)}</p>
            </div>
          ))}
          <div className="card p-3 bg-rose-950/20 border-rose-800/40">
            <p className="text-xs text-rose-400">Total</p>
            <p className="text-base font-bold text-rose-300">{formatCurrency(total)}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  {['Fecha', 'Descripción', 'Categoría', 'Tipo de pago', 'Monto', ''].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {egresos.length === 0 && (
                  <tr><td colSpan={6} className="table-cell text-center text-zinc-500 py-10">Sin egresos en este período</td></tr>
                )}
                {egresos.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="table-cell text-zinc-400 text-xs">{formatDate(e.fecha)}</td>
                    <td className="table-cell font-medium">{e.descripcion}</td>
                    <td className="table-cell"><span className="badge-yellow">{e.categoria}</span></td>
                    <td className="table-cell"><span className="badge-blue">{e.tipoPago}</span></td>
                    <td className="table-cell font-semibold text-rose-400">{formatCurrency(e.monto)}</td>
                    <td className="table-cell">
                      <button onClick={() => eliminar(e.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {egresos.length > 0 && (
                <tfoot className="border-t border-zinc-700 bg-zinc-900/50">
                  <tr>
                    <td colSpan={4} className="table-cell text-right text-zinc-400 font-medium">Total:</td>
                    <td className="table-cell font-bold text-rose-400">{formatCurrency(total)}</td>
                    <td></td>
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
