import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../providers/invoice_provider.dart';
import '../providers/party_provider.dart';
import '../providers/basic_mode_provider.dart';
import '../models/invoice.dart';
import '../theme/theme_helpers.dart';
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
    final basicModeProvider = context.watch<BasicModeProvider>();
    final isBasicMode = basicModeProvider.isBasicMode;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          if (!isBasicMode)
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
            _buildQuickActions(context),

            // Show invoice-related sections only in Full Mode
            if (!isBasicMode) ...[
              const SizedBox(height: 24),
              // Financial Summary Cards
              _buildFinancialSummary(context),
              const SizedBox(height: 24),
              // Payment Status Cards
              _buildPaymentStatus(context),
              const SizedBox(height: 24),
              // Recent Invoices Section
              _buildRecentInvoices(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final basicModeProvider = context.watch<BasicModeProvider>();
    final isBasicMode = basicModeProvider.isBasicMode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.dashboard_quickActions,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        // Show only Add Item and Add Party one by one in Basic Mode
        if (isBasicMode)
          Column(
            children: [
              _buildQuickActionButton(
                context: context,
                icon: Icons.inventory_2_outlined,
                label: l10n.dashboard_addItem,
                color: const Color(0xFF0EA5E9), // Sky blue
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AddEditItemScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              _buildQuickActionButton(
                context: context,
                icon: Icons.people_outlined,
                label: l10n.dashboard_addParty,
                color: const Color(0xFFF59E0B), // Amber/Orange
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AddEditPartyScreen(),
                    ),
                  );
                },
              ),
            ],
          )
        else
          // 2x2 Grid for 4 buttons in Full Mode
          Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _buildQuickActionButton(
                      context: context,
                      icon: Icons.receipt_long_outlined,
                      label: l10n.dashboard_createBill,
                      color: theme.colorScheme.primary,
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
                      label: l10n.dashboard_offlineBill,
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
                      label: l10n.dashboard_addParty,
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
                      label: l10n.dashboard_addItem,
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final surfaceColor = theme.cardColor;
    final backgroundTint = Color.alphaBlend(
      color.withOpacity(isDark ? 0.18 : 0.08),
      surfaceColor,
    );
    final borderColor = color.withOpacity(isDark ? 0.45 : 0.25);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        height: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundTint,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: borderColor,
            width: 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(
              label,
              style: theme.textTheme.titleMedium?.copyWith(
                color: color,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFinancialSummary(BuildContext context) {
    return Consumer2<InvoiceProvider, PartyProvider>(
      builder: (context, invoiceProvider, partyProvider, child) {
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;

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

        final l10n = AppLocalizations.of(context)!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.dashboard_financialSummary,
              style: theme.textTheme.titleMedium?.copyWith(
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
                  title: l10n.dashboard_today,
                  amount: todayRevenue,
                  icon: Icons.today_outlined,
                  color: Colors.blue,
                  isDark: isDark,
                  theme: theme,
                ),
                _buildSummaryCard(
                  title: l10n.dashboard_thisWeek,
                  amount: weekRevenue,
                  icon: Icons.calendar_today_outlined,
                  color: Colors.green,
                  isDark: isDark,
                  theme: theme,
                ),
                _buildSummaryCard(
                  title: l10n.dashboard_thisMonth,
                  amount: monthRevenue,
                  icon: Icons.calendar_month_outlined,
                  color: Colors.purple,
                  isDark: isDark,
                  theme: theme,
                ),
                _buildSummaryCard(
                  title: l10n.dashboard_totalOutstanding,
                  amount: totalOutstanding,
                  icon: Icons.account_balance_wallet_outlined,
                  color: Colors.orange,
                  isDark: isDark,
                  theme: theme,
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
    required bool isDark,
    required ThemeData theme,
  }) {
    final borderColor = theme.cardTheme.shape is RoundedRectangleBorder
        ? (theme.cardTheme.shape as RoundedRectangleBorder).side.color
        : (isDark ? Colors.white24 : Colors.grey.shade200);
    final labelColor =
        isDark ? Colors.grey.shade400 : Colors.grey.shade600;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: ThemeHelpers.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: labelColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '₹${amount.toStringAsFixed(2)}',
            style: theme.textTheme.titleMedium?.copyWith(
              color: color,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentStatus(BuildContext context) {
    return Consumer<InvoiceProvider>(
      builder: (context, invoiceProvider, child) {
        final l10n = AppLocalizations.of(context)!;
        final theme = Theme.of(context);
        final isDark = theme.brightness == Brightness.dark;

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
              l10n.dashboard_paymentStatus,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatusCard(
                    title: l10n.dashboard_paid,
                    count: paidCount,
                    color: Colors.green,
                    icon: Icons.check_circle_outline,
                    theme: theme,
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatusCard(
                    title: l10n.dashboard_pending,
                    count: pendingCount,
                    color: Colors.red,
                    icon: Icons.pending_outlined,
                    theme: theme,
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatusCard(
                    title: l10n.dashboard_partial,
                    count: partialCount,
                    color: Colors.orange,
                    icon: Icons.timelapse_outlined,
                    theme: theme,
                    isDark: isDark,
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
    required ThemeData theme,
    required bool isDark,
  }) {
    final background = Color.alphaBlend(
      color.withOpacity(isDark ? 0.16 : 0.08),
      theme.cardColor,
    );
    final borderColor = color.withOpacity(isDark ? 0.45 : 0.25);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            count.toString(),
            style: theme.textTheme.headlineSmall?.copyWith(
              color: color,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: theme.textTheme.labelLarge?.copyWith(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentInvoices(BuildContext context) {
    return Consumer<InvoiceProvider>(
      builder: (context, invoiceProvider, child) {
        final l10n = AppLocalizations.of(context)!;
        final theme = Theme.of(context);
        final colorScheme = theme.colorScheme;
        final isDark = theme.brightness == Brightness.dark;
        final borderColor = theme.cardTheme.shape is RoundedRectangleBorder
            ? (theme.cardTheme.shape as RoundedRectangleBorder).side.color
            : (isDark ? Colors.white24 : Colors.grey.shade200);
        final subtitleColor =
            isDark ? Colors.grey.shade400 : Colors.grey.shade600;

        final recentInvoices = invoiceProvider.invoices.take(5).toList();

        if (recentInvoices.isEmpty) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor, width: 1),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.receipt_long_outlined,
                    size: 48,
                    color: subtitleColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    l10n.dashboard_noInvoicesYet,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: subtitleColor,
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
                  l10n.dashboard_recentInvoices,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextButton(
                  onPressed: () => widget.onSwitchToTab?.call(1),
                  child: Text(l10n.dashboard_viewAll),
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
                return _buildRecentInvoiceCard(
                  context: context,
                  invoice: invoice,
                  theme: theme,
                  borderColor: borderColor,
                  subtitleColor: subtitleColor,
                  colorScheme: colorScheme,
                );
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildRecentInvoiceCard({
    required BuildContext context,
    required Invoice invoice,
    required ThemeData theme,
    required Color borderColor,
    required Color subtitleColor,
    required ColorScheme colorScheme,
  }) {
    final l10n = AppLocalizations.of(context)!;
    Color statusColor;
    String statusText;

    switch (invoice.status) {
      case 'paid':
        statusColor = Colors.green;
        statusText = l10n.dashboard_paid;
        break;
      case 'partial':
        statusColor = Colors.orange;
        statusText = l10n.dashboard_partial;
        break;
      default:
        statusColor = Colors.red;
        statusText = l10n.dashboard_pending;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: ThemeHelpers.cardDecoration(context),
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
                      invoice.partyName ?? l10n.dashboard_unknownParty,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
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
                            color: theme.brightness == Brightness.dark
                                ? const Color(0xFF7C2D12).withOpacity(0.25)
                                : const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            l10n.dashboard_offline,
                            style: const TextStyle(
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
                            '${l10n.dashboard_billNumber}${invoice.invoiceNumber}',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: subtitleColor,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 4),
                        ],
                        Text(
                          invoice.invoiceDate != null
                              ? DateFormat('dd MMM yyyy').format(DateTime.parse(invoice.invoiceDate!))
                              : l10n.dashboard_noDate,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: subtitleColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₹${(invoice.totalAmount ?? 0).toStringAsFixed(2)}',
                    style: theme.textTheme.titleMedium?.copyWith(
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
