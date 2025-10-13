import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../utils/date_picker_theme.dart';

class InvoiceFilterBottomSheet extends StatefulWidget {
  final DateTime? initialStartDate;
  final DateTime? initialEndDate;
  final List<String> initialStatuses;
  final Function(DateTime?, DateTime?, List<String>) onApply;

  const InvoiceFilterBottomSheet({
    Key? key,
    this.initialStartDate,
    this.initialEndDate,
    this.initialStatuses = const [],
    required this.onApply,
  }) : super(key: key);

  @override
  State<InvoiceFilterBottomSheet> createState() => _InvoiceFilterBottomSheetState();
}

class _InvoiceFilterBottomSheetState extends State<InvoiceFilterBottomSheet> {
  DateTime? _startDate;
  DateTime? _endDate;
  Set<String> _selectedStatuses = {};

  @override
  void initState() {
    super.initState();
    _startDate = widget.initialStartDate;
    _endDate = widget.initialEndDate;
    _selectedStatuses = Set.from(widget.initialStatuses);
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Not set';
    return DateFormat('dd MMM yyyy').format(date);
  }

  Future<void> _selectStartDate() async {
    final DateTime? picked = await showAppDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked;
        // If end date is before start date, clear it
        if (_endDate != null && _endDate!.isBefore(_startDate!)) {
          _endDate = null;
        }
      });
    }
  }

  Future<void> _selectEndDate() async {
    final DateTime? picked = await showAppDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate ?? DateTime.now(),
      firstDate: _startDate ?? DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  void _toggleStatus(String status) {
    setState(() {
      if (_selectedStatuses.contains(status)) {
        _selectedStatuses.remove(status);
      } else {
        _selectedStatuses.add(status);
      }
    });
  }

  void _clearFilters() {
    setState(() {
      _startDate = null;
      _endDate = null;
      _selectedStatuses.clear();
    });
  }

  void _applyFilters() {
    widget.onApply(_startDate, _endDate, _selectedStatuses.toList());
    Navigator.pop(context);
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return Colors.green;
      case 'pending':
        return Colors.red;
      case 'partial':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context)!;
    final isDarkTheme = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.common_filter,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Date Range Section
          Text(
            'Date Range',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: 12),

          // Start Date
          InkWell(
            onTap: _selectStartDate,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Start Date',
                    style: TextStyle(
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        _formatDate(_startDate),
                        style: TextStyle(
                          color: _startDate == null
                              ? Colors.grey
                              : theme.textTheme.bodyLarge?.color,
                          fontWeight: _startDate == null ? FontWeight.normal : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.calendar_today,
                        size: 18,
                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // End Date
          InkWell(
            onTap: _selectEndDate,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'End Date',
                    style: TextStyle(
                      color: theme.textTheme.bodyLarge?.color,
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        _formatDate(_endDate),
                        style: TextStyle(
                          color: _endDate == null
                              ? Colors.grey
                              : theme.textTheme.bodyLarge?.color,
                          fontWeight: _endDate == null ? FontWeight.normal : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.calendar_today,
                        size: 18,
                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Payment Status Section
          Text(
            l10n.invoices_paymentStatus,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: 12),

          // Status Chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['Paid', 'Pending', 'Partial'].map((status) {
              final isSelected = _selectedStatuses.contains(status);
              final statusColor = _getStatusColor(status);

              return FilterChip(
                label: Text(
                  status == 'Paid' ? l10n.invoices_paid :
                  status == 'Pending' ? l10n.invoices_pending :
                  l10n.invoices_partial,
                  style: TextStyle(
                    color: isSelected ? Colors.white : statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                selected: isSelected,
                onSelected: (_) => _toggleStatus(status),
                backgroundColor: statusColor.withOpacity(0.1),
                selectedColor: statusColor,
                checkmarkColor: Colors.white,
                side: BorderSide(
                  color: isSelected ? statusColor : statusColor.withOpacity(0.3),
                  width: 1.5,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: isDarkTheme
                        ? const Color(0xFF1E293B) // Darker slate to match Share button
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDarkTheme
                          ? const Color(0xFF334155) // Subtle border
                          : Colors.grey.shade300,
                      width: 1,
                    ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _clearFilters,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        alignment: Alignment.center,
                        child: Text(
                          'Clear All',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: isDarkTheme ? Colors.white : Colors.grey.shade800,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF2D7A6E), // Teal/green color matching PDF button
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _applyFilters,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        alignment: Alignment.center,
                        child: const Text(
                          'Apply Filters',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24), // Add bottom padding
        ],
      ),
      ),
    );
  }
}
