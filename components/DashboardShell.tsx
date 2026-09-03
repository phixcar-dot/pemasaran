'use client'

import { useSidebar } from '@/components/SidebarContext'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar()

  return (
    <div
      className="flex flex-col min-h-screen animate-fade-in-content"
      style={{ paddingLeft: expanded ? 240 : 64, transition: 'padding-left 0.25s ease' }}
    >
      {children}
    </div>
  )
}
