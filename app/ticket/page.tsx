'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { formatCurrency, formatCantidad } from '@/lib/utils'

interface CartItem { id: number | null; nombre: string; precio: number; cantidad: number; esManual: boolean }

function TicketContent() {
  const params = useSearchParams()
  const [carrito, setCarrito] = useState<CartItem[]>([])
  const [tipoPago, setTipoPago] = useState('')
  const [total, setTotal] = useState(0)
  const [fecha] = useState(new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))

  useEffect(() => {
    try {
      const carritoParam = params.get('carrito')
      if (carritoParam) setCarrito(JSON.parse(carritoParam))
      setTipoPago(params.get('tipoPago') || '')
      setTotal(parseFloat(params.get('total') || '0'))
    } catch { /* empty */ }
  }, [params])

  useEffect(() => {
    if (carrito.length > 0) {
      setTimeout(() => window.print(), 500)
    }
  }, [carrito])

  return (
    <div className="bg-white text-black p-6 max-w-xs mx-auto font-mono text-sm">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">BUNKER</h1>
        <p className="text-xs text-gray-500">Sistema de Gestión</p>
        <p className="text-xs mt-1">{fecha}</p>
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      <div className="space-y-1">
        {carrito.map((item, i) => (
          <div key={i}>
            <p className="font-medium">{item.nombre}</p>
            <div className="flex justify-between text-xs text-gray-600 pl-2">
              <span>{formatCantidad(item.cantidad)} × {formatCurrency(item.precio)}</span>
              <span className="font-semibold">{formatCurrency(item.precio * item.cantidad)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 my-3" />

      <div className="flex justify-between font-bold text-lg">
        <span>TOTAL</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">Forma de pago: {tipoPago}</p>

      <div className="border-t border-dashed border-gray-300 my-3" />
      <p className="text-center text-xs text-gray-400">¡Gracias por su compra!</p>
    </div>
  )
}

export default function TicketPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TicketContent />
    </Suspense>
  )
}
