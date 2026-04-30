import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // Modo: sólo agregar stock
  if (body.agregarStock != null) {
    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: { stock: { increment: parseFloat(body.agregarStock) } },
    })
    return NextResponse.json(producto)
  }

  const { nombre, stock, precio, precioCosto, tipoStock } = body
  const producto = await prisma.producto.update({
    where: { id: parseInt(id) },
    data: {
      nombre: nombre?.toUpperCase(),
      stock: parseFloat(stock) || 0,
      precio: parseFloat(precio),
      precioCosto: parseFloat(precioCosto) || 0,
      tipoStock: tipoStock || 'unidad',
    },
  })
  return NextResponse.json(producto)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.producto.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
