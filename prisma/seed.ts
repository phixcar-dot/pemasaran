/**
 * Script untuk membuat user awal sistem.
 * Jalankan: npx tsx prisma/seed.ts
 *
 * HAPUS atau NONAKTIFKAN file ini setelah user dibuat.
 * Jangan commit password ke source code.
 */
import 'dotenv/config'
import { PrismaClient } from './generated/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { hash } from 'bcryptjs'

function parseDbUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : 3306,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace(/^\//, ''),
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL tidak ditemukan di .env')

  const { host, port, user, password, database } = parseDbUrl(databaseUrl)
  const adapter = new PrismaMariaDb({ host, port, user, password, database })
  const prisma = new PrismaClient({ adapter })

  // Cek apakah user admin sudah ada
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@situnggakan.local' },
  })

  if (existing) {
    console.log('User admin sudah ada. Seed dilewati.')
    await prisma.$disconnect()
    return
  }

  // Hash password dengan bcrypt cost factor 12
  const hashedPassword = await hash('Admin@1234', 12)

  const newUser = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@situnggakan.local',
      password: hashedPassword,
    },
  })

  console.log(`✅ User berhasil dibuat:`)
  console.log(`   ID    : ${newUser.id}`)
  console.log(`   Nama  : ${newUser.name}`)
  console.log(`   Email : ${newUser.email}`)
  console.log(`   Password tersimpan sebagai HASH (bukan plaintext)`)
  console.log(``)
  console.log(`Kredensial login untuk testing:`)
  console.log(`   Email    : admin@situnggakan.local`)
  console.log(`   Password : Admin@1234`)
  console.log(``)
  console.log(`⚠️  Ganti password ini setelah login pertama.`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
