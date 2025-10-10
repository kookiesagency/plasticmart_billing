import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/party.dart';
import '../../providers/party_provider.dart';
import '../../theme/app_button_styles.dart';

class AddEditPartyScreen extends StatefulWidget {
  final Party? party;

  const AddEditPartyScreen({Key? key, this.party}) : super(key: key);

  @override
  State<AddEditPartyScreen> createState() => _AddEditPartyScreenState();
}

class _AddEditPartyScreenState extends State<AddEditPartyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _bundleRateController = TextEditingController();
  final _openingBalanceController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.party != null) {
      _nameController.text = widget.party!.name;
      _bundleRateController.text = widget.party!.bundleRate?.toString() ?? '';
      _openingBalanceController.text = widget.party!.openingBalance?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bundleRateController.dispose();
    _openingBalanceController.dispose();
    super.dispose();
  }

  Future<void> _saveParty() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final partyProvider = Provider.of<PartyProvider>(context, listen: false);
    final name = _nameController.text.trim();
    final bundleRate = double.tryParse(_bundleRateController.text.trim());
    final openingBalance = double.tryParse(_openingBalanceController.text.trim());

    bool success;
    if (widget.party != null) {
      success = await partyProvider.updateParty(
        id: widget.party!.id!,
        name: name,
        bundleRate: bundleRate,
        openingBalance: openingBalance,
      );
    } else {
      success = await partyProvider.createParty(
        name: name,
        bundleRate: bundleRate,
        openingBalance: openingBalance,
      );
    }

    if (!mounted) return;

    setState(() => _isSaving = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Party ${widget.party != null ? 'updated' : 'created'} successfully'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(partyProvider.errorMessage ?? 'Failed to save party'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.party != null ? 'Edit Party' : 'Create Party'),
        ),
        body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: 'Party Name',
                hintText: 'e.g., John Doe',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Name is required';
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bundleRateController,
              decoration: InputDecoration(
                labelText: 'Specific Bundle Rate (Optional)',
                hintText: 'Enter bundle rate',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                prefixIcon: const Icon(Icons.currency_rupee),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value != null && value.trim().isNotEmpty) {
                  final number = double.tryParse(value.trim());
                  if (number == null || number < 0) {
                    return 'Please enter a valid positive number';
                  }
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _openingBalanceController,
              decoration: InputDecoration(
                labelText: 'Opening Balance (Optional)',
                hintText: 'Enter opening balance',
                helperText: 'Initial amount owed at the start (can be positive or negative)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                prefixIcon: const Icon(Icons.account_balance_wallet_outlined),
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
              validator: (value) {
                if (value != null && value.trim().isNotEmpty) {
                  final number = double.tryParse(value.trim());
                  if (number == null) {
                    return 'Please enter a valid number';
                  }
                }
                return null;
              },
              textInputAction: TextInputAction.done,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSaving ? null : _saveParty,
              style: AppButtonStyles.primaryElevated(context),
              child: _isSaving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      widget.party != null ? 'Update Party' : 'Create Party',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}
