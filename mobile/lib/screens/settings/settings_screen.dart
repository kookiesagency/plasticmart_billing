import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_mode_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appMode = Provider.of<AppModeProvider>(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'App Mode',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: SwitchListTile(
            title: const Text('Advanced Mode'),
            subtitle: Text(
              appMode.isBasicMode
                  ? 'Enable advanced features like Items management'
                  : 'Advanced features enabled',
            ),
            value: appMode.isAdvancedMode,
            onChanged: (value) => appMode.toggleMode(),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Features',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.receipt),
                title: const Text('Invoices'),
                subtitle: const Text('Create and manage invoices'),
                trailing: Icon(Icons.check_circle, color: Colors.green),
              ),
              if (appMode.isAdvancedMode)
                ListTile(
                  leading: const Icon(Icons.inventory),
                  title: const Text('Items Management'),
                  subtitle: const Text('Manage products and pricing'),
                  trailing: Icon(Icons.check_circle, color: Colors.green),
                ),
              ListTile(
                leading: const Icon(Icons.people),
                title: const Text('Parties'),
                subtitle: const Text('Manage customers'),
                trailing: Icon(Icons.check_circle, color: Colors.green),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
