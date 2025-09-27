import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Customer = {
  id: string;
  name: string;
  phone: string;
  bundleRate: number;
};

export const CustomersScreen = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Rajesh Kumar', phone: '9876543210', bundleRate: 50 },
    { id: '2', name: 'Priya Sharma', phone: '9876543211', bundleRate: 40 },
    { id: '3', name: 'Amit Patel', phone: '9876543212', bundleRate: 60 },
  ]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerBundle, setNewCustomerBundle] = useState('50');

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) {
      Alert.alert('Missing Info', 'Please enter customer name');
      return;
    }

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      bundleRate: parseInt(newCustomerBundle) || 50,
    };

    setCustomers([newCustomer, ...customers]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerBundle('50');
    setIsAddModalVisible(false);
    Alert.alert('Success!', 'Customer added successfully');
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Ionicons name="person-circle" size={40} color="#16a34a" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.phone ? (
              <Text style={styles.customerPhone}>📞 {customer.phone}</Text>
            ) : null}
            <Text style={styles.bundleRate}>Bundle Rate: ₹{customer.bundleRate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.customerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={18} color="#16a34a" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="receipt" size={18} color="#3b82f6" />
          <Text style={styles.actionText}>Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Customers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="person-add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      {customers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Customers Yet</Text>
          <Text style={styles.emptyText}>
            Add your first customer to get started with billing
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Add Your First Customer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CustomerCard customer={item} />}
          style={styles.customerList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Customer Modal - Very Simple */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Customer</Text>
            <TouchableOpacity
              onPress={() => setIsAddModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={newCustomerName}
              onChangeText={setNewCustomerName}
              placeholder="Enter customer name"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newCustomerPhone}
              onChangeText={setNewCustomerPhone}
              placeholder="Enter phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Bundle Rate (₹)</Text>
            <TextInput
              style={styles.input}
              value={newCustomerBundle}
              onChangeText={setNewCustomerBundle}
              placeholder="50"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.helpText}>
              Bundle rate is extra charge for packaging/delivery
            </Text>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddCustomer}
            >
              <Text style={styles.saveButtonText}>Add Customer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  customerList: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
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
  customerInfo: {
    marginBottom: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bundleRate: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 12,
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
    marginLeft: 6,
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
    backgroundColor: '#16a34a',
    padding: 16,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});