'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { formatCurrency, formatCantidad } from '@/lib/utils'

interface Producto { id: number; nombre: string; stock: number; precio: number; precioCosto: number; tipoStock: string }

export default function StockBajoPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/stock-bajo')
    const d = await res.json()
    setProductos(d)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Stock Bajo</h1>
          <p className="text-zinc-500 text-sm">Productos con stock ≤ 2 unidades</p>
        </div>
        <button onClick={cargar} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-zinc-500">Cargando...</div>
      ) : productos.length === 0 ? (
        <div className="card p-10 text-center text-emerald-500">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="font-medium">Todo el stock está en buen nivel</p>
          <p className="text-sm text-zinc-500 mt-1">No hay productos por agotarse</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span className="font-semibold text-zinc-100">{productos.length} productos con stock bajo</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-900/80">
                <tr>
                  {['Producto', 'Stock actual', 'Precio venta', 'Precio costo', 'Tipo'].map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {productos.map((p) => (
                  <tr key={p.id} className={`hover:bg-zinc-800/30 transition-colors ${p.stock <= 0 ? 'bg-red-950/10' : 'bg-amber-950/10'}`}>
                    <td className="table-cell font-medium">{p.nombre}</td>
                    <td className="table-cell">
                      <span className={`text-lg font-bold ${p.stock <= 0 ? 'text-red-400' : 'text-amber-400'}`}>
                        {formatCantidad(p.stock)} {p.tipoStock === 'kilo' ? 'kg' : 'u'}
                      </span>
                      {p.stock <= 0 && <span className="ml-2 badge-red">Sin stock</span>}
                      {p.stock > 0 && p.stock <= 2 && <span className="ml-2 badge-yellow">Bajo</span>}
                    </td>
                    <td className="table-cell text-emerald-400 font-medium">{formatCurrency(p.precio)}</td>
                    <td className="table-cell text-zinc-400">{formatCurrency(p.precioCosto)}</td>
                    <td className="table-cell"><span className="badge-blue">{p.tipoStock}</span></td>
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
