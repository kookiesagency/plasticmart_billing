import 'dart:io';
import 'dart:ui';
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

    // Load font that supports Rupee symbol
    final font = await PdfGoogleFonts.notoSansRegular();
    final fontBold = await PdfGoogleFonts.notoSansBold();

    // Calculate totals
    final subTotal = items.fold<double>(
      0,
      (sum, item) => sum + (item.quantity * item.rate),
    );
    final bundleCharge = invoice.bundleCharge != null ? invoice.bundleCharge!.toDouble() : 0.0;
    final totalAmount = subTotal + bundleCharge;

    // Calculate 65% of available width (after margins)
    final contentWidth = (PdfPageFormat.a4.width - 40) * 0.65; // 40 = margins (20 on each side)

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(20),
        theme: pw.ThemeData.withFont(
          base: font,
          bold: fontBold,
        ),
        build: (pw.Context context) {
          return [
            // Header - constrained to 50% width
            pw.Container(
              width: contentWidth,
              child: _buildHeader(invoice),
            ),
            pw.SizedBox(height: 8),

            // Invoice Info - constrained to 50% width
            pw.Container(
              width: contentWidth,
              child: _buildInvoiceInfo(invoice),
            ),
            pw.SizedBox(height: 8),

            // Items Table - constrained to 50% width
            pw.Container(
              width: contentWidth,
              child: _buildItemsTable(items),
            ),
            pw.SizedBox(height: 8),

            // Totals - constrained to 50% width
            pw.Container(
              width: contentWidth,
              child: _buildTotals(subTotal, bundleCharge, totalAmount, invoice),
            ),

            // Footer - added at the end instead of in footer callback
            pw.SizedBox(height: 40),
            pw.Container(
              width: contentWidth,
              child: _buildFooter(),
            ),
          ];
        },
      ),
    );

    return pdf;
  }

  /// Build PDF header with invoice title (matching web format)
  pw.Widget _buildHeader(Invoice invoice) {
    return pw.Center(
      child: pw.Text(
        'CASH MEMO',
        style: pw.TextStyle(
          fontSize: 16,
          fontWeight: pw.FontWeight.bold,
          decoration: pw.TextDecoration.underline,
        ),
      ),
    );
  }

  /// Build invoice information section (matching web format)
  pw.Widget _buildInvoiceInfo(Invoice invoice) {
    return pw.Table(
      columnWidths: {
        0: const pw.FlexColumnWidth(1), // 50% - Bill To
        1: const pw.FlexColumnWidth(1), // 50% - Invoice # and Date
      },
      children: [
        pw.TableRow(
          children: [
            // Left column - Bill To
            pw.Padding(
              padding: const pw.EdgeInsets.all(2),
              child: pw.RichText(
                text: pw.TextSpan(
                  children: [
                    pw.TextSpan(
                      text: 'Bill To: ',
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.TextSpan(
                      text: invoice.partyName ?? 'Unknown Party',
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Right column - Invoice # and Date
            pw.Padding(
              padding: const pw.EdgeInsets.all(2),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Invoice #: ',
                          style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.TextSpan(
                          text: invoice.invoiceNumber ?? 'N/A',
                          style: const pw.TextStyle(
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 1),
                  pw.RichText(
                    text: pw.TextSpan(
                      children: [
                        pw.TextSpan(
                          text: 'Date: ',
                          style: pw.TextStyle(
                            fontSize: 10,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.TextSpan(
                          text: _formatDate(invoice.invoiceDate),
                          style: const pw.TextStyle(
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Build items table (matching web format)
  pw.Widget _buildItemsTable(List<InvoiceItem> items) {
    return pw.Table(
      columnWidths: {
        0: const pw.FlexColumnWidth(10), // NO - 10%
        1: const pw.FlexColumnWidth(40), // ITEM - 40%
        2: const pw.FlexColumnWidth(10), // QTY - 10%
        3: const pw.FlexColumnWidth(10), // UNIT - 10%
        4: const pw.FlexColumnWidth(15), // RATE - 15%
        5: const pw.FlexColumnWidth(15), // AMOUNT - 15%
      },
      children: [
        // Header - with top and bottom border only
        pw.TableRow(
          decoration: const pw.BoxDecoration(
            border: pw.Border(
              top: pw.BorderSide(color: PdfColors.grey800, width: 1),
              bottom: pw.BorderSide(color: PdfColors.grey800, width: 1),
            ),
          ),
          children: [
            _buildTableCell('NO', isHeader: true, align: pw.TextAlign.center),
            _buildTableCell('ITEM', isHeader: true, align: pw.TextAlign.left),
            _buildTableCell('QTY', isHeader: true, align: pw.TextAlign.left),
            _buildTableCell('UNIT', isHeader: true, align: pw.TextAlign.left),
            _buildTableCell('RATE', isHeader: true, align: pw.TextAlign.left),
            _buildTableCell('AMOUNT', isHeader: true, align: pw.TextAlign.left),
          ],
        ),

        // Items - with bottom border only
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
              _buildTableCell(item.itemName ?? 'Unknown Item', align: pw.TextAlign.left),
              _buildTableCell(_formatNumber(item.quantity), align: pw.TextAlign.left),
              _buildTableCell(item.itemUnit ?? 'N/A', align: pw.TextAlign.left),
              _buildTableCell('₹${_formatNumber(item.rate)}', align: pw.TextAlign.left),
              _buildTableCell('₹${_formatNumber(amount)}', align: pw.TextAlign.left),
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
      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: 10,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
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
        0: const pw.FlexColumnWidth(2), // 50% - empty space
        1: const pw.FlexColumnWidth(1), // 25% - label
        2: const pw.FlexColumnWidth(1), // 25% - value
      },
      children: [
        // Subtotal
        pw.TableRow(
          children: [
            pw.Container(), // Empty left column
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: pw.Text(
                'Subtotal:',
                style: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: pw.Text(
                '₹${_formatNumber(subTotal)}',
                textAlign: pw.TextAlign.right,
                style: const pw.TextStyle(
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        // Bundle
        pw.TableRow(
          children: [
            pw.Container(), // Empty left column
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: pw.Text(
                'Bundle (${_formatNumber((invoice.bundleQuantity ?? 0).toDouble())}):',
                style: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: pw.Text(
                '₹${_formatNumber(bundleCharge)}',
                textAlign: pw.TextAlign.right,
                style: const pw.TextStyle(
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        // Total with border
        pw.TableRow(
          children: [
            pw.Container(), // Empty left column
            pw.Container(
              decoration: const pw.BoxDecoration(
                border: pw.Border(
                  top: pw.BorderSide(color: PdfColors.black, width: 2),
                ),
              ),
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
              child: pw.Text(
                'Total:',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ),
            pw.Container(
              decoration: const pw.BoxDecoration(
                border: pw.Border(
                  top: pw.BorderSide(color: PdfColors.black, width: 2),
                ),
              ),
              padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
              child: pw.Text(
                '₹${_formatNumber(totalAmount)}',
                textAlign: pw.TextAlign.right,
                style: pw.TextStyle(
                  fontSize: 12,
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
    return pw.Container(
      decoration: const pw.BoxDecoration(
        border: pw.Border(
          top: pw.BorderSide(color: PdfColors.grey400, width: 0.5),
        ),
      ),
      padding: const pw.EdgeInsets.only(top: 12),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        children: [
          pw.Center(
            child: pw.Text(
              'This is a computer-generated cash memo.',
              textAlign: pw.TextAlign.center,
              style: const pw.TextStyle(
                fontSize: 9, // text-xs in Tailwind is 12px
                color: PdfColors.grey600,
              ),
            ),
          ),
          pw.Center(
            child: pw.Text(
              'Thank you for your business!',
              textAlign: pw.TextAlign.center,
              style: const pw.TextStyle(
                fontSize: 9,
                color: PdfColors.grey600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Preview PDF
  Future<void> previewPdf({
    required Invoice invoice,
    required List<InvoiceItem> items,
  }) async {
    final pdf = await generateInvoicePdf(invoice: invoice, items: items);

    // Format filename: "{invoice_number} {party_name} {invoice_date}.pdf"
    final invoiceNumber = invoice.invoiceNumber ?? 'N/A';
    final partyName = invoice.partyName ?? 'Unknown';
    final invoiceDate = invoice.invoiceDate != null ? _formatDate(invoice.invoiceDate) : 'Unknown Date';
    final fileName = '$invoiceNumber $partyName $invoiceDate';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: fileName,
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
      // Format filename: "{invoice_number} {party_name} {invoice_date}.pdf"
      final invoiceNumber = invoice.invoiceNumber ?? 'N/A';
      final partyName = invoice.partyName ?? 'Unknown';
      final invoiceDate = invoice.invoiceDate != null ? _formatDate(invoice.invoiceDate) : 'Unknown Date';
      // Sanitize filename - replace invalid characters with underscore
      final sanitizedFileName = '$invoiceNumber $partyName $invoiceDate'.replaceAll(RegExp(r'[/\\:*?"<>|]'), '_');
      final fileName = '$sanitizedFileName.pdf';
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
    Rect? sharePositionOrigin,
  }) async {
    try {
      print('Starting PDF generation for sharing...');
      final pdf = await generateInvoicePdf(invoice: invoice, items: items);
      print('PDF generated, saving bytes...');
      final bytes = await pdf.save();
      print('PDF bytes saved: ${bytes.length} bytes');

      final directory = await getTemporaryDirectory();
      // Format filename: "{invoice_number} {party_name} {invoice_date}.pdf"
      final invoiceNumber = invoice.invoiceNumber ?? 'N/A';
      final partyName = invoice.partyName ?? 'Unknown';
      final invoiceDate = invoice.invoiceDate != null ? _formatDate(invoice.invoiceDate) : 'Unknown Date';
      // Sanitize filename - replace invalid characters with underscore
      final sanitizedFileName = '$invoiceNumber $partyName $invoiceDate'.replaceAll(RegExp(r'[/\\:*?"<>|]'), '_');
      final fileName = '$sanitizedFileName.pdf';
      final file = File('${directory.path}/$fileName');
      print('Temp file path: ${file.path}');

      await file.writeAsBytes(bytes);
      print('File written to disk');

      print('Sharing file...');
      final result = await Share.shareXFiles(
        [XFile(file.path)],
        sharePositionOrigin: sharePositionOrigin,
      );
      print('Share completed: $result');
    } catch (e, stackTrace) {
      print('Error sharing PDF: $e');
      print('Stack trace: $stackTrace');
      rethrow;
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
