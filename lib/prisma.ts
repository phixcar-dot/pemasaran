import 'dotenv/config'
import { PrismaClient } from '@/prisma/generated/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

// Mencegah multiple instances PrismaClient saat hot-reload di development
// Prisma 7: koneksi menggunakan adapter MariaDB (driver adapter untuk MySQL/MariaDB)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function parseDbUrl(url: string) {
  // Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ''),
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const { host, port, user, password, database } = parseDbUrl(databaseUrl)

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 5,
  })

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
