'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2, ShoppingCart, X, Printer, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatCantidad, TIPOS_PAGO } from '@/lib/utils'

interface Producto { id: number; nombre: string; stock: number; precio: number; tipoStock: string }
interface CartItem { id: number | null; nombre: string; precio: number; cantidad: number; esManual: boolean }

const CART_KEY = 'bunker-carrito'

export default function VentasPage() {
  const [busqueda, setBusqueda] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [tipoPago, setTipoPago] = useState('Efectivo')
  const [dniCliente, setDniCliente] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const [manual, setManual] = useState({ nombre: '', precio: '', cantidad: '1' })
  const [cantidades, setCantidades] = useState<Record<number, string>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persistir carrito en localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CART_KEY)
    if (saved) setCarrito(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(carrito))
  }, [carrito])

  function buscarProductos(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setProductos([]); return }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/productos?busqueda=${encodeURIComponent(q)}`)
      const data = await res.json()
      setProductos(data)
      setBuscando(false)
    }, 300)
  }

  function agregarProducto(p: Producto) {
    const cantidad = parseFloat(cantidades[p.id] ?? '1') || 1
    if (cantidad <= 0) { toast.error('La cantidad debe ser mayor a 0'); return }
    if (cantidad > p.stock) { toast.error(`Stock insuficiente. Disponible: ${formatCantidad(p.stock)}`); return }
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.id === p.id && !i.esManual)
      if (idx >= 0) {
        const updated = [...prev]
        const newCant = updated[idx].cantidad + cantidad
        if (newCant > p.stock) { toast.error('Stock insuficiente'); return prev }
        updated[idx] = { ...updated[idx], cantidad: newCant }
        return updated
      }
      return [...prev, { id: p.id, nombre: p.nombre, precio: p.precio, cantidad, esManual: false }]
    })
    setCantidades((prev) => ({ ...prev, [p.id]: '1' }))
    toast.success(`"${p.nombre}" agregado`)
  }

  function agregarManual() {
    if (!manual.nombre || !manual.precio || !manual.cantidad) { toast.error('Completá todos los campos del servicio'); return }
    const precio = parseFloat(manual.precio)
    const cantidad = parseFloat(manual.cantidad)
    if (isNaN(precio) || precio <= 0 || isNaN(cantidad) || cantidad <= 0) { toast.error('Valores inválidos'); return }
    setCarrito((prev) => [...prev, { id: null, nombre: manual.nombre, precio, cantidad, esManual: true }])
    setManual({ nombre: '', precio: '', cantidad: '1' })
    toast.success('Servicio agregado')
  }

  function eliminarItem(idx: number) { setCarrito((prev) => prev.filter((_, i) => i !== idx)) }

  function vaciarCarrito() { setCarrito([]); localStorage.removeItem(CART_KEY); toast.success('Carrito vaciado') }

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  async function registrarVenta() {
    if (carrito.length === 0) { toast.error('El carrito está vacío'); return }
    setRegistrando(true)
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito, tipoPago, dniCliente }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al registrar la venta'); return }
      toast.success('¡Venta registrada con éxito!')
      vaciarCarrito()
      setDniCliente('')
      setBusqueda('')
      setProductos([])
    } catch {
      toast.error('Error de conexión')
    } finally {
      setRegistrando(false)
    }
  }

  function imprimirTicket() {
    if (carrito.length === 0) { toast.error('El carrito está vacío'); return }
    const params = new URLSearchParams({ carrito: JSON.stringify(carrito), tipoPago, total: total.toString() })
    window.open(`/ticket?${params}`, '_blank', 'width=400,height=600')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Registrar Venta</h1>
        <p className="text-zinc-500 text-sm">Agregá productos o servicios al carrito</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Panel izquierdo */}
        <div className="xl:col-span-3 space-y-5">
          {/* Buscar producto */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Search size={16} /> Buscar Producto
            </h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="input pl-9"
                placeholder="Nombre del producto..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); buscarProductos(e.target.value) }}
              />
            </div>

            {buscando && <p className="text-zinc-500 text-sm text-center py-3">Buscando...</p>}

            {productos.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {productos.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-3 py-2.5 border border-zinc-700/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 text-sm">{p.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        Stock: {formatCantidad(p.stock)} {p.tipoStock === 'kilo' ? 'kg' : 'u'}
                        {' · '}
                        <span className="text-emerald-400 font-medium">{formatCurrency(p.precio)}</span>
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0.001"
                      step={p.tipoStock === 'kilo' ? '0.001' : '1'}
                      className="input w-20 text-center text-sm py-1.5"
                      value={cantidades[p.id] ?? '1'}
                      onChange={(e) => setCantidades((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <button onClick={() => agregarProducto(p)} className="btn-primary py-1.5 px-3 text-sm">
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {busqueda && !buscando && productos.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-3">No se encontraron productos</p>
            )}
          </div>

          {/* Entrada manual */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Plus size={16} /> Servicio / Entrada Manual
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="label">Descripción</label>
                <input
                  className="input"
                  placeholder="Ej: Reparación pantalla"
                  value={manual.nombre}
                  onChange={(e) => setManual({ ...manual, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Precio ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={manual.precio}
                  onChange={(e) => setManual({ ...manual, precio: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={manual.cantidad}
                  onChange={(e) => setManual({ ...manual, cantidad: e.target.value })}
                />
              </div>
            </div>
            <button onClick={agregarManual} className="btn-secondary mt-3 flex items-center gap-2">
              <Plus size={16} /> Agregar al carrito
            </button>
          </div>
        </div>

        {/* Panel derecho - Carrito */}
        <div className="xl:col-span-2">
          <div className="card p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                <ShoppingCart size={18} />
                Carrito ({carrito.length})
              </h2>
              {carrito.length > 0 && (
                <button onClick={vaciarCarrito} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                  <X size={14} /> Vaciar
                </button>
              )}
            </div>

            {carrito.length === 0 ? (
              <div className="text-center py-10 text-zinc-600">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{item.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        {formatCantidad(item.cantidad)} × {formatCurrency(item.precio)}
                        {item.esManual && <span className="ml-1 text-violet-400">(servicio)</span>}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(item.precio * item.cantidad)}
                    </p>
                    <button onClick={() => eliminarItem(idx)} className="text-zinc-600 hover:text-red-400 transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Opciones de pago */}
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div>
                <label className="label">Tipo de pago</label>
                <select className="select" value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                  {TIPOS_PAGO.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">DNI cliente (opcional)</label>
                <input
                  className="input"
                  placeholder="12345678"
                  value={dniCliente}
                  onChange={(e) => setDniCliente(e.target.value)}
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 mt-2 border-t border-zinc-700">
              <span className="font-semibold text-zinc-300">Total</span>
              <span className="text-2xl font-bold text-emerald-400">{formatCurrency(total)}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={imprimirTicket}
                disabled={carrito.length === 0}
                className="btn-secondary flex items-center gap-2 flex-1 justify-center py-2.5"
              >
                <Printer size={16} /> Ticket
              </button>
              <button
                onClick={registrarVenta}
                disabled={carrito.length === 0 || registrando}
                className="btn-success flex items-center gap-2 flex-1 justify-center py-2.5"
              >
                {registrando ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                {registrando ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
