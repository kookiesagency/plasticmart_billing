import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { HeaderProvider } from '@/components/layout/header-context'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Billing",
  description: "A smart billing system.",
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
        <HeaderProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Sidebar />
            <div className="flex flex-col sm:pl-60">
              <Header />
              <main className="flex-1 p-6 md:gap-8">
                {children}
              </main>
            </div>
          </div>
        </HeaderProvider>
        <Toaster />
      </body>
    </html>
  );
}
