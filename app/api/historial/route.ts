import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const today = formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || today
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || today

  const [ventas, reparaciones] = await Promise.all([
    prisma.$queryRaw<
      {
        venta_id: number; nombre_producto: string; cantidad: number
        precio_unitario: number; total: number; fecha: Date
        tipo_pago: string; dni_cliente: string | null; tipo_stock: string
      }[]
    >`
      SELECT
        v.id AS venta_id,
        p.nombre AS nombre_producto,
        v.cantidad,
        p.precio AS precio_unitario,
        (v.cantidad * p.precio) AS total,
        v.fecha,
        v.tipo_pago,
        v.dni_cliente,
        p.tipo_stock
      FROM ventas_bunker v
      JOIN productos_bunker p ON v.producto_id = p.id
      WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      ORDER BY v.fecha DESC
    `,
    prisma.$queryRaw<
      {
        reparacion_id: number; nombre_servicio: string; cantidad: number
        precio_unitario: number; total: number; fecha: Date; tipo_pago: string
      }[]
    >`
      SELECT
        id AS reparacion_id,
        nombre_servicio,
        cantidad,
        precio AS precio_unitario,
        (cantidad * precio) AS total,
        fecha,
        tipo_pago
      FROM reparaciones_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      ORDER BY fecha DESC
    `,
  ])

  return NextResponse.json({ ventas, reparaciones })
}
