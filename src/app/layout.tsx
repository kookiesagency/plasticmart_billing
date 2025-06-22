import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
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
          "min-h-screen bg-background font-sans antialiased",
          geist.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
