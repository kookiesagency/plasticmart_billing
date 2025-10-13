import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/item.dart';
import '../../providers/item_provider.dart';
import '../../theme/theme_helpers.dart';
import '../../theme/app_button_styles.dart';
import 'add_edit_item_screen.dart';

class ViewItemScreen extends StatelessWidget {
  final Item item;

  const ViewItemScreen({Key? key, required this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.itemView_itemDetails),
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
                color: isDark ? const Color(0xFF3D6B5C) : colorScheme.primary,
                borderRadius: BorderRadius.circular(16),
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
                    AppLocalizations.of(context)!.itemView_pricing,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ThemeHelpers.mutedTextColor(context),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // PCS Rate (always show for DOZ/PCS items)
                  if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS'))
                    _buildInfoCard(
                      context,
                      icon: Icons.inventory_2_outlined,
                      iconColor: const Color(0xFF10B981),
                      title: AppLocalizations.of(context)!.itemView_pcsRate,
                      value: '₹${_getPcsRateValue(item, item.defaultRate)}/PCS',
                    )
                  else
                    _buildInfoCard(
                      context,
                      icon: Icons.currency_rupee,
                      iconColor: const Color(0xFF10B981),
                      title: AppLocalizations.of(context)!.itemView_rate,
                      value: '₹${item.defaultRate.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}',
                    ),
                  const SizedBox(height: 12),
                  // DOZ Rate (always show for DOZ/PCS items)
                  if (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS'))
                    _buildInfoCard(
                      context,
                      icon: Icons.shopping_basket_outlined,
                      iconColor: const Color(0xFF8B5CF6),
                      title: AppLocalizations.of(context)!.itemView_dozRate,
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
                    AppLocalizations.of(context)!.itemView_purchase,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ThemeHelpers.mutedTextColor(context),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPricingCard(
                    context,
                    icon: Icons.shopping_bag_outlined,
                    iconColor: const Color(0xFF3B82F6),
                    title: AppLocalizations.of(context)!.itemView_rate,
                    mainRate: item.purchaseRate != null
                        ? (item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')
                            ? '₹${_getPcsRateValue(item, item.purchaseRate!)}/PCS'
                            : '₹${item.purchaseRate!.toStringAsFixed(2)}${item.unit != null ? '/${item.unit!.name}' : ''}')
                        : AppLocalizations.of(context)!.itemView_notSet,
                    convertedRate: item.purchaseRate != null && item.unit != null && (item.unit!.name.toUpperCase() == 'DOZ' || item.unit!.name.toUpperCase() == 'PCS')
                        ? '₹${_getDozRateValue(item, item.purchaseRate!)}/DOZ'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.business_outlined,
                    iconColor: const Color(0xFF06B6D4),
                    title: AppLocalizations.of(context)!.itemView_purchaseParty,
                    value: item.purchaseParty?.name ?? AppLocalizations.of(context)!.itemView_notSet,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.qr_code_outlined,
                    iconColor: const Color(0xFF8B5CF6),
                    title: AppLocalizations.of(context)!.itemView_partyCode,
                    value: item.purchaseParty?.partyCode ?? AppLocalizations.of(context)!.itemView_notSet,
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
                      AppLocalizations.of(context)!.itemView_partySpecificPrices,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ThemeHelpers.mutedTextColor(context),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...item.itemPartyPrices!.map((partyPrice) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildPartyPriceCard(
                        context,
                        partyName: partyPrice.partyName ?? AppLocalizations.of(context)!.itemView_unknownParty,
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
                    AppLocalizations.of(context)!.itemView_additionalInformation,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ThemeHelpers.mutedTextColor(context),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.straighten_outlined,
                    iconColor: const Color(0xFFF59E0B),
                    title: AppLocalizations.of(context)!.itemView_unit,
                    value: item.unit?.name ?? AppLocalizations.of(context)!.itemView_NA,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoCard(
                    context,
                    icon: Icons.category_outlined,
                    iconColor: const Color(0xFFEC4899),
                    title: AppLocalizations.of(context)!.itemView_category,
                    value: item.itemCategory?.name ?? AppLocalizations.of(context)!.itemView_notSet,
                  ),
                  if (item.createdAt != null) ...[
                    const SizedBox(height: 12),
                    _buildInfoCard(
                      context,
                      icon: Icons.calendar_today_outlined,
                      iconColor: const Color(0xFF8B5CF6),
                      title: AppLocalizations.of(context)!.itemView_createdOn,
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
                    AppLocalizations.of(context)!.itemView_actions,
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: ThemeHelpers.mutedTextColor(context),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
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
                          style: AppButtonStyles.primaryElevated(
                            context,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: Text(
                            AppLocalizations.of(context)!.itemView_edit,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => _showDeleteDialog(context),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            AppLocalizations.of(context)!.itemView_delete,
                            style: const TextStyle(
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
      decoration: ThemeHelpers.cardDecoration(context),
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
                    color: ThemeHelpers.mutedTextColor(context),
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
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: ThemeHelpers.mutedTextColor(context),
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
      decoration: ThemeHelpers.cardDecoration(context),
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
                    color: ThemeHelpers.mutedTextColor(context),
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
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).textTheme.bodyLarge?.color,
                      ),
                    ),
                    if (item.unit != null) ...[
                      const SizedBox(width: 4),
                      Text(
                        '${AppLocalizations.of(context)!.itemView_per} ${item.unit!.name}',
                        style: TextStyle(
                          fontSize: 12,
                          color: ThemeHelpers.mutedTextColor(context),
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
      decoration: ThemeHelpers.cardDecoration(context),
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
                    color: ThemeHelpers.mutedTextColor(context),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  mainRate,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).textTheme.bodyLarge?.color,
                  ),
                ),
                if (convertedRate != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    convertedRate,
                    style: TextStyle(
                      fontSize: 13,
                      color: ThemeHelpers.mutedTextColor(context),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(AppLocalizations.of(context)!.itemView_deleteItemTitle),
        content: Text(AppLocalizations.of(context)!.itemView_deleteItemMessage(item.name)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(AppLocalizations.of(context)!.itemView_cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: Text(AppLocalizations.of(context)!.itemView_delete),
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
          SnackBar(
            content: Text(AppLocalizations.of(context)!.itemView_itemDeletedSuccess),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.itemView_itemDeleteFailed),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
