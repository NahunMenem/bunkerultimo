# Bunker Sistema — Next.js + Railway

Sistema de gestión para punto de venta (POS), inventario, egresos y reportes.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** — UI moderna dark mode
- **Prisma ORM** — PostgreSQL
- **NextAuth.js** — autenticación con JWT
- **Recharts** — gráficos interactivos
- **xlsx** — exportación a Excel

---

## Deploy en Railway (paso a paso)

### 1. Crear proyecto en Railway

1. Ingresá a [railway.app](https://railway.app) y creá un nuevo proyecto
2. Agregá un plugin de **PostgreSQL** al proyecto
3. Hacé click en "Deploy from GitHub Repo" y conectá este repositorio

### 2. Variables de entorno

En Railway → Settings → Variables, configurá:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Se configura automáticamente con el plugin de PostgreSQL |
| `NEXTAUTH_SECRET` | Generá uno con: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL de tu app en Railway (ej: `https://bunker.up.railway.app`) |

### 3. Configurar la base de datos (primera vez)

Después del primer deploy, abrí la consola de Railway y ejecutá:

```bash
# Crear las tablas
npx prisma db push

# Crear el usuario administrador (admin / admin123)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

O podés correr el SQL directamente en tu base de datos PostgreSQL:

```sql
-- Ver prisma/schema.prisma para las definiciones de tablas
```

### 4. Variables del archivo railway.toml

El archivo `railway.toml` ya está configurado:
- Build: `npm run build` (incluye `prisma generate`)
- Start: `npm run start`
- Healthcheck: `/api/health`

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL local

# Generar el cliente de Prisma
npm run db:generate

# Crear las tablas (nueva BD)
npx prisma db push

# Crear usuario admin
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

---

## Migración desde el sistema Flask anterior

Si querés conectarte a la base de datos existente en Render:

1. Copiá el `DATABASE_URL` de Render como variable de entorno
2. No ejecutes `prisma db push` — las tablas ya existen
3. Solo ejecutá `npm run db:generate` en el build

Para migrar a Railway PostgreSQL:
```bash
# Exportar desde Render
pg_dump -h <host-render> -U negocio2_user negocio2 > backup.sql

# Importar en Railway
psql $DATABASE_URL < backup.sql
```

---

## Funcionalidades

- **Login** con autenticación segura (bcrypt)
- **Registrar Venta** — POS con carrito, búsqueda de productos, servicios manuales, impresión de ticket
- **Gestión de Stock** — CRUD completo, visualización de márgenes
- **Historial** — ventas y servicios por rango de fecha, exportación a Excel
- **Egresos** — registro con categorías, resumen
- **Dashboard Analytics** — KPIs, gráficos de ventas por tipo y egresos por categoría
- **Caja** — ingresos, egresos y neto por tipo de pago
- **Más Vendidos** — top 10 por fecha o histórico
- **Stock Bajo** — alerta de productos con stock ≤ 2
- **Mercadería Fallada** — registro de fallas con descuento automático de stock

---

## Seguridad mejorada respecto al sistema anterior

- Contraseñas hasheadas con bcrypt (vs texto plano)
- Secretos en variables de entorno (vs hardcodeados)
- Sesiones JWT (vs cookies de Flask)
- Debug mode desactivado en producción
