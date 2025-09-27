import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen = () => {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const handleModeToggle = (value: boolean) => {
    setIsAdvancedMode(value);
    Alert.alert(
      value ? 'Advanced Mode' : 'Basic Mode',
      value
        ? 'Advanced mode gives you more features and controls'
        : 'Basic mode keeps things simple and easy to use',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightElement,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#16a34a" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement && <View style={styles.settingRight}>{rightElement}</View>}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Mode Toggle - Most Important */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Mode</Text>
        <View style={styles.modeCard}>
          <View style={styles.modeHeader}>
            <Ionicons
              name={isAdvancedMode ? 'settings' : 'star'}
              size={32}
              color={isAdvancedMode ? '#f59e0b' : '#16a34a'}
            />
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>
                {isAdvancedMode ? 'Advanced Mode' : 'Basic Mode'}
              </Text>
              <Text style={styles.modeDescription}>
                {isAdvancedMode
                  ? 'All features for power users'
                  : 'Simple and easy to use'}
              </Text>
            </View>
            <Switch
              value={isAdvancedMode}
              onValueChange={handleModeToggle}
              trackColor={{ false: '#d1d5db', true: '#16a34a' }}
              thumbColor={isAdvancedMode ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>
      </View>

      {/* Business Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Settings</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="business"
            title="Company Details"
            subtitle="Name, address, and contact info"
            onPress={() => Alert.alert('Coming Soon', 'Company details setup')}
          />

          <SettingItem
            icon="pricetag"
            title="Default Bundle Rate"
            subtitle="₹50 per bundle"
            onPress={() => Alert.alert('Coming Soon', 'Bundle rate settings')}
          />

          <SettingItem
            icon="cube"
            title="Units"
            subtitle="PCS, KG, DZ, etc."
            onPress={() => Alert.alert('Coming Soon', 'Units management')}
          />
        </View>
      </View>

      {/* App Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Better for low light"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                thumbColor={isDarkMode ? '#ffffff' : '#ffffff'}
              />
            }
          />

          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Payment reminders and alerts"
            rightElement={
              <Switch
                value={isNotificationsEnabled}
                onValueChange={setIsNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                thumbColor={isNotificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            }
          />

          <SettingItem
            icon="language"
            title="Language"
            subtitle="English (coming: Hindi, Gujarati)"
            onPress={() => Alert.alert('Coming Soon', 'Language selection')}
          />
        </View>
      </View>

      {/* Data & Backup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Backup</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="cloud-upload"
            title="Backup Data"
            subtitle="Save to cloud"
            onPress={() => Alert.alert('Coming Soon', 'Cloud backup feature')}
          />

          <SettingItem
            icon="download"
            title="Export Data"
            subtitle="Download your data"
            onPress={() => Alert.alert('Coming Soon', 'Data export feature')}
          />

          <SettingItem
            icon="sync"
            title="Sync Settings"
            subtitle="Auto-sync when online"
            onPress={() => Alert.alert('Coming Soon', 'Sync settings')}
          />
        </View>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="help-circle"
            title="How to Use"
            subtitle="Simple tutorials"
            onPress={() => Alert.alert('Coming Soon', 'Tutorial videos')}
          />

          <SettingItem
            icon="chatbubble"
            title="Contact Support"
            subtitle="Get help when you need it"
            onPress={() => Alert.alert('Coming Soon', 'Support chat')}
          />

          <SettingItem
            icon="information-circle"
            title="About PlasticMart"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('PlasticMart', 'Version 1.0.0\nSimple billing for everyone')}
          />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive' },
            ])
          }
        >
          <Ionicons name="log-out" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  modeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingsGroup: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});