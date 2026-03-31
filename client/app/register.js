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
  
  // --- STATE UNTUK CUSTOM ALERT ---
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });

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

  // Fungsi pembantu untuk memunculkan alert
  const triggerAlert = (title, message, type = 'success') => {
    setAlertConfig({ title, message, type });
    setShowAlert(true);
  };

  const handleRegister = async () => {
    if(!formData.name || !formData.username || !formData.password || !formData.nik || !formData.phone) {
      return triggerAlert('Data Belum Lengkap', 'Mohon lengkapi semua kolom formulir.', 'error');
    }
    if (formData.password !== confirmPassword) {
      return triggerAlert('Password Tidak Cocok', 'Konfirmasi password harus sama dengan password.', 'error');
    }
    if (strength < 3) {
      return triggerAlert('Password Lemah', 'Gunakan kombinasi angka dan huruf yang lebih kuat.', 'error');
    }
    setShowRegisterModal(true);
  };

  const processRegister = async () => {
    setShowRegisterModal(false);
    const result = await registerUser(formData);
    
    if (result.success) {
      // Alert sukses sesuai permintaanmu
      triggerAlert(
        'Pendaftaran Berhasil', 
        'Anda sudah mendaftar, silahkan kembali ke halaman login.', 
        'success'
      );
    } else {
      // Menangani jika akun/NIK sudah ada
      const errorMsg = result.message || 'Gagal mendaftarkan akun.';
      triggerAlert('Pendaftaran Gagal', errorMsg, 'error');
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    // Jika sukses, arahkan balik ke login setelah user menekan OK
    if (alertConfig.type === 'success') {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Image source={Background} style={styles.backgroundImage} resizeMode="cover" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.warningText}>⚠ Password lemah! Gunakan minimal 8 karakter, kapital, dan angka.</Text>
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

      {/* --- MODAL KONFIRMASI (DAFTAR) --- */}
      <Modal animationType="fade" transparent={true} visible={showRegisterModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Ionicons name="help-circle-outline" size={50} color="#D32F2F" />
            <Text style={styles.modalTitle}>Konfirmasi</Text>
            <Text style={styles.modalText}>Apakah data yang Anda isi sudah benar?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowRegisterModal(false)}>
                <Text style={{color: '#888'}}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={processRegister}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Ya, Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL CUSTOM ALERT (BERHASIL/GAGAL) --- */}
      <Modal animationType="slide" transparent={true} visible={showAlert}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Ionicons 
              name={alertConfig.type === 'success' ? "checkmark-circle" : "alert-circle"} 
              size={60} 
              color={alertConfig.type === 'success' ? "#4CAF50" : "#D32F2F"} 
            />
            <Text style={[styles.modalTitle, {marginTop: 10}]}>{alertConfig.title}</Text>
            <Text style={styles.modalText}>{alertConfig.message}</Text>
            <TouchableOpacity 
              style={[styles.btnFull, {backgroundColor: alertConfig.type === 'success' ? "#4CAF50" : "#D32F2F"}]} 
              onPress={handleCloseAlert}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backgroundImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: Dimensions.get('window').width, height: Dimensions.get('window').height,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  card: {
    width: '85%', backgroundColor: 'rgba(255,255,255, 0.95)',
    borderRadius: 25, padding: 30, elevation: 10,
  },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 100, height: 100 }, 
  titleContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#777' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8',
    borderRadius: 15, paddingHorizontal: 15, paddingVertical: 5,
    marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0'
  },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, fontSize: 14, color: '#000' },
  eyeIcon: { marginLeft: 10, padding: 5 },
  warningText: { color: '#D32F2F', fontSize: 11, marginBottom: 8, paddingLeft: 10 },
  buttonContainer: { marginTop: 15, borderRadius: 15, overflow: 'hidden' },
  footerContainer: { alignItems: 'center', marginTop: 15 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#D32F2F', fontSize: 15, fontWeight: 'bold', marginTop: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  btnPrimary: { backgroundColor: '#D32F2F', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  btnSecondary: { backgroundColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  btnFull: { width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }
});