import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/item.dart';
import '../../providers/item_provider.dart';
import 'add_edit_item_screen.dart';

class ViewItemScreen extends StatelessWidget {
  final Item item;

  const ViewItemScreen({Key? key, required this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Item Details'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card with Item Name
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    colorScheme.primary,
                    colorScheme.primary.withOpacity(0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: colorScheme.primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Text(
                item.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 22,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            // Pricing Information
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pricing',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // PCS Rate (always show for DOZ/PCS items)
                  if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS'))
                    _buildInfoCard(
                      context,
                      icon: Icons.inventory_2_outlined,
                      iconColor: const Color(0xFF10B981),
                      title: 'PCS Rate',
                      value: '₹${_getPcsRateValue(item, item.defaultRate)}/PCS',
                    )
                  else
                    _buildInfoCard(
                      context,
                      icon: Icons.currency_rupee,
                      iconColor: const Color(0xFF10B981),
                      title: 'Rate',
                      value: '₹${item.defaultRate.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}',
                    ),
                  const SizedBox(height: 12),
                  // DOZ Rate (always show for DOZ/PCS items)
                  if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS'))
                    _buildInfoCard(
                      context,
                      icon: Icons.shopping_basket_outlined,
                      iconColor: const Color(0xFF8B5CF6),
                      title: 'DOZ Rate',
                      value: '₹${_getDozRateValue(item, item.defaultRate)}/DOZ',
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Purchase Information
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Purchase',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPricingCard(
                    context,
                    icon: Icons.shopping_bag_outlined,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'Rate',
                    mainRate: item.purchaseRate != null
                        ? (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')
                            ? '₹${_getPcsRateValue(item, item.purchaseRate!)}/PCS'
                            : '₹${item.purchaseRate!.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}')
                        : 'Not set',
                    convertedRate: item.purchaseRate != null && item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')
                        ? '₹${_getDozRateValue(item, item.purchaseRate!)}/DOZ'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.business_outlined,
                    iconColor: const Color(0xFF06B6D4),
                    title: 'Party From',
                    value: item.purchaseParty?.name ?? 'Not set',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Party-Specific Prices
            if (item.itemPartyPrices != null && item.itemPartyPrices!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Party-Specific Prices',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...item.itemPartyPrices!.map((partyPrice) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildPartyPriceCard(
                        context,
                        partyName: partyPrice.partyName ?? 'Unknown Party',
                        price: partyPrice.price,
                      ),
                    )),
                  ],
                ),
              ),

            if (item.itemPartyPrices != null && item.itemPartyPrices!.isNotEmpty)
              const SizedBox(height: 24),

            // Additional Information
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Additional Information',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.straighten_outlined,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Unit',
                    value: item.unit?.name ?? 'N/A',
                  ),
                  if (item.createdAt != null) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      context,
                      icon: Icons.calendar_today_outlined,
                      iconColor: const Color(0xFF8B5CF6),
                      title: 'Created On',
                      value: _formatDate(item.createdAt!),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Actions Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Actions',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AddEditItemScreen(item: item),
                              ),
                            );
                            // Pop back after edit to refresh
                            if (context.mounted) {
                              Navigator.pop(context);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(
                            Icons.edit_outlined,
                            size: 20,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Edit',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _showDeleteDialog(context),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(
                            Icons.delete_outlined,
                            size: 20,
                            color: Colors.white,
                          ),
                          label: const Text(
                            'Delete',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String value,
    String? subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      value,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartyPriceCard(
    BuildContext context, {
    required String partyName,
    required double price,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFEC4899).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.local_offer_outlined,
              color: Color(0xFFEC4899),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  partyName,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '₹${price.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    if (item.unit != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        'per ${item.unit!.name}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String mainRate,
    String? convertedRate,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  mainRate,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                if (convertedRate != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    convertedRate,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getPcsRateValue(Item item, double rate) {
    if (item.unit == null) return rate.toStringAsFixed(2);

    final unitName = item.unit!.name.toUpperCase();
    if (unitName == 'DOZ') {
      final pcsRate = rate / 12;
      return pcsRate.toStringAsFixed(2);
    } else if (unitName == 'PCS') {
      return rate.toStringAsFixed(2);
    }
    return rate.toStringAsFixed(2);
  }

  String _getDozRateValue(Item item, double rate) {
    if (item.unit == null) return rate.toStringAsFixed(2);

    final unitName = item.unit!.name.toUpperCase();
    if (unitName == 'DOZ') {
      return rate.toStringAsFixed(2);
    } else if (unitName == 'PCS') {
      final dozRate = rate * 12;
      return dozRate.toStringAsFixed(2);
    }
    return rate.toStringAsFixed(2);
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _showDeleteDialog(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Delete Item'),
        content: Text('Are you sure you want to delete "${item.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final itemProvider = Provider.of<ItemProvider>(context, listen: false);
      final success = await itemProvider.deleteItem(item.id!);

      if (!context.mounted) return;

      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Item deleted successfully'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to delete item'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
