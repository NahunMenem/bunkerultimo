import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ARG_TZ = 'America/Argentina/Buenos_Aires'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, ARG_TZ, 'dd/MM/yyyy HH:mm')
}

export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, ARG_TZ, 'dd/MM/yyyy')
}

export function todayARG(): string {
  return formatInTimeZone(new Date(), ARG_TZ, 'yyyy-MM-dd')
}

export function formatCantidad(cantidad: number): string {
  return cantidad % 1 === 0 ? cantidad.toString() : cantidad.toFixed(3).replace(/\.?0+$/, '')
}

export const TIPOS_PAGO = ['Efectivo', 'Transferencia', 'Crédito', 'Débito'] as const

export const CATEGORIAS_EGRESO = [
  'Servicios',
  'Mercadería',
  'Personal',
  'Alquiler',
  'Impuestos',
  'Mantenimiento',
  'Publicidad',
  'Otros',
] as const
