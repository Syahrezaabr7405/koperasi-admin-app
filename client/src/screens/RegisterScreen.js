import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Image, 
  ScrollView, TouchableOpacity, Modal, Dimensions, Alert 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; 
import Logo from '../../assets/images/Logo.jpeg'; 
import Background from '../../assets/images/background.jpg';
import { useRouter } from 'expo-router';
import { registerUser } from '../services/api';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({ 
    name: '', username: '', password: '', nik: '', phone: '', email: '' 
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State untuk kontrol mata password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'success' });

  const router = useRouter();

  const triggerAlert = (title, message, type = 'success') => {
    setAlertConfig({ title, message, type });
    setShowAlert(true);
  };

  const handleRegister = async () => {
    if(!formData.name || !formData.username || !formData.password || !formData.nik || !formData.email || !formData.phone || !confirmPassword) {
      return triggerAlert('Data Belum Lengkap', 'Mohon lengkapi semua kolom pendaftaran.', 'error');
    }
    // Validasi apakah password cocok
    if (formData.password !== confirmPassword) {
      return triggerAlert('Password Tidak Cocok', 'Pastikan konfirmasi password sama dengan password Anda.', 'error');
    }
    setShowRegisterModal(true);
  };

  const processRegister = async () => {
    setShowRegisterModal(false);
    const result = await registerUser(formData);
    if (result.success) {
      triggerAlert('Pendaftaran Berhasil', 'Akun Anda sudah terdaftar, silakan kembali ke halaman login.', 'success');
    } else {
      triggerAlert('Pendaftaran Gagal', result.message || 'Terjadi kesalahan pada server.', 'error');
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    if (alertConfig.type === 'success') router.back();
  };

  return (
    <View style={styles.container}>
      <Image source={Background} style={styles.backgroundImage} resizeMode="cover" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoContainer}><Image source={Logo} style={styles.logo} /></View>
          <Text style={styles.title}>Daftar Akun</Text>

          {/* INPUT FIELDS */}
          <View style={styles.inputWrapper}>
             <Ionicons name="person-outline" size={20} color="#D32F2F" />
             <TextInput placeholder="Nama Lengkap" style={styles.inputWithIcon} onChangeText={(t) => setFormData({...formData, name: t})} />
          </View>

          <View style={styles.inputWrapper}>
             <Ionicons name="card-outline" size={20} color="#D32F2F" />
             <TextInput placeholder="NIK" style={styles.inputWithIcon} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, nik: t})} />
          </View>

          {/* Kolom Nomor Telepon */}
          <View style={styles.inputWrapper}>
             <Ionicons name="call-outline" size={20} color="#D32F2F" />
             <TextInput placeholder="Nomor Telepon Aktif" style={styles.inputWithIcon} keyboardType="phone-pad" onChangeText={(t) => setFormData({...formData, phone: t})} />
          </View>

          <View style={styles.inputWrapper}>
             <Ionicons name="mail-outline" size={20} color="#D32F2F" />
             <TextInput placeholder="Email Aktif" style={styles.inputWithIcon} autoCapitalize="none" onChangeText={(t) => setFormData({...formData, email: t})} />
          </View>

          <View style={styles.inputWrapper}>
             <Ionicons name="at-outline" size={20} color="#D32F2F" />
             <TextInput placeholder="Username" style={styles.inputWithIcon} autoCapitalize="none" onChangeText={(t) => setFormData({...formData, username: t})} />
          </View>

          {/* Kolom Password dengan Mata */}
          <View style={styles.inputWrapper}>
             <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" />
             <TextInput 
                placeholder="Password" 
                style={styles.inputWithIcon} 
                secureTextEntry={!showPassword} 
                onChangeText={(t) => setFormData({...formData, password: t})} 
             />
             <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
             </TouchableOpacity>
          </View>

          {/* Kolom Konfirmasi Password dengan Mata */}
          <View style={styles.inputWrapper}>
             <Ionicons name="shield-checkmark-outline" size={20} color="#D32F2F" />
             <TextInput 
                placeholder="Konfirmasi Password" 
                style={styles.inputWithIcon} 
                secureTextEntry={!showConfirmPassword} 
                onChangeText={(t) => setConfirmPassword(t)} 
             />
             <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#888" />
             </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnMain} onPress={handleRegister}>
            <Text style={styles.btnText}>DAFTAR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerContainer} onPress={() => router.back()}>
            <Text style={styles.footerText}>Sudah punya akun? <Text style={styles.footerLink}>MASUK</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal & Alerts Tetap Sama */}
      <Modal visible={showRegisterModal} transparent><View style={styles.modalContainer}><View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Konfirmasi</Text>
        <Text style={styles.modalText}>Apakah data yang Anda masukkan sudah benar?</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
           <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#EEE'}]} onPress={() => setShowRegisterModal(false)}>
              <Text style={{color: '#666'}}>Batal</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#D32F2F'}]} onPress={processRegister}>
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>Ya, Daftar</Text>
           </TouchableOpacity>
        </View>
      </View></View></Modal>
      
      <Modal visible={showAlert} transparent><View style={styles.modalContainer}><View style={styles.modalBox}>
        <Ionicons name={alertConfig.type === 'success' ? "checkmark-circle" : "alert-circle"} size={50} color={alertConfig.type === 'success' ? "#4CAF50" : "#D32F2F"} />
        <Text style={styles.modalTitle}>{alertConfig.title}</Text>
        <Text style={styles.modalText}>{alertConfig.message}</Text>
        <TouchableOpacity style={styles.btnMain} onPress={handleCloseAlert}>
           <Text style={styles.btnText}>OK</Text>
        </TouchableOpacity>
      </View></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  card: { width: '85%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 25, elevation: 5 },
  logoContainer: { alignItems: 'center' },
  logo: { width: 80, height: 80 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F', textAlign: 'center', marginVertical: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#EEE', marginBottom: 15, paddingRight: 5 },
  inputWithIcon: { flex: 1, padding: 10, fontSize: 14 },
  btnMain: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, marginTop: 10, width: '100%' },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  btnAction: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  footerContainer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#D32F2F', fontWeight: 'bold', textDecorationLine: 'underline' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: 'white', padding: 25, borderRadius: 15, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  modalText: { textAlign: 'center', color: '#666', marginBottom: 20 }
});