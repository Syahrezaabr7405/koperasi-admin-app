import React, { useState, useEffect } from 'react';
import {
View,
Text,
TextInput,
Button,
StyleSheet,
Image,
ScrollView,
TouchableOpacity,
Modal,
Dimensions
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../assets/images/Logo.jpeg';
import Background from '../assets/images/background.jpg';
import { useRouter } from 'expo-router';
import { loginUser } from '../src/services/api';
import { useCart } from '../src/CartContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // --- STATE MODAL ERROR BARU ---
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // ----------------------------------

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
      // --- JIKA LOGIN GAGAL, TAMPILKAN MODAL ERROR ---
      setErrorMessage(result.message || 'Username atau password salah.');
      setShowErrorModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={Background} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      />

      {/* Scrollable Card */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

      {/* Modal Konfirmasi Login */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLoginModal}
        onRequestClose={() => setShowLoginModal(false)}
      >
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

      {/* --- MODAL ALERT ERROR (BARU) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            {/* Icon Warning */}
            <Text style={styles.errorIcon}>⚠️</Text>
            
            <Text style={styles.modalTitle}>Login Gagal</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            
            <View style={styles.modalButtonContainer}>
              {/* Hanya tombol OK untuk menutup */}
              <Button title="OK" onPress={() => setShowErrorModal(false)} color="#D32F2F"/>
            </View>
          </View>
        </View>
      </Modal>
      {/* ------------------------------------- */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  
  backgroundImage: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  card: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255, 0.95)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },

  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 100, height: 100 }, 
  
  titleContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#888', letterSpacing: 1 },

  formContainer: { width: '100%', marginBottom: 10 },
  
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, fontSize: 16, color: '#000', padding: 0 },
  eyeIcon: { marginLeft: 10, padding: 5 },

  buttonContainer: { marginTop: 5, borderRadius: 15, overflow: 'hidden' },
  forgotLink: { alignItems: 'center', marginTop: 15 }, // Hapus flexDirection: 'row'
  forgotText: { color: '#555', fontSize: 13, fontWeight: '600' },

  footerContainer: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#D32F2F', fontSize: 15, fontWeight: 'bold', marginTop: 5, marginLeft: 5 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalBox: {
    width: '80%', 
    backgroundColor: 'white', 
    padding: 25, 
    borderRadius: 20, 
    alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },

  // Style Tambahan untuk Modal Error
  errorIcon: { fontSize: 40, marginBottom: 5 }
});