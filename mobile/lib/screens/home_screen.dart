import 'package:flutter/material.dart';
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

  void _switchToTab(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  List<Widget> _getScreens() => [
    DashboardTab(onSwitchToTab: _switchToTab),
    const InvoicesScreen(),
    const ItemsScreen(),
    const PartiesScreen(),
    const SettingsScreen(),
  ];

  static const List<String> _screenTitles = [
    'Dashboard',
    'Bills',
    'Items',
    'Parties',
    'Settings',
  ];

  @override
  Widget build(BuildContext context) {
    final screens = _getScreens();

    return Scaffold(
      appBar: AppBar(
        title: Text(_screenTitles[_selectedIndex]),
        centerTitle: true,
        actions: _selectedIndex == 1 // Invoices tab
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
                  tooltip: 'Offline Bill',
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
                  tooltip: 'Create Bill',
                ),
              ]
            : _selectedIndex == 2 // Items tab
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
                      tooltip: 'Add Item',
                    ),
                  ]
                : _selectedIndex == 3 // Parties tab
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
                          tooltip: 'Add Party',
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
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt),
            label: 'Bills',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory),
            label: 'Items',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Parties',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
