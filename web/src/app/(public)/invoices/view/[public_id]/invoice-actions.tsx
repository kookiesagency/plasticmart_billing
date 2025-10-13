'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Copy, Share2 } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { PrintableInvoice } from '@/app/[locale]/(app)/invoices/printable-invoice'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export function InvoiceActions({
  invoiceId,
  party_name,
  invoice_date,
}: {
  invoiceId: number
  party_name: string
  invoice_date: string
}) {
  const pathname = usePathname()

  const handlePrint = () => {
    toast.loading("Preparing document...", { id: "print-toast" });

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    
    const cleanup = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      toast.dismiss("print-toast");
    };

    const onReady = () => {
      const originalTitle = document.title;
      document.title = `${party_name} ${invoice_date}`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
        cleanup();
      }, 100);
    };

    root.render(
      <div className="printable-area">
        <PrintableInvoice invoiceId={invoiceId} onReady={onReady} />
      </div>
    );
  }

  const handleCopyLink = () => {
    const publicUrl = `${window.location.origin}${pathname}`
    navigator.clipboard.writeText(publicUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleShareOnWhatsApp = () => {
    const publicUrl = `${window.location.origin}${pathname}`;
    const message = `*Hello ${party_name}*,\n\nHere is your invoice from *${formatDate(invoice_date)}*.\n\nYou can view it here: ${publicUrl}\n\nThank you for your business!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleCopyLink} variant="outline">
        <Copy className="mr-2 h-4 w-4" />
        Copy Link
      </Button>
      <Button onClick={handleShareOnWhatsApp} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      <Button onClick={handlePrint} variant="outline">
        <FileDown className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  )
} 