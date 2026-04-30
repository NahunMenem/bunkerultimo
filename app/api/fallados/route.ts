import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const historial = await prisma.$queryRaw<
    { id: number; nombre: string; cantidad: number; fecha: Date; descripcion: string | null }[]
  >`
    SELECT mf.id, p.nombre, mf.cantidad, mf.fecha, mf.descripcion
    FROM mercaderia_fallada mf
    JOIN productos_bunker p ON mf.producto_id = p.id
    ORDER BY mf.fecha DESC
  `
  return NextResponse.json(historial)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { productoId, cantidad, descripcion } = body

  const producto = await prisma.producto.findUnique({ where: { id: parseInt(productoId) } })
  if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  if (producto.stock < cantidad) return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 })

  await prisma.$transaction([
    prisma.mercaderiaFallada.create({
      data: { productoId: parseInt(productoId), cantidad: parseFloat(cantidad), descripcion: descripcion || null },
    }),
    prisma.producto.update({
      where: { id: parseInt(productoId) },
      data: { stock: { decrement: parseFloat(cantidad) } },
    }),
  ])

  return NextResponse.json({ success: true }, { status: 201 })
}
