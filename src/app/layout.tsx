import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { HeaderProvider } from '@/components/layout/header-context'
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Billing",
  description: "A smart billing system.",
  icons: {
    icon: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          geistSans.variable
        )}
      >
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
        <Toaster />
      </body>
    </html>
  );
}
