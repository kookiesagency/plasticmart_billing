import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../providers/basic_mode_provider.dart';
import 'dashboard_tab.dart';
import 'invoices/invoices_screen.dart';
import 'invoices/create_invoice_screen.dart';
import 'invoices/add_offline_bill_screen.dart';
import 'items/items_screen.dart';
import 'items/add_edit_item_screen.dart';
import 'parties/parties_screen.dart';
import 'parties/add_edit_party_screen.dart';
import 'settings/settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  bool _previousBasicMode = false;

  void _switchToTab(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _handleModeChange(bool isBasicMode) {
    // If mode changed, reset to first tab to avoid out of bounds
    if (_previousBasicMode != isBasicMode) {
      setState(() {
        _selectedIndex = 0;
        _previousBasicMode = isBasicMode;
      });
    }
  }

  List<Widget> _getScreens(bool isBasicMode) {
    if (isBasicMode) {
      // Basic Mode: Dashboard, Items, Parties, Settings
      return [
        DashboardTab(onSwitchToTab: _switchToTab),
        const ItemsScreen(),
        const PartiesScreen(),
        const SettingsScreen(),
      ];
    } else {
      // Full Mode: All tabs
      return [
        DashboardTab(onSwitchToTab: _switchToTab),
        const InvoicesScreen(),
        const ItemsScreen(),
        const PartiesScreen(),
        const SettingsScreen(),
      ];
    }
  }

  List<String> _getScreenTitles(BuildContext context, bool isBasicMode) {
    final l10n = AppLocalizations.of(context)!;
    if (isBasicMode) {
      return [
        l10n.dashboard_title,
        l10n.nav_items,
        l10n.nav_parties,
        l10n.nav_settings,
      ];
    } else {
      return [
        l10n.dashboard_title,
        l10n.nav_invoices,
        l10n.nav_items,
        l10n.nav_parties,
        l10n.nav_settings,
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final basicModeProvider = context.watch<BasicModeProvider>();
    final isBasicMode = basicModeProvider.isBasicMode;

    // Handle mode changes
    _handleModeChange(isBasicMode);

    final screens = _getScreens(isBasicMode);
    final titles = _getScreenTitles(context, isBasicMode);

    // Ensure selected index is within bounds
    if (_selectedIndex >= screens.length) {
      _selectedIndex = 0;
    }

    // Calculate the correct tab index for actions
    int itemsTabIndex;
    int partiesTabIndex;
    int billsTabIndex;

    if (isBasicMode) {
      itemsTabIndex = 1;
      partiesTabIndex = 2;
      billsTabIndex = -1; // Not available in basic mode
    } else {
      itemsTabIndex = 2;
      partiesTabIndex = 3;
      billsTabIndex = 1;
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(titles[_selectedIndex]),
        centerTitle: true,
        actions: !isBasicMode && _selectedIndex == billsTabIndex // Invoices tab (only in full mode)
            ? [
                IconButton(
                  onPressed: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AddOfflineBillScreen(),
                      ),
                    );
                    if (result == true && mounted) {
                      // Refresh the invoice list (handled by InvoicesScreen)
                    }
                  },
                  icon: const Icon(Icons.bolt),
                  tooltip: l10n.invoices_createOfflineInvoice,
                ),
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const CreateInvoiceScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.add),
                  tooltip: l10n.invoices_createInvoice,
                ),
              ]
            : _selectedIndex == itemsTabIndex // Items tab
                ? [
                    IconButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const AddEditItemScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.add),
                      tooltip: l10n.items_createItem,
                    ),
                  ]
                : _selectedIndex == partiesTabIndex // Parties tab
                    ? [
                        IconButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const AddEditPartyScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.add),
                          tooltip: l10n.parties_createParty,
                        ),
                      ]
                    : null,
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        behavior: HitTestBehavior.opaque,
        child: screens[_selectedIndex],
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: isBasicMode
            ? [
                BottomNavigationBarItem(
                  icon: const Icon(Icons.home_outlined),
                  label: l10n.nav_dashboard,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.inventory),
                  label: l10n.nav_items,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.people),
                  label: l10n.nav_parties,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.settings),
                  label: l10n.nav_settings,
                ),
              ]
            : [
                BottomNavigationBarItem(
                  icon: const Icon(Icons.home_outlined),
                  label: l10n.nav_dashboard,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.receipt),
                  label: l10n.nav_invoices,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.inventory),
                  label: l10n.nav_items,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.people),
                  label: l10n.nav_parties,
                ),
                BottomNavigationBarItem(
                  icon: const Icon(Icons.settings),
                  label: l10n.nav_settings,
                ),
              ],
      ),
    );
  }
}
