import React from 'react';
import { View, Text, ScrollView, Linking, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>LiveNote</Text>
      <Text style={styles.version}>Version 1.0.0</Text>

      <Text style={styles.section}>Was ist LiveNote?</Text>
      <Text style={styles.body}>
        LiveNote ist dein KI-gestützter Kalender-Assistent. Beschreibe einfach deine
        Aufgaben in natürlicher Sprache – die KI plant alles für dich.
      </Text>

      <Text style={styles.section}>Technologie</Text>
      <Text style={styles.body}>Powered by Anthropic Claude AI</Text>

      <Text
        style={styles.link}
        onPress={() => Linking.openURL('https://anthropic.com/privacy')}
      >
        Datenschutzerklärung
      </Text>
      <Text
        style={styles.link}
        onPress={() => Linking.openURL('https://anthropic.com/terms')}
      >
        Nutzungsbedingungen
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  title:     { fontSize: 28, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  version:   { fontSize: 14, color: '#64748b', marginBottom: 24 },
  section:   { fontSize: 16, fontWeight: '600', color: '#1e293b', marginTop: 20, marginBottom: 8 },
  body:      { fontSize: 14, color: '#475569', lineHeight: 22 },
  link:      { fontSize: 14, color: '#2563eb', marginTop: 16 },
});
