'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Edit2, Trash2, Save, X, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatCantidad } from '@/lib/utils'

interface Producto {
  id: number; nombre: string; stock: number; precio: number
  precioCosto: number; tipoStock: string
}

const emptyForm = { nombre: '', stock: '', precio: '', precioCosto: '', tipoStock: 'unidad' }

export default function StockPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/productos?busqueda=${encodeURIComponent(busqueda)}`)
    const data = await res.json()
    setProductos(data)
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  function iniciarEdicion(p: Producto) {
    setEditId(p.id)
    setForm({ nombre: p.nombre, stock: p.stock.toString(), precio: p.precio.toString(), precioCosto: p.precioCosto.toString(), tipoStock: p.tipoStock })
    setShowForm(true)
  }

  function cancelar() { setEditId(null); setForm(emptyForm); setShowForm(false) }

  async function guardar() {
    if (!form.nombre || !form.precio) { toast.error('Nombre y precio son requeridos'); return }
    const body = {
      nombre: form.nombre.toUpperCase(),
      stock: parseFloat(form.stock) || 0,
      precio: parseFloat(form.precio),
      precioCosto: parseFloat(form.precioCosto) || 0,
      tipoStock: form.tipoStock,
    }
    const url = editId ? `/api/productos/${editId}` : '/api/productos'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editId ? 'Producto actualizado' : 'Producto creado')
      cancelar(); cargar()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Error al guardar')
    }
  }

  async function eliminar(id: number, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Producto eliminado'); cargar() }
    else toast.error('Error al eliminar el producto')
  }

  async function agregarStock(id: number, nombre: string) {
    const input = prompt(`¿Cuánto stock agregar para "${nombre}"?`)
    if (!input) return
    const cantidad = parseFloat(input)
    if (isNaN(cantidad) || cantidad <= 0) { toast.error('Cantidad inválida'); return }
    const res = await fetch(`/api/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agregarStock: cantidad }),
    })
    if (res.ok) { toast.success(`+${cantidad} unidades agregadas`); cargar() }
    else toast.error('Error al actualizar stock')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gestión de Stock</h1>
          <p className="text-zinc-500 text-sm">{productos.length} productos</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-zinc-100 mb-4">{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nombre</label>
              <input className="input" placeholder="NOMBRE" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="label">Stock inicial</label>
              <input type="number" min="0" step="0.001" className="input" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className="label">Precio venta ($)</label>
              <input type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            </div>
            <div>
              <label className="label">Precio costo ($)</label>
              <input type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.precioCosto} onChange={(e) => setForm({ ...form, precioCosto: e.target.value })} />
            </div>
            <div>
              <label className="label">Tipo de stock</label>
              <select className="select" value={form.tipoStock} onChange={(e) => setForm({ ...form, tipoStock: e.target.value })}>
                <option value="unidad">Unidad</option>
                <option value="kilo">Kilo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={guardar} className="btn-primary flex items-center gap-2">
              <Save size={16} /> Guardar
            </button>
            <button onClick={cancelar} className="btn-secondary flex items-center gap-2">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          className="input pl-9"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  {['Producto', 'Stock', 'Precio venta', 'Precio costo', 'Margen', 'Tipo', ''].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {productos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="table-cell text-center text-zinc-500 py-10">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p>No hay productos</p>
                    </td>
                  </tr>
                )}
                {productos.map((p) => {
                  const margen = p.precio > 0 ? ((p.precio - p.precioCosto) / p.precio * 100) : 0
                  return (
                    <tr key={p.id} className={`hover:bg-zinc-800/30 transition-colors ${p.stock <= 2 ? 'bg-amber-950/10' : ''}`}>
                      <td className="table-cell font-medium">{p.nombre}</td>
                      <td className="table-cell">
                        <span className={`font-semibold ${p.stock <= 0 ? 'text-red-400' : p.stock <= 2 ? 'text-amber-400' : 'text-zinc-100'}`}>
                          {formatCantidad(p.stock)} {p.tipoStock === 'kilo' ? 'kg' : 'u'}
                        </span>
                      </td>
                      <td className="table-cell text-emerald-400 font-medium">{formatCurrency(p.precio)}</td>
                      <td className="table-cell text-zinc-400">{formatCurrency(p.precioCosto)}</td>
                      <td className="table-cell">
                        <span className={`font-medium ${margen > 20 ? 'text-emerald-400' : margen > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {margen.toFixed(1)}%
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="badge-blue">{p.tipoStock}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button onClick={() => agregarStock(p.id, p.nombre)} className="text-emerald-500 hover:text-emerald-400 transition-colors text-xs font-medium" title="Agregar stock">
                            +Stock
                          </button>
                          <button onClick={() => iniciarEdicion(p)} className="text-zinc-500 hover:text-blue-400 transition-colors" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => eliminar(p.id, p.nombre)} className="text-zinc-500 hover:text-red-400 transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
