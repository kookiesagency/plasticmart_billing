import type { Metadata } from "next";
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: "Invoice",
  description: "View your invoice.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50">
      {children}
      <Toaster />
    </div>
  );
} 