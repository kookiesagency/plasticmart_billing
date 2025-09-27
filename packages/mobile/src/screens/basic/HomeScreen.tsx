import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {
  const navigation = useNavigation();

  // Big, colorful action buttons for common tasks
  const QuickActionButton = ({
    title,
    icon,
    color,
    onPress,
    description
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress: () => void;
    description: string;
  }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={40} color="white" />
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome to PlasticMart!</Text>
        <Text style={styles.subtitleText}>
          Everything you need to manage your business simply
        </Text>
      </View>

      {/* Quick Actions - Most Important Tasks */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        <View style={styles.actionsGrid}>
          <QuickActionButton
            title="Create Bill"
            icon="receipt"
            color="#16a34a"
            description="Make a new bill for customer"
            onPress={() => navigation.navigate('Bills')}
          />

          <QuickActionButton
            title="Add Customer"
            icon="person-add"
            color="#3b82f6"
            description="Add a new customer"
            onPress={() => navigation.navigate('Customers')}
          />

          <QuickActionButton
            title="Add Item"
            icon="cube"
            color="#f59e0b"
            description="Add products you sell"
            onPress={() => navigation.navigate('Items')}
          />

          <QuickActionButton
            title="View Bills"
            icon="list"
            color="#8b5cf6"
            description="See all your bills"
            onPress={() => navigation.navigate('Bills')}
          />
        </View>
      </View>

      {/* Today's Summary - Simple Stats */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Today at a Glance</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={24} color="#16a34a" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Bills Created</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Items Available</Text>
          </View>
        </View>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle" size={24} color="#6b7280" />
          <Text style={styles.helpText}>Tap here for simple tutorials</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 16,
  },
  actionButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  summarySection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  helpSection: {
    padding: 20,
    marginTop: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  helpText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
  },
});