import React, { useState } from 'react';
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
import { registerUser } from '../src/services/api';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', nik: '', phone: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const router = useRouter();

  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length > 0) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };
  const strength = getPasswordStrength(formData.password);

  const handleRegister = async () => {
    if(!formData.name || !formData.username || !formData.password || !formData.nik || !formData.phone) {
      return console.log('Mohon lengkapi semua');
    }
    if (formData.password !== confirmPassword) {
      return console.log('Konfirmasi Password tidak sama');
    }
    if (strength < 3) {
      return console.log('Password lemah');
    }
    setShowRegisterModal(true);
  };

  const processRegister = async () => {
    setShowRegisterModal(false);
    const result = await registerUser(formData);
    if (result.success) {
      console.log('Akun berhasil terdaftar');
      router.back();
    } else {
      console.log('Gagal:', result.message);
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
            <Text style={styles.title}>Daftar Akun</Text>
            <Text style={styles.subtitle}>Bergabung dengan Koperasi</Text>
          </View>

          <ScrollView style={{maxHeight: 350}} showsVerticalScrollIndicator={false}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Nama Lengkap" 
                style={styles.inputWithIcon} 
                onChangeText={(t) => setFormData({...formData, name: t})} 
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="NIK" 
                style={styles.inputWithIcon} 
                onChangeText={(t) => setFormData({...formData, nik: t})} 
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="No Telepon" 
                style={styles.inputWithIcon} 
                onChangeText={(t) => setFormData({...formData, phone: t})} 
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Username" 
                style={styles.inputWithIcon} 
                onChangeText={(t) => setFormData({...formData, username: t})} 
                placeholderTextColor="#888"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Password" 
                style={styles.inputWithIcon} 
                onChangeText={(t) => setFormData({...formData, password: t})} 
                secureTextEntry={!showPassword}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            
            {formData.password.length > 0 && strength < 3 && (
              <Text style={styles.warningText}>⚠ Password lemah! Gunakan minimal 8 karakter, huruf kapital, dan angka.</Text>
            )}
            {formData.password.length > 0 && strength >= 3 && (
              <Text style={styles.successText}>✓ Password Kuat</Text>
            )}

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.inputIcon} />
              <TextInput 
                placeholder="Konfirmasi Password" 
                style={styles.inputWithIcon} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          <View style={styles.buttonContainer}>
            <Button title="DAFTAR" onPress={handleRegister} color="#D32F2F" />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Sudah punya akun?</Text>
            <Text style={styles.footerLink} onPress={() => router.back()}>MASUK</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Daftar */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRegisterModal}
        onRequestClose={() => setShowRegisterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Konfirmasi Pendaftaran</Text>
            <Text style={styles.modalText}>Apakah data yang Anda isi sudah benar?</Text>
            <View style={styles.modalButtonContainer}>
              <Button title="Batal" onPress={() => setShowRegisterModal(false)} color="#888" />
              <Button title="Ya, Daftar" onPress={processRegister} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>
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
  
  titleContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#777' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, fontSize: 14, color: '#000', padding: 0 },
  eyeIcon: { marginLeft: 10, padding: 5 },
  
  warningText: { 
    color: '#D32F2F', 
    fontSize: 11, 
    marginBottom: 8, 
    textAlign: 'left', 
    paddingLeft: 10 
  },
  successText: { 
    color: '#4CAF50', 
    fontSize: 12, 
    marginBottom: 8, 
    fontWeight: 'bold', 
    textAlign: 'left', 
    paddingLeft: 10 
  },

  buttonContainer: { marginTop: 5, borderRadius: 15, overflow: 'hidden' },
  
  footerContainer: { alignItems: 'center', marginTop: 15 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#D32F2F', fontSize: 15, fontWeight: 'bold', marginTop: 5 },

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
  modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' }
});