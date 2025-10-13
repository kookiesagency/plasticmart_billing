import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../providers/unit_provider.dart';
import '../../models/unit.dart';

class UnitsScreen extends StatefulWidget {
  const UnitsScreen({Key? key}) : super(key: key);

  @override
  State<UnitsScreen> createState() => _UnitsScreenState();
}

class _UnitsScreenState extends State<UnitsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  String _searchQuery = '';
  bool _showDeleted = false;
  Unit? _editingUnit;

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
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    await Future.wait([
      unitProvider.fetchUnits(),
      unitProvider.fetchDeletedUnits(),
    ]);
  }

  List<Unit> _getFilteredUnits(List<Unit> units) {
    return units.where((unit) {
      final matchesSearch = unit.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesDeletedFilter = _showDeleted ? (unit.deletedAt != null) : (unit.deletedAt == null);
      return matchesSearch && matchesDeletedFilter;
    }).toList();
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  void _showAddEditDialog({Unit? unit}) {
    final l10n = AppLocalizations.of(context)!;
    _editingUnit = unit;
    _nameController.text = unit?.name ?? '';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(unit == null ? l10n.settings_createUnit : l10n.settings_editUnit),
        content: Form(
          key: _formKey,
          child: TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: l10n.settings_unitName,
              hintText: l10n.settings_unitNameHint,
              border: const OutlineInputBorder(),
              prefixIcon: const Icon(Icons.straighten),
            ),
            textCapitalization: TextCapitalization.characters,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return l10n.settings_pleaseEnterUnitName;
              }
              return null;
            },
            autofocus: true,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.common_cancel),
          ),
          FilledButton(
            onPressed: () => _saveUnit(),
            child: Text(l10n.common_save),
          ),
        ],
      ),
    );
  }

  Future<void> _saveUnit() async {
    if (!_formKey.currentState!.validate()) return;

    final l10n = AppLocalizations.of(context)!;
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    final name = _nameController.text.trim().toUpperCase();

    bool success;
    if (_editingUnit == null) {
      success = await unitProvider.createUnit(name);
    } else {
      success = await unitProvider.updateUnit(_editingUnit!.id!, name);
    }

    if (!mounted) return;

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_editingUnit == null
              ? l10n.settings_unitCreatedSuccess
              : l10n.settings_unitUpdatedSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _nameController.clear();
      _editingUnit = null;
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(unitProvider.errorMessage ?? l10n.settings_failedToSaveUnit),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _restoreUnit(int id) async {
    final l10n = AppLocalizations.of(context)!;
    final unitProvider = Provider.of<UnitProvider>(context, listen: false);
    final success = await unitProvider.restoreUnit(id);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? l10n.settings_unitRestoredSuccess : l10n.settings_failedToRestoreUnit,
        ),
        backgroundColor: success ? Colors.green : Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final unitProvider = Provider.of<UnitProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;

    final units = _showDeleted ? unitProvider.deletedUnits : unitProvider.units;
    final filteredUnits = _getFilteredUnits(units);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.settings_units),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddEditDialog(),
            tooltip: l10n.settings_addUnit,
          ),
        ],
      ),
      body: Column(
        children: [
          TabBar(
            controller: _tabController,
            tabs: [
              Tab(text: l10n.settings_active),
              Tab(text: l10n.settings_deleted),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: l10n.settings_searchUnits,
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
            child: unitProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredUnits.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _showDeleted ? Icons.delete_outlined : Icons.straighten_outlined,
                              size: 64,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _showDeleted ? l10n.settings_noDeletedUnits : l10n.settings_noUnitsYet,
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
                                label: Text(l10n.settings_addFirstUnit),
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredUnits.length,
                          itemBuilder: (context, index) {
                            final unit = filteredUnits[index];
                            return Dismissible(
                              key: Key('unit-${unit.id}'),
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
                                    title: Text(l10n.settings_deleteUnitTitle),
                                    content: Text(l10n.settings_deleteUnitMessage),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context, false),
                                        child: Text(l10n.common_cancel),
                                      ),
                                      FilledButton(
                                        onPressed: () => Navigator.pop(context, true),
                                        style: FilledButton.styleFrom(
                                          backgroundColor: Colors.red,
                                        ),
                                        child: Text(l10n.common_delete),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              onDismissed: (direction) async {
                                await unitProvider.deleteUnit(unit.id!);
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
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              unit.name,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 16,
                                              ),
                                            ),
                                            if (unit.createdAt != null) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                '${l10n.settings_createdOn} ${_formatDate(unit.createdAt!)}',
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
                                              onPressed: () => _restoreUnit(unit.id!),
                                              tooltip: l10n.settings_restore,
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(),
                                            )
                                          : IconButton(
                                              icon: Icon(Icons.edit_outlined, color: colorScheme.primary, size: 22),
                                              onPressed: () => _showAddEditDialog(unit: unit),
                                              tooltip: l10n.settings_edit,
                                              padding: EdgeInsets.zero,
                                              constraints: const BoxConstraints(),
                                            ),
                                    ],
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
