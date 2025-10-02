import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "PlasticMart",
  description: "Invoice management for PlasticMart",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-gray-50">
      <TooltipProvider>
        {children}
      </TooltipProvider>
      <Toaster richColors />
    </div>
  );
}