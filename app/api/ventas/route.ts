import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatInTimeZone } from 'date-fns-tz'
import { ARG_TZ } from '@/lib/utils'

interface CartItem {
  id: number | null
  nombre: string
  precio: number
  cantidad: number
  esManual: boolean
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { carrito, tipoPago, dniCliente } = body as { carrito: CartItem[]; tipoPago: string; dniCliente: string }

  if (!carrito || carrito.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
  }

  const fecha = new Date()

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of carrito) {
        if (item.esManual || item.id === null) {
          // Reparación / servicio manual
          await tx.reparacion.create({
            data: {
              nombreServicio: item.nombre,
              precio: item.precio,
              cantidad: item.cantidad,
              tipoPago,
              dniCliente: dniCliente || null,
              fecha,
            },
          })
        } else {
          // Producto con stock
          const producto = await tx.producto.findUnique({ where: { id: item.id } })
          if (!producto) throw new Error(`Producto ${item.nombre} no encontrado`)
          if (producto.stock < item.cantidad) throw new Error(`Stock insuficiente para ${item.nombre}`)

          await tx.venta.create({
            data: {
              productoId: item.id,
              cantidad: item.cantidad,
              tipoPago,
              dniCliente: dniCliente || null,
              fecha,
              total: item.precio * item.cantidad,
            },
          })

          await tx.producto.update({
            where: { id: item.id },
            data: {
              stock: { decrement: item.cantidad },
              cantidadVendida: { increment: item.cantidad },
            },
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al registrar la venta'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || fechaDesde

  const ventas = await prisma.$queryRaw<
    { venta_id: number; nombre_producto: string; cantidad: number; precio_unitario: number; total: number; fecha: Date; tipo_pago: string; dni_cliente: string | null }[]
  >`
    SELECT
      v.id AS venta_id,
      p.nombre AS nombre_producto,
      v.cantidad,
      p.precio AS precio_unitario,
      (v.cantidad * p.precio) AS total,
      v.fecha,
      v.tipo_pago,
      v.dni_cliente
    FROM ventas_bunker v
    JOIN productos_bunker p ON v.producto_id = p.id
    WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    ORDER BY v.fecha DESC
  `

  return NextResponse.json(ventas)
}
