import React from 'react';
import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';

export default function TentangScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tentang Kami</Text>
      <Text style={styles.subtitle}>Visi & Misi Koperasi Merah Putih</Text>
      <Text style={styles.desc}>Mewujudkan kesejahteraan ekonomi anggota melalui sinergi UMKM di Kelurahan Jati.</Text>
      
      <Text style={styles.sectionTitle}>Struktur Organisasi</Text>
      {/* Ganti dengan URL foto struktur dari Canva/Admin */}
      <Image 
        source={{ uri: 'https://via.placeholder.com/600x800' }} 
        style={styles.structureImg} 
        resizeMode="contain" 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  desc: { textAlign: 'center', color: '#666', marginTop: 10, lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 30, marginBottom: 15 },
  structureImg: { width: '100%', height: 500, borderRadius: 10, backgroundColor: '#eee' }
});