import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../../providers/item_category_provider.dart';
import '../../models/item_category.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({Key? key}) : super(key: key);

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _searchQuery = '';
  bool _showDeleted = false;
  ItemCategory? _editingCategory;

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
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);
    await Future.wait([
      categoryProvider.fetchCategories(),
      categoryProvider.fetchDeletedCategories(),
    ]);
  }

  List<ItemCategory> _getFilteredCategories(List<ItemCategory> categories) {
    return categories.where((category) {
      final matchesSearch = category.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesDeletedFilter = _showDeleted ? (category.deletedAt != null) : (category.deletedAt == null);
      return matchesSearch && matchesDeletedFilter;
    }).toList();
  }

  String _formatDate(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  void _showAddEditDialog({ItemCategory? category}) {
    _editingCategory = category;
    _nameController.text = category?.name ?? '';
    _descriptionController.text = category?.description ?? '';

    showDialog(
      context: context,
      builder: (dialogContext) {
        final dialogL10n = AppLocalizations.of(dialogContext)!;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Text(category == null ? dialogL10n.categories_createCategory : dialogL10n.categories_editCategory),
          content: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: dialogL10n.categories_categoryName,
                    hintText: dialogL10n.categories_categoryName,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.category),
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
                  controller: _descriptionController,
                  decoration: InputDecoration(
                    labelText: '${dialogL10n.common_optional}',
                    hintText: dialogL10n.common_optional,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.description),
                  ),
                  maxLines: 2,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(dialogL10n.common_cancel),
            ),
            FilledButton(
              onPressed: () => _saveCategory(),
              child: Text(dialogL10n.common_save),
            ),
          ],
        );
      },
    );
  }

  Future<void> _saveCategory() async {
    if (!_formKey.currentState!.validate()) return;

    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);
    final name = _nameController.text.trim();
    final description = _descriptionController.text.trim();

    try {
      if (_editingCategory == null) {
        await categoryProvider.createCategory(
          name,
          description: description.isEmpty ? null : description,
        );
      } else {
        await categoryProvider.updateCategory(
          _editingCategory!.id!,
          name,
          description: description.isEmpty ? null : description,
        );
      }

      if (!mounted) return;

      final l10n = AppLocalizations.of(context)!;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.categories_saveSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
      _nameController.clear();
      _descriptionController.clear();
      _editingCategory = null;
    } catch (e) {
      if (!mounted) return;
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(categoryProvider.errorMessage ?? l10n.categories_saveFailed),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _restoreCategory(int id) async {
    final categoryProvider = Provider.of<ItemCategoryProvider>(context, listen: false);
    final l10n = AppLocalizations.of(context)!;

    try {
      await categoryProvider.restoreCategory(id);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.categories_restoreSuccess),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.categories_restoreFailed),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoryProvider = Provider.of<ItemCategoryProvider>(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDarkTheme = theme.brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context)!;

    final categories = _showDeleted ? categoryProvider.deletedCategories : categoryProvider.categories;
    final filteredCategories = _getFilteredCategories(categories);

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.categories_title),
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showAddEditDialog(),
              tooltip: l10n.categories_createCategory,
            ),
          ],
        ),
        body: Column(
          children: [
            TabBar(
              controller: _tabController,
              tabs: [
                Tab(text: l10n.categories_active),
                Tab(text: l10n.categories_deleted),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                decoration: InputDecoration(
                  hintText: l10n.categories_searchCategories,
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
              child: categoryProvider.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filteredCategories.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _showDeleted ? Icons.delete_outlined : Icons.category_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _showDeleted ? l10n.categories_noDeletedCategories : l10n.categories_noCategoriesYet,
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
                                  label: Text(l10n.categories_createFirstCategory),
                                ),
                              ],
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadData,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: filteredCategories.length,
                            itemBuilder: (context, index) {
                              final category = filteredCategories[index];
                              return Dismissible(
                                key: Key('category-${category.id}'),
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
                                    builder: (dialogContext) {
                                      final dialogL10n = AppLocalizations.of(dialogContext)!;
                                      return AlertDialog(
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        title: Text(dialogL10n.categories_deleteCategory),
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
                                },
                                onDismissed: (direction) async {
                                  await categoryProvider.deleteCategory(category.id!);
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
                                                category.name,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              if (category.description != null && category.description!.isNotEmpty) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  category.description!,
                                                  style: TextStyle(
                                                    color: theme.textTheme.bodyLarge?.color,
                                                    fontSize: 13,
                                                  ),
                                                ),
                                              ],
                                              if (category.createdAt != null) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  '${l10n.settings_createdOn} ${_formatDate(category.createdAt!)}',
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
                                                onPressed: () => _restoreCategory(category.id!),
                                                tooltip: l10n.parties_restoreTooltip,
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                              )
                                            : IconButton(
                                                icon: Icon(Icons.edit_outlined, color: colorScheme.primary, size: 22),
                                                onPressed: () => _showAddEditDialog(category: category),
                                                tooltip: l10n.common_edit,
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
