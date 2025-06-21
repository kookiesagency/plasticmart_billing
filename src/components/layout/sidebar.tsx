'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Users, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/parties', label: 'Parties', icon: Users },
  { href: '/items', label: 'Items', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-start gap-2 px-4 py-4">
        <Link href="#" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-4">
          <Package className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Plasticmart</span>
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              pathname === item.href && 'bg-muted text-primary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
} 