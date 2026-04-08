import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function KontakScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hubungi Kami</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('tel:081574403970')}>
          <Ionicons name="call" size={25} color="#D32F2F" />
          <Text style={styles.itemText}>081574403970</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('mailto:iwankurniawanimam@gmail.com')}>
          <Ionicons name="mail" size={25} color="#D32F2F" />
          <Text style={styles.itemText}>iwankurniawanimam@gmail.com</Text>
        </TouchableOpacity>

        <View style={styles.item}>
          <Ionicons name="location" size={25} color="#D32F2F" />
          <Text style={styles.itemText}>Kelurahan Jati, Jakarta Timur</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 2 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  itemText: { fontSize: 16, color: '#333' }
});