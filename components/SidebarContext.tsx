'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  expanded: boolean
  setExpanded: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  expanded: false,
  setExpanded: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
