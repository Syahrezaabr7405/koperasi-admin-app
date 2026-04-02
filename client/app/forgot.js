import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, Modal, Keyboard 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_URL = 'https://koperasi-admin-app-jknh.vercel.app'; 

export default function ForgotScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Alur: 1 (Form NIK/Email), 2 (Input OTP), 3 (Input Password Baru)
  const [step, setStep] = useState(1); 
  
  const [formData, setFormData] = useState({ nik: '', email: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- STEP 1: VALIDASI NIK & EMAIL ---
  const handleRequestOTP = async () => {
    if (!formData.nik || !formData.email) {
      return Alert.alert("Peringatan", "NIK dan Email wajib diisi.");
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        nik: formData.nik,
        email: formData.email
      });
      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP telah dikirim ke email Anda.");
        setStep(2); 
      }
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.message || "Data tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFIKASI OTP ---
  const handleVerifyOTP = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) {
      return Alert.alert("Error", "Masukkan 6 digit OTP");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/verify-otp`, {
        nik: formData.nik,
        otp: finalOtp
      });

      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP sesuai.");
        setStep(3); 
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Kode OTP tidak sesuai atau kedaluwarsa.";
      Alert.alert("Gagal", msg);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: UPDATE PASSWORD BARU ---
  const handleUpdatePassword = async () => {
    Keyboard.dismiss();
    if (!formData.newPassword || !formData.confirmPassword) {
      return Alert.alert("Error", "Semua kolom wajib diisi.");
    }

    if (formData.newPassword.length < 6) {
      return Alert.alert("Error", "Password minimal harus 6 karakter.");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return Alert.alert("Error", "Konfirmasi password tidak cocok.");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        nik: formData.nik,
        otp: otp.join(''),
        newPassword: formData.newPassword
      });

      if (response.data.success || response.status === 200) {
        // TAMPILKAN MODAL CUSTOM
        setModalMessage("Password baru telah berhasil disimpan, silahkan kembali ke halaman login");
        setShowSuccessModal(true);
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || "Terjadi kesalahan pada server.";
      Alert.alert("Gagal", serverMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper Input OTP
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lupa Password</Text>

        {/* --- TAMPILAN STEP 1: FORM AWAL --- */}
        {step === 1 && (
          <>
            <Text style={styles.subtitle}>Masukkan NIK dan Email aktif Anda.</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput placeholder="NIK Anda" style={styles.input} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, nik: t})} />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput placeholder="Email Aktif" style={styles.input} autoCapitalize="none" onChangeText={(t) => setFormData({...formData, email: t})} />
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleRequestOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Lanjutkan</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* --- TAMPILAN STEP 2: INPUT 6 KOTAK OTP --- */}
        {step === 2 && (
          <>
            <Text style={styles.subtitle}>Masukkan 6 digit kode OTP dari email Anda.</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  onChangeText={(v) => handleOtpChange(v, index)}
                  onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1].focus()}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verifikasi Kode</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={{marginTop: 15}}><Text style={{textAlign:'center', color:'#888'}}>Ganti Email</Text></TouchableOpacity>
          </>
        )}

        {/* --- TAMPILAN STEP 3: RESET PASSWORD --- */}
        {step === 3 && (
          <>
            <Text style={styles.subtitle}>Buat password baru yang aman.</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput placeholder="Password Baru" style={styles.input} secureTextEntry onChangeText={(t) => setFormData({...formData, newPassword: t})} />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput placeholder="Konfirmasi Password Baru" style={styles.input} secureTextEntry onChangeText={(t) => setFormData({...formData, confirmPassword: t})} />
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleUpdatePassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Simpan Password</Text>}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnBackText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>

      {/* --- CUSTOM ALERT MODAL --- */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="white" />
            </View>
            
            <Text style={styles.modalTitle}>Berhasil!</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            
            <TouchableOpacity 
              style={styles.modalBtn} 
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/');
              }}
            >
              <Text style={styles.modalBtnText}>Ke Halaman Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  card: { padding: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 55, borderWidth: 1, borderColor: '#EEE'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  btnPrimary: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnBack: { marginTop: 30, alignItems: 'center' },
  btnBackText: { color: '#888', fontWeight: '500' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  otpInput: {
    width: 45, height: 55, backgroundColor: '#F5F5F5', borderRadius: 10,
    borderWidth: 1, borderColor: '#DDD', textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#D32F2F'
  },
  // --- STYLES UNTUK MODAL CUSTOM ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});