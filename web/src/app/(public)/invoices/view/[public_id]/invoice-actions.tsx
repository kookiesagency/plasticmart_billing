'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Copy, Share2 } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import { PrintableInvoice } from '@/app/[locale]/(app)/invoices/printable-invoice'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('publicInvoice')
  const pathname = usePathname()

  const handlePrint = () => {
    toast.loading(t('preparingDocument'), { id: "print-toast" });

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
    toast.success(t('linkCopied'))
  }

  const handleShareOnWhatsApp = () => {
    const publicUrl = `${window.location.origin}${pathname}`;
    const message = t('whatsappMessage', { partyName: party_name, invoiceDate: formatDate(invoice_date), publicUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleCopyLink} variant="outline">
        <Copy className="mr-2 h-4 w-4" />
        {t('copyLink')}
      </Button>
      <Button onClick={handleShareOnWhatsApp} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        {t('share')}
      </Button>
      <Button onClick={handlePrint} variant="outline">
        <FileDown className="mr-2 h-4 w-4" />
        {t('download')}
      </Button>
    </div>
  )
} 