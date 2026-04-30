import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const today = formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || today
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || today

  const [[ventasProductos], [ventasRep], [egresos], [costos], distribucion, egresosCat] = await Promise.all([
    // Total ventas productos
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(v.cantidad * p.precio), 0) AS total
      FROM ventas_bunker v
      LEFT JOIN productos_bunker p ON v.producto_id = p.id
      WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    `,
    // Total reparaciones
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(precio), 0) AS total
      FROM reparaciones_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    `,
    // Total egresos
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(monto), 0) AS total
      FROM egresos_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    `,
    // Costo de productos vendidos
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(v.cantidad * p.precio_costo), 0) AS total
      FROM ventas_bunker v
      JOIN productos_bunker p ON v.producto_id = p.id
      WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    `,
    // Distribución por tipo
    prisma.$queryRaw<{ tipo: string; total: number }[]>`
      SELECT 'Productos' AS tipo, COALESCE(SUM(v.cantidad * p.precio), 0) AS total
      FROM ventas_bunker v
      LEFT JOIN productos_bunker p ON v.producto_id = p.id
      WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      UNION ALL
      SELECT 'Reparaciones' AS tipo, COALESCE(SUM(precio), 0) AS total
      FROM reparaciones_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    `,
    // Egresos por categoría
    prisma.$queryRaw<{ nombre: string; total: number }[]>`
      SELECT categoria AS nombre, COALESCE(SUM(monto), 0) AS total
      FROM egresos_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      GROUP BY categoria
      ORDER BY total DESC
    `,
  ])

  const totalVentasProductos = Number(ventasProductos.total)
  const totalVentasReparaciones = Number(ventasRep.total)
  const totalVentas = totalVentasProductos + totalVentasReparaciones
  const totalEgresos = Number(egresos.total)
  const totalCosto = Number(costos.total)
  const ganancia = totalVentas - totalEgresos - totalCosto

  return NextResponse.json({
    totalVentas,
    totalEgresos,
    totalCosto,
    ganancia,
    totalVentasProductos,
    totalVentasReparaciones,
    distribucionVentas: distribucion.map((d) => ({ tipo: d.tipo, total: Number(d.total) })),
    egresosPorCategoria: egresosCat.map((c) => ({ nombre: c.nombre, total: Number(c.total) })),
  })
}
