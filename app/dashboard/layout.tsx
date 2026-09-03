import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import ToastProvider from '@/components/ToastProvider'
import PageTransition from '@/components/PageTransition'
import { SidebarProvider } from '@/components/SidebarContext'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const initials = session.name
    ? session.name
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : 'A'

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fade-in-content {
          animation: fade-in 0.5s ease forwards;
        }
      `}</style>
      <ToastProvider>
        <SidebarProvider>
          {/* Sidebar fixed kiri */}
          <Sidebar name={session.name} />

          {/* Konten — offset ikut lebar sidebar via context */}
          <DashboardShell>
            {/* Top-bar sticky */}
            <TopBar initials={initials} name={session.name} />

            {/* Halaman */}
            <main className="flex-1 px-6 py-6">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            {/* Footer */}
            <footer className="px-6 py-3 border-t border-gray-200 bg-white
                               flex items-center justify-between text-[11px] text-gray-400 shrink-0">
              <span>© 2026 Sistem Tunggakan Pelanggan. All rights reserved.</span>
              <span>UID Sumatera Utara &nbsp;·&nbsp; Version 1.0.0</span>
            </footer>
          </DashboardShell>
        </SidebarProvider>
      </ToastProvider>
    </div>
  )
}
