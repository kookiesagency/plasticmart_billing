import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/purchase_party_provider.dart';
import '../../models/purchase_party.dart';

class PurchasePartiesScreen extends StatefulWidget {
  const PurchasePartiesScreen({Key? key}) : super(key: key);

  @override
  State<PurchasePartiesScreen> createState() => _PurchasePartiesScreenState();
}

class _PurchasePartiesScreenState extends State<PurchasePartiesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _partyCodeController = TextEditingController();
  final _nameController = TextEditingController();
  String _searchQuery = '';
  bool _showDeleted = false;
  PurchaseParty? _editingParty;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _showDeleted = _tabController.index == 1;
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _partyCodeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final partyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
    await Future.wait([
      partyProvider.fetchPurchaseParties(),
      partyProvider.fetchDeletedPurchaseParties(),
    ]);
  }

  List<PurchaseParty> _getFilteredParties(List<PurchaseParty> parties) {
    return parties.where((party) {
      final matchesSearch = party.partyCode.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          party.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesDeletedFilter = _showDeleted ? (party.deletedAt != null) : (party.deletedAt == null);
      return matchesSearch && matchesDeletedFilter;
    }).toList();
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  void _showAddEditDialog({PurchaseParty? party}) {
    _editingParty = party;
    _partyCodeController.text = party?.partyCode ?? '';
    _nameController.text = party?.name ?? '';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(party == null ? 'Add Purchase Party' : 'Edit Purchase Party'),
        content: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Party Name',
                  hintText: 'Full party name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.business),
                ),
                textCapitalization: TextCapitalization.words,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a party name';
                  }
                  return null;
                },
                autofocus: true,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _partyCodeController,
                decoration: const InputDecoration(
                  labelText: 'Party Code',
                  hintText: 'e.g., BPN, JY',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.tag),
                ),
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a party code';
                  }
                  if (value.length > 10) {
                    return 'Party code must be less than 10 characters';
                  }
                  if (!RegExp(r'^[A-Z0-9]+$').hasMatch(value.toUpperCase())) {
                    return 'Only letters and numbers allowed';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => _savePurchaseParty(),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _savePurchaseParty() async {
    if (!_formKey.currentState!.validate()) return;

    final partyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);
    final partyCode = _partyCodeController.text.trim().toUpperCase();
    final name = _nameController.text.trim();

    try {
      if (_editingParty == null) {
        await partyProvider.createPurchaseParty(partyCode, name);
      } else {
        await partyProvider.updatePurchaseParty(_editingParty!.id!, partyCode, name);
      }

      if (!mounted) return;

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_editingParty == null
              ? 'Purchase party created successfully'
              : 'Purchase party updated successfully'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _partyCodeController.clear();
      _nameController.clear();
      _editingParty = null;
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(partyProvider.errorMessage ?? 'Failed to save purchase party'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _restorePurchaseParty(int id) async {
    final partyProvider = Provider.of<PurchasePartyProvider>(context, listen: false);

    try {
      await partyProvider.restorePurchaseParty(id);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Purchase party restored successfully'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to restore purchase party'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _navigateToDetails(PurchaseParty party) {
    Navigator.pushNamed(
      context,
      '/purchase-party-details',
      arguments: party,
    );
  }

  @override
  Widget build(BuildContext context) {
    final partyProvider = Provider.of<PurchasePartyProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    final parties = _showDeleted ? partyProvider.deletedPurchaseParties : partyProvider.purchaseParties;
    final filteredParties = _getFilteredParties(parties);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Purchase Parties'),
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showAddEditDialog(),
              tooltip: 'Add Purchase Party',
            ),
          ],
        ),
        body: Column(
          children: [
            TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Active'),
                Tab(text: 'Deleted'),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search purchase parties...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300, width: 1),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: isDarkTheme ? Colors.white.withOpacity(0.2) : Colors.grey.shade300, width: 1),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colorScheme.primary, width: 1),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),
            Expanded(
              child: partyProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filteredParties.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _showDeleted ? Icons.delete_outlined : Icons.business_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _showDeleted ? 'No deleted purchase parties' : 'No purchase parties yet',
                                style: const TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                              if (!_showDeleted) ...[
                                const SizedBox(height: 8),
                                TextButton.icon(
                                  onPressed: () => _showAddEditDialog(),
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add your first purchase party'),
                                ),
                              ],
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: filteredParties.length,
                            itemBuilder: (context, index) {
                              final party = filteredParties[index];
                              return Dismissible(
                                key: Key('party-${party.id}'),
                                direction: _showDeleted ? DismissDirection.none : DismissDirection.endToStart,
                                background: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: const Icon(Icons.delete, color: Colors.white),
                                ),
                                confirmDismiss: (direction) async {
                                  return await showDialog<bool>(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      title: const Text('Delete Purchase Party'),
                                      content: const Text('Are you sure you want to delete this purchase party?'),
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
                                },
                                onDismissed: (direction) async {
                                  await partyProvider.deletePurchaseParty(party.id!);
                                },
                                child: InkWell(
                                  onTap: _showDeleted ? null : () => _navigateToDetails(party),
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: BoxDecoration(
                                      color: theme.cardColor,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: isDarkTheme ? Colors.white.withOpacity(0.1) : Colors.grey.shade200,
                                        width: 1,
                                      ),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                      decoration: BoxDecoration(
                                                        color: colorScheme.primary.withOpacity(0.1),
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: Text(
                                                        party.partyCode,
                                                        style: TextStyle(
                                                          fontFamily: 'monospace',
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 14,
                                                          color: colorScheme.primary,
                                                        ),
                                                      ),
                                                    ),
                                                    if (party.itemCount != null && party.itemCount! > 0) ...[
                                                      const SizedBox(width: 8),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: Colors.blue.shade50,
                                                          borderRadius: BorderRadius.circular(10),
                                                        ),
                                                        child: Text(
                                                          '${party.itemCount} items',
                                                          style: TextStyle(
                                                            fontSize: 11,
                                                            color: Colors.blue.shade700,
                                                            fontWeight: FontWeight.w600,
                                                          ),
                                                        ),
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  party.name,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 16,
                                                  ),
                                                ),
                                                if (party.createdAt != null) ...[
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    'Created on ${_formatDate(party.createdAt!)}',
                                                    style: TextStyle(
                                                      color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          _showDeleted
                                              ? IconButton(
                                                  icon: const Icon(Icons.restore, color: Colors.green, size: 22),
                                                  onPressed: () => _restorePurchaseParty(party.id!),
                                                  tooltip: 'Restore',
                                                  padding: EdgeInsets.zero,
                                                  constraints: const BoxConstraints(),
                                                )
                                              : Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    IconButton(
                                                      icon: Icon(Icons.edit_outlined, color: colorScheme.primary, size: 22),
                                                      onPressed: () => _showAddEditDialog(party: party),
                                                      tooltip: 'Edit',
                                                      padding: EdgeInsets.zero,
                                                      constraints: const BoxConstraints(),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Icon(Icons.chevron_right, color: theme.textTheme.bodySmall?.color?.withOpacity(0.5), size: 22),
                                                  ],
                                                ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
