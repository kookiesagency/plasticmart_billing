'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import { useParams } from 'next/navigation'
import { Home, FileText, Users, Package, Settings, History, Languages, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeader } from './header-context'
import { Button } from '../ui/button'
import { createClient } from '@/lib/supabase/client'
import { Link, usePathname, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems = [
  { href: '/', key: 'dashboard', icon: Home },
  { href: '/invoices', key: 'invoices', icon: FileText },
  { href: '/parties', key: 'parties', icon: Users },
  { href: '/items', key: 'items', icon: Package },
  { href: '/logs', key: 'activityLogs', icon: History },
  { href: '/settings', key: 'settings', icon: Settings },
]

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useHeader()
  const router = useRouter()
  const supabase = createClient()
  const params = useParams()
  const [isPending, startTransition] = useTransition()
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')

  const currentLocale = params.locale as string
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function onSelectLanguage(locale: string) {
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known locales are used
        pathname,
        { locale }
      )
    })
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
              {tNav(item.key as any)}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-background space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start" disabled={isPending}>
                <Languages className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">{currentLanguage.nativeName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="w-56">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => onSelectLanguage(lang.code)}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", currentLocale === lang.code ? "opacity-100" : "opacity-0")} />
                  <span className="font-medium">{lang.nativeName}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            {tCommon('logout')}
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