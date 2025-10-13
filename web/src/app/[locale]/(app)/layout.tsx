"use client";
import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { HeaderProvider } from '@/components/layout/header-context'
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
      } else {
        setIsAuthenticated(true)
      }
      setLoading(false)
    }
    getSession()
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login')
      } else {
        setIsAuthenticated(true)
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router, supabase])

  if (loading) return null
  if (!isAuthenticated) return null

  return (
    <TooltipProvider>
      <HeaderProvider>
        <div className="relative flex min-h-screen w-full flex-col">
          <Sidebar />
          <div className="flex flex-col md:pl-60">
            <Header />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </HeaderProvider>
    </TooltipProvider>
  );
} 