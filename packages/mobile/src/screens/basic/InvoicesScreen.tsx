import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Invoice = {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Partial';
  itemCount: number;
};

export const InvoicesScreen = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      customerName: 'Rajesh Kumar',
      date: '2024-01-15',
      total: 1500,
      status: 'Paid',
      itemCount: 3,
    },
    {
      id: '2',
      customerName: 'Priya Sharma',
      date: '2024-01-14',
      total: 2200,
      status: 'Pending',
      itemCount: 5,
    },
    {
      id: '3',
      customerName: 'Amit Patel',
      date: '2024-01-13',
      total: 800,
      status: 'Partial',
      itemCount: 2,
    },
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return '#16a34a';
      case 'Pending':
        return '#dc2626';
      case 'Partial':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'checkmark-circle';
      case 'Pending':
        return 'time';
      case 'Partial':
        return 'partially-sunny';
      default:
        return 'help-circle';
    }
  };

  const handleCreateBill = () => {
    Alert.alert(
      'Create New Bill',
      'This will open the bill creation wizard',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Creating', onPress: () => console.log('Navigate to create bill') },
      ]
    );
  };

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.customerSection}>
          <Ionicons name="person-circle" size={32} color="#3b82f6" />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            <Text style={styles.invoiceDate}>{formatDate(invoice.date)}</Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Ionicons
              name={getStatusIcon(invoice.status) as keyof typeof Ionicons.glyphMap}
              size={16}
              color="white"
            />
            <Text style={styles.statusText}>{invoice.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{invoice.total.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.itemSection}>
          <Text style={styles.itemCount}>{invoice.itemCount} items</Text>
        </View>
      </View>

      <View style={styles.invoiceActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={16} color="#16a34a" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {invoice.status !== 'Paid' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="card" size={16} color="#f59e0b" />
            <Text style={styles.actionText}>Payment</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Create Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bills</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateBill}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.createButtonText}>Create New Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{invoices.length}</Text>
          <Text style={styles.statLabel}>Total Bills</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {invoices.filter(i => i.status === 'Paid').length}
          </Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {invoices.filter(i => i.status === 'Pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Bills List */}
      {invoices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Bills Yet</Text>
          <Text style={styles.emptyText}>
            Create your first bill to get started with business
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleCreateBill}>
            <Text style={styles.emptyButtonText}>Create Your First Bill</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InvoiceCard invoice={item} />}
          style={styles.invoiceList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  invoiceList: {
    flex: 1,
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerInfo: {
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  amountSection: {
    alignItems: 'flex-start',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 2,
  },
  itemSection: {
    alignItems: 'flex-end',
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    padding: 16,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});