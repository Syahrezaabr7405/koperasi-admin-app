// LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Image, 
  ScrollView, TouchableOpacity, Modal
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../../assets/images/Logo.jpeg';
import Background from '../../assets/images/background.jpg';
import { useRouter } from 'expo-router';
import { loginUser } from '../services/api';
import { useCart } from '../context/CartContext';

export default function LoginScreen() {
  // --- STATE UNTUK PINDAH TAMPILAN ---
  const [isLandingPage, setIsLandingPage] = useState(true);

  // --- STATE LOGIN ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const { setUser } = useCart();

  useEffect(() => {
    setUsername('');
    setPassword('');
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return;
    setShowLoginModal(true);
  };

  const processLogin = async () => {
    setShowLoginModal(false);
    const result = await loginUser(username, password);
    
    if (result.success) {
      setUser(result.user);
      if (result.user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/main');
      }
    } else {
      setErrorMessage(result.message || 'Username atau password salah.');
      setShowErrorModal(true);
    }
  };

// --- RENDER LANDING PAGE ---
  if (isLandingPage) {
    return <LandingScreen onNavigateToLogin={() => setIsLandingPage(false)} />;
  }

  // --- RENDER FORM LOGIN ---
  return (
    <View style={styles.container}>
      <Image source={Background} style={styles.backgroundImage} resizeMode="cover" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backToHome} onPress={() => setIsLandingPage(true)}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={{color: '#fff', marginLeft: 5, fontWeight: '600'}}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image source={Logo} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>KOPERASI MERAH PUTIH</Text>
            <Text style={styles.subtitle}>Kelurahan Jati</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Username" 
                style={styles.inputWithIcon} 
                value={username} 
                onChangeText={setUsername}
                placeholderTextColor="#888"
                autoCapitalize="none"
              />
            </View>
          
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Password" 
                style={styles.inputWithIcon} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button title="MASUK" onPress={handleLogin} color="#D32F2F" />
            </View>

            <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/forgot')}>
              <Text style={styles.forgotText}>Lupa Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Belum punya akun?</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
               <Text style={styles.footerLink}>DAFTAR SEKARANG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal Konfirmasi */}
      <Modal animationType="fade" transparent={true} visible={showLoginModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Konfirmasi Login</Text>
            <Text style={styles.modalText}>Apakah Anda ingin login dengan username "{username}"?</Text>
            <View style={styles.modalButtonContainer}>
              <Button title="Batal" onPress={() => setShowLoginModal(false)} color="#888"/>
              <Button title="Masuk" onPress={processLogin} color="#D32F2F"/>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Error */}
      <Modal animationType="fade" transparent={true} visible={showErrorModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>Login Gagal</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <View style={styles.modalButtonContainer}>
              <Button title="OK" onPress={() => setShowErrorModal(false)} color="#D32F2F"/>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- STYLES LOGIN ASLI ---
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%', zIndex: -1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  backToHome: { position: 'absolute', top: 40, left: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  card: { width: '85%', backgroundColor: 'rgba(255,255,255, 0.95)', borderRadius: 25, padding: 30, elevation: 10 },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 80, height: 80 },
  titleContainer: { alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#888' },
  formContainer: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, fontSize: 16, paddingVertical: 10 },
  eyeIcon: { padding: 5 },
  buttonContainer: { borderRadius: 15, overflow: 'hidden', marginTop: 5 },
  forgotLink: { alignItems: 'center', marginTop: 15 },
  forgotText: { color: '#555', fontSize: 13, fontWeight: '600' },
  footerContainer: { alignItems: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 13 },
  footerLink: { color: '#D32F2F', fontWeight: 'bold', marginTop: 5, fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalText: { textAlign: 'center', marginVertical: 15, color: '#444' },
  modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  errorIcon: { fontSize: 40, marginBottom: 10 }
});