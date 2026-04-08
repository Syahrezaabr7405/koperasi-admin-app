import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function BeritaScreen() {
  // Contoh data dummy, nantinya diambil dari API/Database
  const beritaData = [
    { id: 1, judul: 'Rapat Anggota Tahunan 2026', tgl: '10 Maret 2026', img: 'https://via.placeholder.com/300' },
    { id: 2, judul: 'Penyaluran Sembako UMKM Jati', tgl: '05 Maret 2026', img: 'https://via.placeholder.com/300' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Berita Terkini</Text>
      {beritaData.map((item) => (
        <View key={item.id} style={styles.card}>
          <Image source={{ uri: item.img }} style={styles.cardImg} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.judul}</Text>
            <Text style={styles.cardDate}>{item.tgl}</Text>
            <TouchableOpacity style={styles.btnRead}><Text style={styles.btnText}>Baca Selengkapnya</Text></TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#D32F2F' },
  card: { backgroundColor: '#f9f9f9', borderRadius: 15, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  cardImg: { width: '100%', height: 180 },
  cardContent: { padding: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardDate: { color: '#888', marginVertical: 5 },
  btnRead: { marginTop: 10, backgroundColor: '#D32F2F', padding: 10, borderRadius: 5, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});