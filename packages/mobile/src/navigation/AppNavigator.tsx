import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/basic/HomeScreen';
import { CustomersScreen } from '../screens/basic/CustomersScreen';
import { ItemsScreen } from '../screens/basic/ItemsScreen';
import { InvoicesScreen } from '../screens/basic/InvoicesScreen';
import { SettingsScreen } from '../screens/basic/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Simple tab navigator for Basic Mode - VERY layman friendly
function BasicModeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Items') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Bills') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 70, // Taller for easier tapping
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14, // Larger text for readability
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#16a34a',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'PlasticMart - Basic Mode'
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'Customers',
          headerTitle: 'My Customers'
        }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsScreen}
        options={{
          title: 'Items',
          headerTitle: 'My Items'
        }}
      />
      <Tab.Screen
        name="Bills"
        component={InvoicesScreen}
        options={{
          title: 'Bills',
          headerTitle: 'My Bills'
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'App Settings'
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  // For now, skip authentication and go directly to Basic Mode
  // TODO: Add authentication check

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BasicModeTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}