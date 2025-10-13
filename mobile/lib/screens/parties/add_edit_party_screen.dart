import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
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

    final l10n = AppLocalizations.of(context)!;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.party != null ? l10n.partyForm_updateSuccess : l10n.partyForm_createSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(partyProvider.errorMessage ?? l10n.partyForm_saveFailed),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.party != null ? l10n.parties_editParty : l10n.parties_createParty),
        ),
        body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: l10n.parties_partyName,
                hintText: l10n.partyForm_nameHint,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                prefixIcon: const Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return l10n.validation_nameRequired;
                }
                return null;
              },
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bundleRateController,
              decoration: InputDecoration(
                labelText: l10n.parties_specificBundleRate,
                hintText: l10n.parties_enterBundleRate,
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
                    return l10n.settings_enterPositiveNumber;
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
                labelText: l10n.parties_openingBalance,
                hintText: l10n.parties_enterOpeningBalance,
                helperText: l10n.parties_openingBalanceHint,
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
                    return l10n.partyForm_enterValidNumber;
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
                      widget.party != null ? l10n.partyForm_updateButton : l10n.partyForm_createButton,
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
