import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { HeaderProvider } from '@/components/layout/header-context'
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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