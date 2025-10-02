import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_mode_provider.dart';
import 'invoices/invoices_screen.dart';
import 'items/items_screen.dart';
import 'parties/parties_screen.dart';
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
    const PartiesScreen(),
    const SettingsScreen(),
  ];

  static final List<Widget> _advancedScreens = [
    const InvoicesScreen(),
    const ItemsScreen(),
    const PartiesScreen(),
    const SettingsScreen(),
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
        title: const Text('PlasticMart Billing'),
        actions: [
          // Mode toggle switch
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: [
                Text(
                  appMode.isBasicMode ? 'Basic' : 'Advanced',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(width: 8),
                Switch(
                  value: appMode.isAdvancedMode,
                  onChanged: (value) => appMode.toggleMode(),
                ),
              ],
            ),
          ),
        ],
      ),
      body: screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: appMode.isBasicMode
            ? const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.receipt),
                  label: 'Invoices',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.people),
                  label: 'Parties',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.settings),
                  label: 'Settings',
                ),
              ]
            : const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.receipt),
                  label: 'Invoices',
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
