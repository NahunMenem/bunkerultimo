import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ARG_TZ } from '@/lib/utils'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const fechaDesde = req.nextUrl.searchParams.get('fecha_desde') || formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
  const fechaHasta = req.nextUrl.searchParams.get('fecha_hasta') || fechaDesde

  const egresos = await prisma.$queryRaw<
    { id: number; fecha: Date; monto: number; descripcion: string; tipoPago: string; categoria: string }[]
  >`
    SELECT id, fecha, monto, descripcion, tipo_pago AS "tipoPago", categoria
    FROM egresos_bunker
    WHERE DATE(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires') BETWEEN ${fechaDesde}::date AND ${fechaHasta}::date
    ORDER BY fecha DESC
  `

  return NextResponse.json(egresos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { fecha, monto, descripcion, tipoPago, categoria } = body

  if (!fecha || !monto || !descripcion) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const egreso = await prisma.egreso.create({
    data: {
      fecha: new Date(`${fecha}T12:00:00`),
      monto: parseFloat(monto),
      descripcion,
      tipoPago,
      categoria: categoria || 'Otros',
    },
  })

  return NextResponse.json(egreso, { status: 201 })
}
