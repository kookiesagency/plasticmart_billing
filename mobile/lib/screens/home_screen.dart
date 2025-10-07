import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_mode_provider.dart';
import 'invoices/invoices_screen.dart';
import 'invoices/create_invoice_screen.dart';
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

  static final List<Widget> _basicScreens = [
    const InvoicesScreen(),
    const ItemsScreen(),
    const PartiesScreen(),
    const SettingsScreen(),
  ];

  static final List<Widget> _advancedScreens = [
    const InvoicesScreen(),
    const ItemsScreen(),
    const PartiesScreen(),
    const SettingsScreen(),
  ];

  static const List<String> _screenTitles = [
    'Bills',
    'Items',
    'Parties',
    'Settings',
  ];

  @override
  Widget build(BuildContext context) {
    final appMode = Provider.of<AppModeProvider>(context);
    final screens = appMode.isBasicMode ? _basicScreens : _advancedScreens;

    // Reset index if switching modes and current index is out of bounds
    if (_selectedIndex >= screens.length) {
      _selectedIndex = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_screenTitles[_selectedIndex]),
        actions: _selectedIndex == 0 // Invoices tab
            ? [
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
            : _selectedIndex == 1 // Items tab
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
                : _selectedIndex == 2 // Parties tab
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
