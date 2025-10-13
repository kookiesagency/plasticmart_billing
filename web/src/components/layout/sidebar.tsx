'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, Users, Package, Settings, History, FolderTree, UserPlus, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeader } from './header-context'
import { Button } from '../ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/parties', label: 'Parties', icon: Users },
  { href: '/items', label: 'Items', icon: Package },
]

const settingsItems = [
  { href: '/settings', label: 'General Settings', icon: Settings },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/purchase-parties', label: 'Purchase Parties', icon: UserPlus },
  { href: '/logs', label: 'Activity Logs', icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useHeader()
  const router = useRouter()
  const supabase = createClient()

  // Check if any settings route is active
  const isSettingsActive = settingsItems.some(item => pathname === item.href)

  // Auto-expand Settings if on a settings-related page
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsActive)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

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
            <span className="font-butler text-[24px] leading-none">PlasticMart</span>
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

          {/* Settings Section with Sub-items */}
          <div className="w-full">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isSettingsActive && 'bg-muted text-primary'
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1 text-left">Settings</span>
              {isSettingsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {isSettingsOpen && (
              <div className="ml-4 mt-2 flex flex-col gap-2 border-l pl-4">
                {settingsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={isSidebarOpen ? toggleSidebar : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary',
                      pathname === item.href && 'bg-muted text-primary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-background">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
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