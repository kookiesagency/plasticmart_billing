import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 PlasticMart Mobile</Text>
      <Text style={styles.subtitle}>Ultra-Simple Billing App</Text>

      <View style={styles.content}>
        <Text style={styles.welcome}>✅ SUCCESS!</Text>
        <Text style={styles.description}>
          Your mobile app is working perfectly!
        </Text>

        <Text style={styles.feature}>🟢 Customers</Text>
        <Text style={styles.feature}>🔵 Items</Text>
        <Text style={styles.feature}>🟡 Bills</Text>
        <Text style={styles.feature}>⚫ Settings</Text>

        <Text style={styles.footer}>
          Ready for layman-friendly interface! 🚀
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 30,
  },
  feature: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  footer: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 30,
  },
});
