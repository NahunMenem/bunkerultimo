import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const today = formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const modo = req.nextUrl.searchParams.get('modo') || 'rango'
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || today.slice(0, 8) + '01'
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || today

  const productos = modo === 'historico'
    ? await prisma.$queryRaw<{ nombre: string; cantidad_vendida: number; total_venta: number }[]>`
        SELECT
          p.nombre,
          COALESCE(SUM(v.cantidad), 0) AS cantidad_vendida,
          COALESCE(SUM(v.cantidad * p.precio), 0) AS total_venta
        FROM ventas_bunker v
        JOIN productos_bunker p ON v.producto_id = p.id
        GROUP BY p.nombre
        ORDER BY total_venta DESC
        LIMIT 10
      `
    : await prisma.$queryRaw<{ nombre: string; cantidad_vendida: number; total_venta: number }[]>`
        SELECT
          p.nombre,
          COALESCE(SUM(v.cantidad), 0) AS cantidad_vendida,
          COALESCE(SUM(v.cantidad * p.precio), 0) AS total_venta
        FROM ventas_bunker v
        JOIN productos_bunker p ON v.producto_id = p.id
        WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
        GROUP BY p.nombre
        ORDER BY total_venta DESC
        LIMIT 10
      `

  const totalGeneral = productos.reduce((acc, p) => acc + Number(p.total_venta), 0)

  const result = productos.map((p) => ({
    nombre: p.nombre,
    cantidadVendida: Number(p.cantidad_vendida),
    totalVenta: Number(p.total_venta),
    porcentaje: totalGeneral > 0 ? (Number(p.total_venta) / totalGeneral) * 100 : 0,
  }))

  return NextResponse.json({ productos: result, totalGeneral })
}
