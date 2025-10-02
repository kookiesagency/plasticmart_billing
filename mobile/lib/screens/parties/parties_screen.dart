import 'package:flutter/material.dart';

class PartiesScreen extends StatelessWidget {
  const PartiesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: const Center(
        child: Text('Parties Screen'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create party screen
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
