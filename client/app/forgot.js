import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, ActivityIndicator, Modal, Keyboard 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_URL = 'https://koperasi-admin-app-jknh.vercel.app'; 

export default function ForgotScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({ nik: '', email: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  
  // State Tunggal untuk Modal Custom (Success & Error)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); 
  const [modalMessage, setModalMessage] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Fungsi pembantu untuk memicu Modal
  const showAlertCustom = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setShowModal(true);
  };

  // --- STEP 1: REQUEST OTP ---
  const handleRequestOTP = async () => {
    if (!formData.nik || !formData.email) {
      return showAlertCustom('error', "NIK dan Email wajib diisi.");
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        nik: formData.nik,
        email: formData.email
      });
      if (response.data.success) {
        setStep(2); 
      }
    } catch (error) {
      showAlertCustom('error', error.response?.data?.message || "Data tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFIKASI OTP ---
  const handleVerifyOTP = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) {
      return showAlertCustom('error', "Masukkan 6 digit OTP");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/verify-otp`, {
        nik: formData.nik,
        otp: finalOtp
      });

      if (response.data.success) {
        setStep(3); 
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Kode OTP tidak sesuai atau kedaluwarsa.";
      showAlertCustom('error', msg); 
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: RESET PASSWORD ---
  const handleUpdatePassword = async () => {
    Keyboard.dismiss();
    if (!formData.newPassword || !formData.confirmPassword) {
      return showAlertCustom('error', "Semua kolom wajib diisi.");
    }

    if (formData.newPassword.length < 6) {
      return showAlertCustom('error', "Password minimal harus 6 karakter.");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return showAlertCustom('error', "Konfirmasi password tidak cocok.");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        nik: formData.nik,
        otp: otp.join(''),
        newPassword: formData.newPassword
      });

      if (response.data.success || response.status === 200) {
        showAlertCustom('success', "Password baru berhasil disimpan, silakan login kembali.");
      }
    } catch (error) {
      showAlertCustom('error', error.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* --- REUSABLE CUSTOM MODAL --- */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.iconCircle, { backgroundColor: modalType === 'success' ? '#4CAF50' : '#D32F2F' }]}>
              <Ionicons name={modalType === 'success' ? "checkmark" : "close"} size={40} color="white" />
            </View>
            
            <Text style={styles.modalTitle}>{modalType === 'success' ? 'Berhasil!' : 'Ops!'}</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: modalType === 'success' ? '#4CAF50' : '#D32F2F' }]} 
              onPress={() => {
                setShowModal(false);
                if(modalType === 'success') router.replace('/');
              }}
            >
              <Text style={styles.modalBtnText}>{modalType === 'success' ? 'Ke Halaman Login' : 'Coba Lagi'}</Text>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  modalBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, width: '100%', alignItems: 'center' },
  modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});