import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const today = formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || today
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || today

  const ventas = await prisma.$queryRaw<
    {
      venta_id: number; nombre_producto: string; cantidad: number
      precio_unitario: number; total: number; fecha: Date; tipo_pago: string; dni_cliente: string | null
    }[]
  >`
    SELECT v.id AS venta_id, p.nombre AS nombre_producto, v.cantidad,
      p.precio AS precio_unitario, (v.cantidad * p.precio) AS total,
      v.fecha, v.tipo_pago, v.dni_cliente
    FROM ventas_bunker v
    JOIN productos_bunker p ON v.producto_id = p.id
    WHERE DATE(v.fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    ORDER BY v.fecha DESC
  `

  const reparaciones = await prisma.$queryRaw<
    { reparacion_id: number; nombre_servicio: string; cantidad: number; precio_unitario: number; total: number; fecha: Date; tipo_pago: string }[]
  >`
    SELECT id AS reparacion_id, nombre_servicio, cantidad, precio AS precio_unitario,
      (cantidad * precio) AS total, fecha, tipo_pago
    FROM reparaciones_bunker
    WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    ORDER BY fecha DESC
  `

  const wb = XLSX.utils.book_new()

  // Hoja ventas
  const ventasData = [
    ['ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Fecha', 'Tipo Pago', 'DNI'],
    ...ventas.map((v) => [
      v.venta_id,
      v.nombre_producto,
      Number(v.cantidad),
      Number(v.precio_unitario),
      Number(v.total),
      formatInTimeZone(new Date(v.fecha), ARG_TZ, 'dd/MM/yyyy HH:mm'),
      v.tipo_pago,
      v.dni_cliente || '',
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ventasData), 'Ventas')

  // Hoja reparaciones
  const repData = [
    ['ID', 'Servicio', 'Cantidad', 'Precio', 'Total', 'Fecha', 'Tipo Pago'],
    ...reparaciones.map((r) => [
      r.reparacion_id,
      r.nombre_servicio,
      Number(r.cantidad),
      Number(r.precio_unitario),
      Number(r.total),
      formatInTimeZone(new Date(r.fecha), ARG_TZ, 'dd/MM/yyyy HH:mm'),
      r.tipo_pago,
    ]),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(repData), 'Servicios')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ventas_${fechaDesde}_a_${fechaHasta}.xlsx"`,
    },
  })
}
