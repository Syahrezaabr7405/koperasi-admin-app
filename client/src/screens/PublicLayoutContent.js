import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Modal, Image } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../../assets/images/Logo.jpeg';

export default function PublicLayoutContent() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/(public)' },
    { name: 'Berita', path: '/(public)/berita' },
    { name: 'Tentang Kami', path: '/(public)/tentang' },
    { name: 'Kontak', path: '/(public)/kontak' },
  ];

  const handleNav = (path) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* NAVBAR */}
      <View style={styles.navbar}>
        <View style={styles.logoGroup}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.logoText}>KOPERASI</Text>
            <Text style={styles.logoSubText}>MERAH PUTIH</Text>
          </View>
        </View>

        {isMobile ? (
          <TouchableOpacity onPress={() => setMenuOpen(true)}>
            <Ionicons name="menu" size={32} color="#D32F2F" />
          </TouchableOpacity>
        ) : (
          <View style={styles.desktopMenu}>
            {navItems.map((item) => (
              <TouchableOpacity key={item.path} onPress={() => handleNav(item.path)}>
                <Text style={[styles.navText, (pathname === item.path || (item.path === '/(public)' && pathname === '/')) && styles.navActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
              <Text style={styles.loginBtnText}>MASUK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* RENDER TAB CONTENT */}
      <Slot />

      {/* MOBILE HAMBURGER MENU */}
      <Modal visible={menuOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.sideMenu}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setMenuOpen(false)}>
              <Ionicons name="close" size={35} color="#fff" />
            </TouchableOpacity>
            
            {navItems.map((item) => (
              <TouchableOpacity key={item.path} style={styles.mobileNavItem} onPress={() => handleNav(item.path)}>
                <Text style={styles.mobileNavText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.mobileLoginBtn} onPress={() => { router.push('/login'); setMenuOpen(false); }}>
              <Text style={styles.loginBtnText}>MASUK / DAFTAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, marginRight: 10 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  logoSubText: { fontSize: 10, fontWeight: '600', color: '#333' },
  desktopMenu: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  navText: { fontSize: 14, fontWeight: '600', color: '#666' },
  navActive: { color: '#D32F2F', borderBottomWidth: 2, borderBottomColor: '#D32F2F' },
  loginBtn: { backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  sideMenu: { width: '80%', alignItems: 'center', gap: 30 },
  closeBtn: { position: 'absolute', top: -100, right: 0 },
  mobileNavItem: { width: '100%', alignItems: 'center', paddingVertical: 15 },
  mobileNavText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  mobileLoginBtn: { backgroundColor: '#D32F2F', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 }
});