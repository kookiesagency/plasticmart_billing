import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/invoice_provider.dart';
import '../providers/party_provider.dart';
import '../models/invoice.dart';
import 'invoices/view_invoice_screen.dart';
import 'invoices/create_invoice_screen.dart';
import 'invoices/add_offline_bill_screen.dart';
import 'parties/add_edit_party_screen.dart';
import 'items/add_edit_item_screen.dart';

class DashboardTab extends StatefulWidget {
  final Function(int)? onSwitchToTab;

  const DashboardTab({Key? key, this.onSwitchToTab}) : super(key: key);

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<InvoiceProvider>(context, listen: false).fetchInvoices();
      Provider.of<PartyProvider>(context, listen: false).fetchParties();
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          Provider.of<InvoiceProvider>(context, listen: false).fetchInvoices(),
          Provider.of<PartyProvider>(context, listen: false).fetchParties(),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quick Actions Row
            _buildQuickActions(context, colorScheme),
            const SizedBox(height: 24),

            // Financial Summary Cards
            _buildFinancialSummary(context, colorScheme),
            const SizedBox(height: 24),

            // Payment Status Cards
            _buildPaymentStatus(context, colorScheme),
            const SizedBox(height: 24),

            // Recent Invoices Section
            _buildRecentInvoices(context, colorScheme),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, ColorScheme colorScheme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        // 2x2 Grid for 4 buttons
        Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionButton(
                    context: context,
                    icon: Icons.receipt_long_outlined,
                    label: 'Create Bill',
                    color: colorScheme.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const CreateInvoiceScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickActionButton(
                    context: context,
                    icon: Icons.bolt,
                    label: 'Offline Bill',
                    color: Colors.orange,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AddOfflineBillScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionButton(
                    context: context,
                    icon: Icons.people_outlined,
                    label: 'Add Party',
                    color: Colors.green,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AddEditPartyScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildQuickActionButton(
                    context: context,
                    icon: Icons.inventory_2_outlined,
                    label: 'Add Item',
                    color: Colors.purple,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AddEditItemScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFinancialSummary(BuildContext context, ColorScheme colorScheme) {
    return Consumer2<InvoiceProvider, PartyProvider>(
      builder: (context, invoiceProvider, partyProvider, child) {
        final invoices = invoiceProvider.invoices;
        final parties = partyProvider.parties;

        // Calculate metrics
        final now = DateTime.now();
        final todayStart = DateTime(now.year, now.month, now.day);
        // Week starts on Monday (to match common business week)
        final weekStart = DateTime(now.year, now.month, now.day).subtract(
          Duration(days: now.weekday - 1),
        );
        final monthStart = DateTime(now.year, now.month, 1);

        double todayRevenue = 0;
        double weekRevenue = 0;
        double monthRevenue = 0;
        double totalBilled = 0;
        double totalReceived = 0;

        for (var invoice in invoices) {
          final createdAt = invoice.createdAt;
          final amount = invoice.totalAmount ?? 0;
          final paid = invoice.totalPaid ?? 0;

          if (createdAt != null) {
            // Normalize to date only (remove time component)
            final dateOnly = DateTime(createdAt.year, createdAt.month, createdAt.day);

            // Today's revenue (created_at == today)
            if (dateOnly.compareTo(todayStart) == 0) {
              todayRevenue += amount;
            }

            // Week's revenue (created_at >= start of week AND <= today)
            if (dateOnly.compareTo(weekStart) >= 0 && dateOnly.compareTo(todayStart) <= 0) {
              weekRevenue += amount;
            }

            // Month's revenue (created_at >= start of month AND <= today)
            if (dateOnly.compareTo(monthStart) >= 0 && dateOnly.compareTo(todayStart) <= 0) {
              monthRevenue += amount;
            }
          }

          // Total billed and received (all invoices)
          totalBilled += amount;
          totalReceived += paid;
        }

        // Calculate opening balance from all parties
        double totalOpeningBalance = 0;
        for (var party in parties) {
          totalOpeningBalance += party.openingBalance ?? 0;
        }

        // Total outstanding = opening_balance + total_billed - total_received
        final totalOutstanding = totalOpeningBalance + totalBilled - totalReceived;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Financial Summary',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _buildSummaryCard(
                  title: 'Today',
                  amount: todayRevenue,
                  icon: Icons.today_outlined,
                  color: Colors.blue,
                ),
                _buildSummaryCard(
                  title: 'This Week',
                  amount: weekRevenue,
                  icon: Icons.calendar_today_outlined,
                  color: Colors.green,
                ),
                _buildSummaryCard(
                  title: 'This Month',
                  amount: monthRevenue,
                  icon: Icons.calendar_month_outlined,
                  color: Colors.purple,
                ),
                _buildSummaryCard(
                  title: 'Outstanding',
                  amount: totalOutstanding,
                  icon: Icons.account_balance_wallet_outlined,
                  color: Colors.orange,
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required double amount,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '₹${amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStatus(BuildContext context, ColorScheme colorScheme) {
    return Consumer<InvoiceProvider>(
      builder: (context, invoiceProvider, child) {
        final invoices = invoiceProvider.invoices;

        int paidCount = 0;
        int pendingCount = 0;
        int partialCount = 0;

        for (var invoice in invoices) {
          if (invoice.status == 'paid') {
            paidCount++;
          } else if (invoice.status == 'pending') {
            pendingCount++;
          } else if (invoice.status == 'partial') {
            partialCount++;
          }
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Status',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatusCard(
                    title: 'Paid',
                    count: paidCount,
                    color: Colors.green,
                    icon: Icons.check_circle_outline,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatusCard(
                    title: 'Pending',
                    count: pendingCount,
                    color: Colors.red,
                    icon: Icons.pending_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatusCard(
                    title: 'Partial',
                    count: partialCount,
                    color: Colors.orange,
                    icon: Icons.timelapse_outlined,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatusCard({
    required String title,
    required int count,
    required Color color,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            count.toString(),
            style: TextStyle(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentInvoices(BuildContext context, ColorScheme colorScheme) {
    return Consumer<InvoiceProvider>(
      builder: (context, invoiceProvider, child) {
        final recentInvoices = invoiceProvider.invoices.take(5).toList();

        if (recentInvoices.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.grey.shade200,
                width: 1,
              ),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.receipt_long_outlined,
                    size: 48,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No invoices yet',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Invoices',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    // Switch to Bills tab (index 1)
                    widget.onSwitchToTab?.call(1);
                  },
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recentInvoices.length,
              itemBuilder: (context, index) {
                final invoice = recentInvoices[index];
                return _buildRecentInvoiceCard(invoice, colorScheme);
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildRecentInvoiceCard(Invoice invoice, ColorScheme colorScheme) {
    Color statusColor;
    String statusText;

    switch (invoice.status) {
      case 'paid':
        statusColor = Colors.green;
        statusText = 'Paid';
        break;
      case 'partial':
        statusColor = Colors.orange;
        statusText = 'Partial';
        break;
      default:
        statusColor = Colors.red;
        statusText = 'Pending';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ViewInvoiceScreen(invoiceId: invoice.id!),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      invoice.partyName ?? 'Unknown Party',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      if (invoice.isOffline == true) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED), // bg-orange-100
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'OFFLINE',
                            style: TextStyle(
                              color: Color(0xFFC2410C), // text-orange-700
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                      ],
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusText,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (invoice.invoiceNumber != null) ...[
                          Text(
                            'Bill #${invoice.invoiceNumber}',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                        Text(
                          invoice.invoiceDate != null
                              ? DateFormat('dd MMM yyyy').format(DateTime.parse(invoice.invoiceDate!))
                              : 'No date',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₹${(invoice.totalAmount ?? 0).toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
