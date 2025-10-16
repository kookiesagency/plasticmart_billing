'use client'

import { Button } from '@/components/ui/button'
import { FileDown, Share2 } from 'lucide-react'
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
    const originalTitle = document.title;
    document.title = `${party_name} ${invoice_date}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  }

  const handleShareOnWhatsApp = () => {
    // Use environment variable for public URL in production, fallback to current origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const publicUrl = `${baseUrl}${pathname}`;
    const message = t('whatsappMessage').replace('{partyName}', party_name).replace('{invoiceDate}', formatDate(invoice_date)).replace('{publicUrl}', publicUrl);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
      <Button onClick={handleShareOnWhatsApp} variant="outline" size="sm" className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3">
        <Share2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">{t('share')}</span>
        <span className="xs:hidden">Share</span>
      </Button>
      <Button onClick={handlePrint} variant="outline" size="sm" className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3">
        <FileDown className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden xs:inline">{t('download')}</span>
        <span className="xs:hidden">PDF</span>
      </Button>
    </div>
  )
} 