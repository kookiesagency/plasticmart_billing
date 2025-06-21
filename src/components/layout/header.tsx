'use client'

import { useHeader } from './header-context'

export function Header() {
  const { title, actions } = useHeader()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  )
} 