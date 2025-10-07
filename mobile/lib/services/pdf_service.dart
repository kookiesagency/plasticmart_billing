import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../models/invoice.dart';
import '../models/invoice_item.dart';

class PdfService {
  /// Generate invoice PDF document
  Future<pw.Document> generateInvoicePdf({
    required Invoice invoice,
    required List<InvoiceItem> items,
  }) async {
    final pdf = pw.Document();

    // Calculate totals
    final subTotal = items.fold<double>(
      0,
      (sum, item) => sum + (item.quantity * item.rate),
    );
    final bundleCharge = invoice.bundleCharge != null ? invoice.bundleCharge!.toDouble() : 0.0;
    final totalAmount = subTotal + bundleCharge;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(invoice),
              pw.SizedBox(height: 24),

              // Invoice Info
              _buildInvoiceInfo(invoice),
              pw.SizedBox(height: 24),

              // Items Table
              _buildItemsTable(items),
              pw.SizedBox(height: 16),

              // Totals
              _buildTotals(subTotal, bundleCharge, totalAmount, invoice),
              pw.SizedBox(height: 32),

              // Footer
              pw.Spacer(),
              _buildFooter(),
            ],
          );
        },
      ),
    );

    return pdf;
  }

  /// Build PDF header with invoice title (matching web format)
  pw.Widget _buildHeader(Invoice invoice) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        pw.Text(
          'CASH MEMO',
          style: pw.TextStyle(
            fontSize: 20,
            fontWeight: pw.FontWeight.bold,
            decoration: pw.TextDecoration.underline,
          ),
        ),
      ],
    );
  }

  /// Build invoice information section (matching web format)
  pw.Widget _buildInvoiceInfo(Invoice invoice) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        // Bill To (left side)
        pw.Row(
          children: [
            pw.Text(
              'Bill To: ',
              style: pw.TextStyle(
                fontSize: 12,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.Text(
              invoice.partyName ?? 'Unknown Party',
              style: pw.TextStyle(
                fontSize: 12,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
          ],
        ),

        // Invoice Number and Date (right side)
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Row(
              children: [
                pw.Text(
                  'Invoice #: ',
                  style: pw.TextStyle(
                    fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  invoice.invoiceNumber ?? 'N/A',
                  style: const pw.TextStyle(
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 4),
            pw.Row(
              children: [
                pw.Text(
                  'Date: ',
                  style: pw.TextStyle(
                    fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.Text(
                  _formatDate(invoice.invoiceDate),
                  style: const pw.TextStyle(
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  /// Build items table (matching web format)
  pw.Widget _buildItemsTable(List<InvoiceItem> items) {
    return pw.Table(
      border: pw.TableBorder.symmetric(
        inside: const pw.BorderSide(color: PdfColors.black, width: 0.5),
        outside: const pw.BorderSide(color: PdfColors.black, width: 1),
      ),
      columnWidths: {
        0: const pw.FlexColumnWidth(1), // SR. NO
        1: const pw.FlexColumnWidth(4), // ITEM
        2: const pw.FlexColumnWidth(1), // QTY
        3: const pw.FlexColumnWidth(1), // UNIT
        4: const pw.FlexColumnWidth(1.5), // RATE
        5: const pw.FlexColumnWidth(1.5), // AMOUNT
      },
      children: [
        // Header
        pw.TableRow(
          decoration: const pw.BoxDecoration(
            border: pw.Border(
              top: pw.BorderSide(color: PdfColors.black, width: 1),
              bottom: pw.BorderSide(color: PdfColors.black, width: 1),
            ),
          ),
          children: [
            _buildTableCell('SR. NO', isHeader: true, align: pw.TextAlign.center),
            _buildTableCell('ITEM', isHeader: true),
            _buildTableCell('QTY', isHeader: true),
            _buildTableCell('UNIT', isHeader: true),
            _buildTableCell('RATE', isHeader: true),
            _buildTableCell('AMOUNT', isHeader: true),
          ],
        ),

        // Items
        ...items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          final amount = item.quantity * item.rate;

          return pw.TableRow(
            decoration: const pw.BoxDecoration(
              border: pw.Border(
                bottom: pw.BorderSide(color: PdfColors.grey400, width: 0.5),
              ),
            ),
            children: [
              _buildTableCell('${index + 1}', align: pw.TextAlign.center),
              _buildTableCell(item.itemName ?? 'Unknown Item'),
              _buildTableCell(_formatNumber(item.quantity)),
              _buildTableCell(item.itemUnit ?? 'N/A'),
              _buildTableCell('₹${_formatNumber(item.rate)}'),
              _buildTableCell('₹${_formatNumber(amount)}'),
            ],
          );
        }),
      ],
    );
  }

  /// Build table cell
  pw.Widget _buildTableCell(
    String text, {
    bool isHeader = false,
    pw.TextAlign align = pw.TextAlign.left,
  }) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 10 : 12,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.grey800 : PdfColors.black,
        ),
        textAlign: align,
      ),
    );
  }

  /// Build totals section (matching web format)
  pw.Widget _buildTotals(
    double subTotal,
    double bundleCharge,
    double totalAmount,
    Invoice invoice,
  ) {
    return pw.Table(
      columnWidths: {
        0: const pw.FlexColumnWidth(1),
        1: const pw.FlexColumnWidth(1),
        2: const pw.FlexColumnWidth(1),
      },
      children: [
        // Subtotal
        pw.TableRow(
          children: [
            pw.Container(),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                'Subtotal:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                '₹${_formatNumber(subTotal)}',
                textAlign: pw.TextAlign.right,
                style: const pw.TextStyle(
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        // Bundle
        pw.TableRow(
          children: [
            pw.Container(),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                'Bundle (${invoice.bundleQuantity ?? 0}):',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                '₹${_formatNumber(bundleCharge)}',
                textAlign: pw.TextAlign.right,
                style: const pw.TextStyle(
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        // Total with border
        pw.TableRow(
          decoration: const pw.BoxDecoration(
            border: pw.Border(
              top: pw.BorderSide(color: PdfColors.black, width: 2),
            ),
          ),
          children: [
            pw.Container(),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                'Total:',
                style: pw.TextStyle(
                  fontSize: 16,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(8),
              child: pw.Text(
                '₹${_formatNumber(totalAmount)}',
                textAlign: pw.TextAlign.right,
                style: pw.TextStyle(
                  fontSize: 16,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Build footer (matching web format)
  pw.Widget _buildFooter() {
    return pw.Column(
      children: [
        pw.Divider(color: PdfColors.grey600),
        pw.SizedBox(height: 8),
        pw.Text(
          'This is a computer-generated cash memo.',
          textAlign: pw.TextAlign.center,
          style: const pw.TextStyle(
            fontSize: 10,
            color: PdfColors.grey600,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          'Thank you for your business!',
          textAlign: pw.TextAlign.center,
          style: const pw.TextStyle(
            fontSize: 10,
            color: PdfColors.grey600,
          ),
        ),
      ],
    );
  }

  /// Preview PDF
  Future<void> previewPdf({
    required Invoice invoice,
    required List<InvoiceItem> items,
  }) async {
    final pdf = await generateInvoicePdf(invoice: invoice, items: items);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
    );
  }

  /// Download PDF to device
  Future<String?> downloadPdf({
    required Invoice invoice,
    required List<InvoiceItem> items,
  }) async {
    try {
      final pdf = await generateInvoicePdf(invoice: invoice, items: items);
      final bytes = await pdf.save();

      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'Invoice_${invoice.invoiceNumber ?? DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File('${directory.path}/$fileName');

      await file.writeAsBytes(bytes);
      return file.path;
    } catch (e) {
      print('Error downloading PDF: $e');
      return null;
    }
  }

  /// Share PDF
  Future<void> sharePdf({
    required Invoice invoice,
    required List<InvoiceItem> items,
  }) async {
    try {
      final pdf = await generateInvoicePdf(invoice: invoice, items: items);
      final bytes = await pdf.save();

      final directory = await getTemporaryDirectory();
      final fileName = 'Invoice_${invoice.invoiceNumber ?? DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File('${directory.path}/$fileName');

      await file.writeAsBytes(bytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Invoice #${invoice.invoiceNumber ?? 'N/A'} for ${invoice.partyName ?? 'Party'}',
      );
    } catch (e) {
      print('Error sharing PDF: $e');
    }
  }

  /// Format date for display
  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return dateString;
    }
  }

  /// Format datetime for display
  String _formatDateTime(String dateTimeString) {
    try {
      final dateTime = DateTime.parse(dateTimeString);
      return DateFormat('dd MMM yyyy, hh:mm a').format(dateTime);
    } catch (e) {
      return dateTimeString;
    }
  }

  /// Format number - remove decimals if whole number
  String _formatNumber(double number) {
    if (number == number.roundToDouble()) {
      return number.toInt().toString();
    }
    return number.toStringAsFixed(2);
  }
}
