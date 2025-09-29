import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { calculateInvoiceTotal, formatCurrency } from '@plasticmart/shared';

export const CreateInvoiceScreen = () => {
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [items, setItems] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    rate: number;
  }>>([]);

  const bundleCharge = 50; // Example bundle charge

  const totalAmount = calculateInvoiceTotal(items, bundleCharge);

  const handleSaveInvoice = () => {
    if (!selectedParty) {
      Alert.alert('Error', 'Please select a party');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    Alert.alert('Success', 'Invoice saved successfully!');
  };

  const addSampleItem = () => {
    const sampleItem = {
      id: Date.now().toString(),
      name: 'Sample Item',
      quantity: 1,
      rate: 100
    };
    setItems([...items, sampleItem]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Invoice</Text>
        <Text style={styles.subtitle}>PlasticMart Mobile - Basic Mode</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Party Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Party</Text>
          <TouchableOpacity
            style={[styles.button, styles.selectButton]}
            onPress={() => setSelectedParty('John Doe')}
          >
            <Text style={styles.selectButtonText}>
              {selectedParty || 'Choose Customer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × Rate: {formatCurrency(item.rate)} = {formatCurrency(item.quantity * item.rate)}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSampleItem}>
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(items.reduce((acc, item) => acc + (item.quantity * item.rate), 0))}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bundle Charge:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(bundleCharge)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveInvoice}>
          <Text style={styles.saveButtonText}>Save Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1f2937',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  selectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
  },
  selectButtonText: {
    fontSize: 16,
    color: selectedParty ? '#1f2937' : '#6b7280',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});