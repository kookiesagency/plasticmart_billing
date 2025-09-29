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

type Item = {
  id: string;
  name: string;
  rate: number;
  unit: string;
  specialPricesCount: number;
};

export const ItemsScreen = () => {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: 'Plastic Bottle', rate: 100, unit: 'PCS', specialPricesCount: 2 },
    { id: '2', name: 'Plastic Bag', rate: 50, unit: 'KG', specialPricesCount: 0 },
    { id: '3', name: 'Container', rate: 150, unit: 'PCS', specialPricesCount: 1 },
  ]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('PCS');

  const units = ['PCS', 'KG', 'DZ', 'BOX', 'PACK'];

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Missing Info', 'Please enter item name');
      return;
    }

    if (!newItemRate.trim() || isNaN(Number(newItemRate))) {
      Alert.alert('Missing Info', 'Please enter a valid price');
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      rate: parseFloat(newItemRate),
      unit: newItemUnit,
      specialPricesCount: 0,
    };

    setItems([newItem, ...items]);
    setNewItemName('');
    setNewItemRate('');
    setNewItemUnit('PCS');
    setIsAddModalVisible(false);
    Alert.alert('Success!', 'Item added successfully');
  };

  const ItemCard = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemIcon}>
          <Ionicons name="cube" size={32} color="#f59e0b" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.rate} per {item.unit}</Text>
          {item.specialPricesCount > 0 && (
            <Text style={styles.specialPrices}>
              🏷️ {item.specialPricesCount} special prices
            </Text>
          )}
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="receipt-outline" size={16} color="#16a34a" />
          <Text style={styles.actionText}>Use in Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pricetag-outline" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Special Price</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const UnitSelector = () => (
    <View style={styles.unitSelector}>
      <Text style={styles.inputLabel}>Unit</Text>
      <View style={styles.unitButtons}>
        {units.map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[
              styles.unitButton,
              newItemUnit === unit && styles.unitButtonSelected,
            ]}
            onPress={() => setNewItemUnit(unit)}
          >
            <Text
              style={[
                styles.unitButtonText,
                newItemUnit === unit && styles.unitButtonTextSelected,
              ]}
            >
              {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Items</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Items Yet</Text>
          <Text style={styles.emptyText}>
            Add items that you sell to create bills quickly
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Add Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} />}
          style={styles.itemList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Item Modal - Very Simple */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TouchableOpacity
              onPress={() => setIsAddModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>What do you sell? *</Text>
            <TextInput
              style={styles.input}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="e.g. Plastic Bottle, Container"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={newItemRate}
              onChangeText={setNewItemRate}
              placeholder="100"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <UnitSelector />

            <Text style={styles.helpText}>
              💡 You can add different prices for different customers later
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
              onPress={handleAddItem}
            >
              <Text style={styles.saveButtonText}>Add Item</Text>
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
    backgroundColor: '#f59e0b',
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
  itemList: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemPrice: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  specialPrices: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  itemActions: {
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
    backgroundColor: '#f59e0b',
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
  unitSelector: {
    marginTop: 16,
  },
  unitButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  unitButtonSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: 'white',
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
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
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});