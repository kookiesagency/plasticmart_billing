'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { InvoicePDF } from '@/app/(app)/invoices/invoice-pdf';
import { Button } from '@/components/ui/button';
import { FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRoot } from 'react-dom/client';
import { PrintableInvoice } from '@/app/(app)/invoices/printable-invoice';
import { type Invoice } from '@/app/(app)/invoices/columns';

type FullInvoice = Invoice & {
  party: { name: string; address?: string; phone?: string; };
  invoice_items: { quantity: number; rate: number; item: { name: string; units: { name: string; abbreviation: string; } } }[];
  sub_total: number;
  bundle_quantity: number;
  bundle_charge: number;
};

export default function PublicInvoicePage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [invoice, setInvoice] = useState<FullInvoice | null>(null);
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!params.id) return;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*, party:parties(*), invoice_items(*, item:items(*, units(*)))')
        .eq('id', params.id)
        .single();
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('*');

      if (invoiceError || settingsError || !invoiceData || !settingsData) {
        toast.error('Failed to fetch invoice data.');
        setInvoice(null);
      } else {
        const sub_total = invoiceData.invoice_items.reduce((acc: number, item: { quantity: number; rate: number; }) => acc + (item.quantity * item.rate), 0);
        const fullInvoiceData = { ...invoiceData, sub_total };
        setInvoice(fullInvoiceData as FullInvoice);
        
        const appSettings = settingsData.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as { [key: string]: string });
        setSettings(appSettings);
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [params.id]);

  const handleDownload = () => {
    window.print();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Copied!");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading invoice...</p></div>;
  }

  if (!invoice) {
    return <div className="flex justify-center items-center h-screen"><p>Invoice not found.</p></div>;
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-end gap-2 mb-4 no-print">
          <Button onClick={handleCopyUrl} variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Copy URL
          </Button>
          <Button onClick={handleDownload}>
            <FileDown className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
        <div className="bg-white shadow-lg printable">
          <InvoicePDF invoice={invoice as any} settings={settings} />
        </div>
      </div>
    </div>
  );
} 