import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn(
      "min-h-screen bg-gray-50 font-sans antialiased",
      geist.variable
    )}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster richColors />
    </div>
  );
}
