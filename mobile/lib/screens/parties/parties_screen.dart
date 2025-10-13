import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../models/party.dart';
import '../../providers/party_provider.dart';
import 'add_edit_party_screen.dart';
import 'party_weekly_report_screen.dart';

class PartiesScreen extends StatefulWidget {
  const PartiesScreen({Key? key}) : super(key: key);

  @override
  State<PartiesScreen> createState() => _PartiesScreenState();
}

class _PartiesScreenState extends State<PartiesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  bool _showDeleted = false;

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
    super.dispose();
  }

  Future<void> _loadData() async {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    await Future.wait([
      partyProvider.fetchParties(),
      partyProvider.fetchDeletedParties(),
    ]);
  }

  List<Party> _getFilteredParties(List<Party> parties) {
    return parties.where((party) {
      final matchesSearch = party.name.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesSearch;
    }).toList();
  }

  bool _isNewParty(Party party) {
    if (party.createdAt == null) return false;
    final now = DateTime.now();
    final difference = now.difference(party.createdAt!);
    return difference.inHours < 24;
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _showAddEditDialog({Party? party}) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditPartyScreen(party: party),
      ),
    );
    _loadData();
  }

  Future<void> _deleteParty(int id) async {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final success = await partyProvider.deleteParty(id);

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.parties_deleteSuccess : l10n.parties_deleteFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _restoreParty(int id) async {
    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final success = await partyProvider.restoreParty(id);

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.parties_restoreSuccess : l10n.parties_restoreFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _permanentlyDeleteParty(int id) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        final dialogL10n = AppLocalizations.of(dialogContext)!;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text(dialogL10n.parties_permanentDeleteTitle),
          content: Text(dialogL10n.parties_permanentDeleteMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: Text(dialogL10n.common_cancel),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: Text(dialogL10n.parties_permanentDeleteButton),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !mounted) return;

    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final success = await partyProvider.permanentlyDeleteParty(id);

    if (!mounted) return;

    final l10nAfter = AppLocalizations.of(context)!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10nAfter.parties_permanentDeleteSuccess : l10nAfter.parties_permanentDeleteFailed,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final partyProvider = Provider.of<PartyProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    final parties = _showDeleted ? partyProvider.deletedParties : partyProvider.parties;
    final filteredParties = _getFilteredParties(parties);

    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.parties_active),
            Tab(text: l10n.parties_deleted),
          ],
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            decoration: InputDecoration(
              hintText: l10n.parties_searchParties,
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
                            _showDeleted ? Icons.delete_outlined : Icons.people_outlined,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _showDeleted ? l10n.parties_noDeletedParties : l10n.parties_noPartiesYet,
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
                              label: Text(l10n.parties_createFirstParty),
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
                            direction: _showDeleted ? DismissDirection.none : DismissDirection.horizontal,
                            background: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.only(left: 20),
                              decoration: BoxDecoration(
                                color: Colors.blue,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.edit, color: Colors.white),
                            ),
                            secondaryBackground: Container(
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
                              if (direction == DismissDirection.startToEnd) {
                                // Edit action
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => AddEditPartyScreen(party: party),
                                  ),
                                ).then((_) => _loadData());
                                return false;
                              } else {
                                // Delete action
                                return await showDialog<bool>(
                                  context: context,
                                  builder: (dialogContext) {
                                    final dialogL10n = AppLocalizations.of(dialogContext)!;
                                    return AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      title: Text(dialogL10n.parties_deleteParty),
                                      content: Text(dialogL10n.common_areYouSure),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(dialogContext, false),
                                          child: Text(dialogL10n.common_cancel),
                                        ),
                                        FilledButton(
                                          onPressed: () => Navigator.pop(dialogContext, true),
                                          style: FilledButton.styleFrom(
                                            backgroundColor: Colors.red,
                                          ),
                                          child: Text(dialogL10n.common_delete),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              }
                            },
                            onDismissed: (direction) async {
                              if (direction == DismissDirection.endToStart) {
                                await _deleteParty(party.id!);
                              }
                            },
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
                              child: InkWell(
                                onTap: _showDeleted ? null : () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => PartyWeeklyReportScreen(
                                        partyId: party.id!,
                                        partyName: party.name,
                                      ),
                                    ),
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    party.name,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                                ),
                                                if (_isNewParty(party)) ...[
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 2,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: Colors.green,
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Text(
                                                      'NEW',
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Row(
                                              crossAxisAlignment: CrossAxisAlignment.end,
                                              children: [
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      if (party.bundleRate != null) ...[
                                                        Text(
                                                          '${l10n.parties_bundleRateLabel}: ₹${party.bundleRate!.toStringAsFixed(2)}',
                                                          style: TextStyle(
                                                            color: colorScheme.primary,
                                                            fontSize: 13,
                                                          ),
                                                        ),
                                                      ],
                                                      if (party.createdAt != null) ...[
                                                        const SizedBox(height: 4),
                                                        Text(
                                                          '${l10n.parties_createdLabel}: ${_formatDate(party.createdAt!)}',
                                                          style: TextStyle(
                                                            color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                                            fontSize: 12,
                                                          ),
                                                        ),
                                                      ],
                                                    ],
                                                  ),
                                                ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 10,
                                                    vertical: 4,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: colorScheme.primary.withOpacity(0.15),
                                                    borderRadius: BorderRadius.circular(12),
                                                  ),
                                                  child: Text(
                                                    '${party.invoiceCount ?? 0} ${(party.invoiceCount ?? 0) == 1 ? l10n.parties_billsLabel : l10n.parties_billsLabelPlural}',
                                                    style: TextStyle(
                                                      color: colorScheme.primary,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (_showDeleted) ...[
                                        IconButton(
                                          icon: const Icon(Icons.restore, color: Colors.green, size: 22),
                                          onPressed: () => _restoreParty(party.id!),
                                          tooltip: l10n.parties_restoreTooltip,
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_forever, color: Colors.red, size: 22),
                                          onPressed: () => _permanentlyDeleteParty(party.id!),
                                          tooltip: l10n.parties_permanentDeleteTooltip,
                                        ),
                                      ],
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
    );
  }
}
