'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatCantidad } from '@/lib/utils'

interface Producto { id: number; nombre: string; stock: number }
interface Fallado { id: number; nombre: string; cantidad: number; fecha: string; descripcion: string | null }

export default function FalladosPage() {
  const [busqueda, setBusqueda] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [historial, setHistorial] = useState<Fallado[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [form, setForm] = useState({ cantidad: '1', descripcion: '' })
  const [registrando, setRegistrando] = useState(false)

  async function cargarHistorial() {
    const res = await fetch('/api/fallados')
    const d = await res.json()
    setHistorial(d)
  }

  useEffect(() => { cargarHistorial() }, [])

  async function buscarProductos() {
    if (!busqueda.trim()) { setProductos([]); return }
    setBuscando(true)
    const res = await fetch(`/api/productos?busqueda=${encodeURIComponent(busqueda)}`)
    const d = await res.json()
    setProductos(d)
    setBuscando(false)
  }

  async function registrar() {
    if (!productoSeleccionado) { toast.error('Seleccioná un producto'); return }
    const cantidad = parseFloat(form.cantidad)
    if (isNaN(cantidad) || cantidad <= 0) { toast.error('Cantidad inválida'); return }
    if (cantidad > productoSeleccionado.stock) { toast.error('Stock insuficiente'); return }

    setRegistrando(true)
    const res = await fetch('/api/fallados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId: productoSeleccionado.id, cantidad, descripcion: form.descripcion }),
    })
    setRegistrando(false)

    if (res.ok) {
      toast.success('Mercadería fallada registrada')
      setProductoSeleccionado(null)
      setBusqueda('')
      setProductos([])
      setForm({ cantidad: '1', descripcion: '' })
      cargarHistorial()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Error al registrar')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Mercadería Fallada</h1>
        <p className="text-zinc-500 text-sm">Registrá productos dañados o con fallas</p>
      </div>

      {/* Buscar y registrar */}
      <div className="card p-5">
        <h2 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2"><Plus size={18} /> Registrar Falla</h2>

        {/* Buscador */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="input pl-9"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarProductos() }}
            />
          </div>
          <button onClick={buscarProductos} className="btn-secondary flex items-center gap-2">
            <Search size={16} /> Buscar
          </button>
        </div>

        {/* Resultados búsqueda */}
        {buscando && <p className="text-zinc-500 text-sm mb-3">Buscando...</p>}
        {productos.length > 0 && (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {productos.map((p) => (
              <button
                key={p.id}
                onClick={() => setProductoSeleccionado(p)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${
                  productoSeleccionado?.id === p.id
                    ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <span className="font-medium">{p.nombre}</span>
                <span className="text-zinc-500 ml-2">Stock: {formatCantidad(p.stock)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Formulario de falla */}
        {productoSeleccionado && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mt-2">
            <p className="text-sm font-medium text-zinc-200 mb-3">
              Producto: <span className="text-blue-400">{productoSeleccionado.nombre}</span>
              <span className="text-zinc-500 ml-2">(Stock actual: {formatCantidad(productoSeleccionado.stock)})</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Cantidad fallada</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Descripción del problema</label>
                <input
                  className="input"
                  placeholder="Ej: Pantalla rota"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={registrar} disabled={registrando} className="btn-danger flex items-center gap-2">
                {registrando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle size={16} />}
                Registrar Falla
              </button>
              <button onClick={() => { setProductoSeleccionado(null); setForm({ cantidad: '1', descripcion: '' }) }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100">Historial de Fallas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr>
                {['#', 'Producto', 'Cantidad', 'Descripción', 'Fecha'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {historial.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-zinc-500 py-10">
                    <XCircle size={32} className="mx-auto mb-2 opacity-20" />
                    <p>Sin registros de mercadería fallada</p>
                  </td>
                </tr>
              )}
              {historial.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="table-cell text-zinc-500 text-xs">#{f.id}</td>
                  <td className="table-cell font-medium">{f.nombre}</td>
                  <td className="table-cell text-red-400 font-semibold">{formatCantidad(f.cantidad)}</td>
                  <td className="table-cell text-zinc-400">{f.descripcion || '—'}</td>
                  <td className="table-cell text-zinc-400 text-xs">{formatDate(f.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
