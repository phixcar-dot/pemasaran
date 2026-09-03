import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export const metadata = {
  title: 'Profil Administrator — PLN Sistem Tunggakan',
}

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  if (!user) redirect('/login')

  return <ProfileClient user={user} />
}
