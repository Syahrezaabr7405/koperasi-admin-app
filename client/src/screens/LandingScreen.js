// screens/LandingScreen.js (atau sesuaikan dengan folder kamu)
import React from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, 
  ImageBackground, SafeAreaView, StatusBar, StyleSheet
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../../assets/images/Logo.jpeg';
import Background from '../../assets/images/background.jpg';

export default function LandingScreen({ onNavigateToLogin }) {
  return (
    <SafeAreaView style={styles.landingContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Koperasi Merah Putih</Text>
        <View style={styles.topBarContact}>
           <View style={styles.contactItem}>
             <Ionicons name="call" size={12} color="#D32F2F" />
             <Text style={styles.contactText}> 081574403970</Text>
           </View>
           <View style={styles.contactItem}>
             <Ionicons name="mail" size={12} color="#D32F2F" />
             <Text style={styles.contactText}> iwankurniawanimam@gmail.com</Text>
           </View>
        </View>
      </View>

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarTopRow}>
          <View style={styles.logoGroup}>
            <Image source={Logo} style={styles.logoLanding} resizeMode="contain" />
            <View>
                <Text style={styles.logoLandingText}>KOPERASI</Text>
                <Text style={styles.logoLandingSub}>MERAH PUTIH</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.blueButton} 
            onPress={onNavigateToLogin} // Fungsi dari props
          >
            <Text style={styles.blueButtonText}>MASUK / DAFTAR</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <Text style={styles.tabActive}>Home</Text>
          <Text style={styles.tabText}>Berita</Text>
          <Text style={styles.tabText}>Tentang Kami</Text>
          <Text style={styles.tabText}>Kontak</Text>
        </ScrollView>
      </View>

      {/* Hero Section */}
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
    </SafeAreaView>
  );
}

// ... Pindahkan styles landing page ke sini ...
const styles = StyleSheet.create({
  // --- STYLES LANDING PAGE ---
  landingContainer: { flex: 1, backgroundColor: '#fff' },
  topBar: { 
    flexDirection: 'column',
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    backgroundColor: '#fdfdfd',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee'
  },
  topBarTitle: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  topBarContact: { flexDirection: 'row', flexWrap: 'wrap' },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  contactText: { fontSize: 10, color: '#666' },

  navbar: { 
    backgroundColor: '#fff',
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  navbarTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center' },
  logoLanding: { width: 35, height: 35 },
  logoLandingText: { marginLeft: 8, fontWeight: 'bold', fontSize: 14, color: '#D32F2F', lineHeight: 16 },
  logoLandingSub: { marginLeft: 8, fontSize: 10, color: '#333', fontWeight: '600' },
  
  tabsScroll: { 
    paddingHorizontal: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  tabText: { marginRight: 20, fontSize: 13, color: '#666', fontWeight: '500' },
  tabActive: { marginRight: 20, fontSize: 13, color: '#D32F2F', fontWeight: 'bold' },

  blueButton: { 
    backgroundColor: '#007bff', 
    flexDirection: 'row', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 4,
    alignItems: 'center'
  },
  blueButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 10, marginRight: 5 },

  heroSection: { flex: 1 },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.55)', 
    justifyContent: 'center', 
    paddingHorizontal: 25 
  },
  heroSubtitle: { color: '#fff', fontSize: 14, marginBottom: 5 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  heroTitleBold: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: -5 },
  heroSubTitleSmall: { color: '#fff', fontSize: 18, marginBottom: 15 },
  heroDescription: { color: '#fff', fontSize: 13, lineHeight: 18, maxWidth: '90%' }
});