import React from 'react';
import { View, Text, ScrollView, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import Background from '../../assets/images/background.jpg';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section - Sekarang area foto bendera lebih luas */}
      <ImageBackground source={Background} style={styles.heroSection}>
        <View style={styles.overlay}>
          <Text style={styles.heroSubtitle}>Sinergi dengan UMKM</Text>
          <Text style={styles.heroTitle}>Koperasi</Text>
          <Text style={styles.heroTitleBold}>Merah Putih</Text>
          <Text style={styles.heroSubTitleSmall}>Kelurahan Jati</Text>
          <Text style={styles.heroDescription}>
            Koperasi konsumen yang menyediakan bahan baku berkualitas untuk masyarakat Kelurahan Jati.
          </Text>
        </View>
      </ImageBackground>

      {/* Konten Tambahan di Bawah (Agar bisa di-scroll) */}
      <View style={styles.contentBody}>
        <Text style={styles.sectionTitle}>Selamat Datang</Text>
        <Text style={styles.textParagraph}>
          Kami hadir untuk mendukung pertumbuhan ekonomi lokal melalui penyediaan kebutuhan pokok 
          dan pemberdayaan UMKM di wilayah Kelurahan Jati.
        </Text>
        
        <View style={styles.videoPlaceholder}>
          <Text style={{color: '#888'}}>Video Profil Koperasi (Gunakan expo-av)</Text>
        </View>

        <Text style={styles.sectionTitle}>Visi Kami</Text>
        <Text style={styles.textParagraph}>
          Menjadi pilar ekonomi kerakyatan yang mandiri, transparan, dan terpercaya bagi seluruh anggota.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  heroSection: { height: Dimensions.get('window').height * 0.6 }, // 60% tinggi layar
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    paddingHorizontal: 25 
  },
  heroSubtitle: { color: '#fff', fontSize: 14, marginBottom: 5 },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  heroTitleBold: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginTop: -5 },
  heroSubTitleSmall: { color: '#fff', fontSize: 20, marginBottom: 15 },
  heroDescription: { color: '#fff', fontSize: 14, lineHeight: 20, maxWidth: '85%' },
  
  contentBody: { padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10, marginTop: 10 },
  textParagraph: { fontSize: 15, color: '#444', lineHeight: 24, marginBottom: 20 },
  videoPlaceholder: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd'
  }
});