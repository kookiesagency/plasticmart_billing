import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../providers/party_provider.dart';
import '../../models/party.dart';
import 'party_weekly_report_screen.dart';

class PartiesScreen extends StatefulWidget {
  const PartiesScreen({Key? key}) : super(key: key);

  @override
  State<PartiesScreen> createState() => _PartiesScreenState();
}

class _PartiesScreenState extends State<PartiesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _gstController = TextEditingController();
  final _addressController = TextEditingController();
  Party? _editingParty;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PartyProvider>(context, listen: false).fetchParties();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _gstController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _showAddEditDialog({Party? party}) {
    _editingParty = party;
    _nameController.text = party?.name ?? '';
    _phoneController.text = party?.phone ?? '';
    _emailController.text = party?.email ?? '';
    _gstController.text = party?.gst ?? '';
    _addressController.text = party?.address ?? '';

    final l10n = AppLocalizations.of(context)!;

    showDialog(
      context: context,
      builder: (dialogContext) {
        final dialogL10n = AppLocalizations.of(dialogContext)!;
        return AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(party == null ? dialogL10n.parties_createParty : dialogL10n.parties_editParty),
        content: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: dialogL10n.parties_partyName,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.person_outline),
                  ),
                  textCapitalization: TextCapitalization.words,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return dialogL10n.validation_nameRequired;
                    }
                    return null;
                  },
                  autofocus: true,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phoneController,
                  decoration: InputDecoration(
                    labelText: dialogL10n.parties_phone,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _gstController,
                  decoration: const InputDecoration(
                    labelText: 'GST',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.numbers),
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _addressController,
                  decoration: InputDecoration(
                    labelText: dialogL10n.parties_address,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.location_on_outlined),
                  ),
                  maxLines: 3,
                  textCapitalization: TextCapitalization.words,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(dialogL10n.common_cancel),
          ),
          ElevatedButton(
            onPressed: () => _saveParty(),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(dialogL10n.common_save, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ],
      );
      },
    );
  }

  Future<void> _saveParty() async {
    if (!_formKey.currentState!.validate()) return;

    final partyProvider = Provider.of<PartyProvider>(context, listen: false);

    bool success;
    if (_editingParty == null) {
      success = await partyProvider.createParty(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        gst: _gstController.text.trim().isEmpty ? null : _gstController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
      );
    } else {
      success = await partyProvider.updateParty(
        id: _editingParty!.id!,
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        gst: _gstController.text.trim().isEmpty ? null : _gstController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
      );
    }

    if (!mounted) return;

    final l10n = AppLocalizations.of(context)!;

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.parties_saveSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _clearForm();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(partyProvider.errorMessage ?? l10n.parties_saveFailed),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _clearForm() {
    _nameController.clear();
    _phoneController.clear();
    _emailController.clear();
    _gstController.clear();
    _addressController.clear();
    _editingParty = null;
  }

  Future<void> _deleteParty(int id) async {
    final l10n = AppLocalizations.of(context)!;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        final dialogL10n = AppLocalizations.of(dialogContext)!;
        return AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        icon: const Icon(Icons.warning_amber_rounded, size: 48, color: Colors.orange),
        title: Text(dialogL10n.parties_deleteParty),
        content: Text(dialogL10n.common_areYouSure),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(dialogL10n.common_cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(dialogL10n.common_delete, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ],
      );
      },
    );

    if (confirm != true) return;

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

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.parties_title, style: const TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          IconButton.filledTonal(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(),
            tooltip: l10n.parties_createParty,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<PartyProvider>(
        builder: (context, partyProvider, child) {
          if (partyProvider.isLoading && partyProvider.parties.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (partyProvider.parties.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.people_outlined,
                    size: 80,
                    color: colorScheme.primary.withOpacity(0.3),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    l10n.parties_noPartiesYet,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.parties_createFirstParty,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => _showAddEditDialog(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(l10n.parties_createFirstParty, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => partyProvider.fetchParties(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: partyProvider.parties.length,
              itemBuilder: (context, index) {
                final party = partyProvider.parties[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    onTap: () {
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
                    leading: CircleAvatar(
                      backgroundColor: colorScheme.primaryContainer,
                      foregroundColor: colorScheme.onPrimaryContainer,
                      radius: 24,
                      child: Text(
                        party.name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    title: Text(
                      party.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (party.phone != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.phone_outlined, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                party.phone!,
                                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ],
                        if (party.email != null) ...[
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(Icons.email_outlined, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                party.email!,
                                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ],
                        if (party.gst != null) ...[
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(Icons.numbers, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              const Text(
                                'GST: ',
                                style: TextStyle(fontSize: 13, color: Colors.grey),
                              ),
                              Text(
                                party.gst!,
                                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(Icons.edit_outlined, color: colorScheme.primary),
                          onPressed: () => _showAddEditDialog(party: party),
                          tooltip: l10n.common_edit,
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outlined, color: Colors.red),
                          onPressed: () => _deleteParty(party.id!),
                          tooltip: l10n.common_delete,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEditDialog(),
        icon: const Icon(Icons.add),
        label: Text(l10n.parties_createParty),
      ),
      ),
    );
  }
}
