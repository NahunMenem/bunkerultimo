import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const productos = await prisma.producto.findMany({
    where: { stock: { lte: 2 } },
    orderBy: { stock: 'asc' },
    select: { id: true, nombre: true, stock: true, precio: true, precioCosto: true, tipoStock: true },
  })

  return NextResponse.json(productos)
}
