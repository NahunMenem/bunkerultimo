import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const busqueda = req.nextUrl.searchParams.get('busqueda') || ''

  const productos = await prisma.producto.findMany({
    where: busqueda
      ? { nombre: { contains: busqueda, mode: 'insensitive' } }
      : undefined,
    orderBy: { nombre: 'asc' },
    select: {
      id: true, nombre: true, stock: true, precio: true,
      precioCosto: true, tipoStock: true, cantidadVendida: true,
    },
  })

  return NextResponse.json(productos)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, stock, precio, precioCosto, tipoStock } = body

    if (!nombre || precio == null) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 })
    }

    const producto = await prisma.producto.create({
      data: {
        nombre: nombre.toUpperCase(),
        stock: parseFloat(stock) || 0,
        precio: parseFloat(precio),
        precioCosto: parseFloat(precioCosto) || 0,
        tipoStock: tipoStock || 'unidad',
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
