import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

type PagoRow = { tipo_pago: string; total: number }

function agruparPorPago(rows: PagoRow[]): Record<string, number> {
  const result: Record<string, number> = {}
  rows.forEach((r) => { result[r.tipo_pago] = (result[r.tipo_pago] || 0) + Number(r.total) })
  return result
}

export async function GET(req: NextRequest) {
  const today = formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || today
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || today

  const [ventasPago, reparacionesPago, egresosPago] = await Promise.all([
    prisma.$queryRaw<PagoRow[]>`
      SELECT v.tipo_pago, COALESCE(SUM(v.cantidad * p.precio), 0) AS total
      FROM ventas_bunker v
      JOIN productos_bunker p ON v.producto_id = p.id
      WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      GROUP BY v.tipo_pago
    `,
    prisma.$queryRaw<PagoRow[]>`
      SELECT tipo_pago, COALESCE(SUM(precio * cantidad), 0) AS total
      FROM reparaciones_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      GROUP BY tipo_pago
    `,
    prisma.$queryRaw<PagoRow[]>`
      SELECT tipo_pago, COALESCE(SUM(monto), 0) AS total
      FROM egresos_bunker
      WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
      GROUP BY tipo_pago
    `,
  ])

  const ventasPorPago = agruparPorPago(ventasPago)
  const reparacionesPorPago = agruparPorPago(reparacionesPago)
  const egresosPorPago = agruparPorPago(egresosPago)

  // Neto por tipo de pago = (ventas + reparaciones) - egresos
  const allTipos = new Set([...Object.keys(ventasPorPago), ...Object.keys(reparacionesPorPago), ...Object.keys(egresosPorPago)])
  const netoPorPago: Record<string, number> = {}
  allTipos.forEach((tipo) => {
    const ing = (ventasPorPago[tipo] || 0) + (reparacionesPorPago[tipo] || 0)
    const eg = egresosPorPago[tipo] || 0
    netoPorPago[tipo] = ing - eg
  })

  const totalIngresos = Object.values(ventasPorPago).reduce((a, b) => a + b, 0) +
    Object.values(reparacionesPorPago).reduce((a, b) => a + b, 0)
  const totalEgresos = Object.values(egresosPorPago).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    netoPorPago,
    ventasPorPago,
    reparacionesPorPago,
    egresosPorPago,
    totalIngresos,
    totalEgresos,
    totalNeto: totalIngresos - totalEgresos,
  })
}
