'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface HeaderContextType {
  title: ReactNode | null
  actions: ReactNode | null
  isSidebarOpen: boolean
  setTitle: (title: ReactNode) => void
  setActions: (actions: ReactNode) => void
  toggleSidebar: () => void
  clearHeader: () => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState<ReactNode | null>(null)
  const [actions, setActionsState] = useState<ReactNode | null>(null)
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const setTitle = (newTitle: ReactNode) => setTitleState(newTitle)
  const setActions = (newActions: ReactNode) => setActionsState(newActions)
  const toggleSidebar = () => setSidebarOpen(prev => !prev)
  const clearHeader = () => {
    setTitleState(null)
    setActionsState(null)
  }

  return (
    <HeaderContext.Provider value={{ title, actions, isSidebarOpen, setTitle, setActions, toggleSidebar, clearHeader }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeader() {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  return context
}

export function SetHeader({ title, actions }: { title: ReactNode; actions?: ReactNode }) {
  const { setTitle, setActions, clearHeader } = useHeader()

  useEffect(() => {
    setTitle(title)
    setActions(actions || null)

    return () => {
      clearHeader()
    }
  }, [title, actions, setTitle, setActions, clearHeader])

  return null
} 