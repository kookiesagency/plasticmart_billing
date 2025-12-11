import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50 font-sans antialiased"
    )}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster richColors />
    </div>
  );
}
