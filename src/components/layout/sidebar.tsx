'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, FileText, Users, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeader } from './header-context'
import { Button } from '../ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/parties', label: 'Parties', icon: Users },
  { href: '/items', label: 'Items', icon: Package },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useHeader()

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:flex md:translate-x-0',
          {
            'translate-x-0': isSidebarOpen,
            '-translate-x-full': !isSidebarOpen,
          }
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="PlasticMart" width={32} height={32} className="rounded-md" />
            <span>PlasticMart</span>
          </Link>
        </div>
        <nav className="flex flex-col items-start gap-2 px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={isSidebarOpen ? toggleSidebar : undefined}
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
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  )
} 