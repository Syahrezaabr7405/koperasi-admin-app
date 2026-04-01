import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_URL = 'https://koperasi-admin-app-jknh.vercel.app'; 

export default function ForgotScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false); // Pop-up OTP
  
  const [formData, setFormData] = useState({ nik: '', email: '', newPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array untuk 6 kotak OTP
  const inputRefs = useRef([]); // Ref untuk pindah fokus otomatis

  // 1. Fungsi Minta OTP (Step 1)
  const handleRequestOTP = async () => {
    if (!formData.nik || !formData.email || !formData.newPassword) {
      return Alert.alert("Data Kurang", "NIK, Email, dan Password baru wajib diisi terlebih dahulu.");
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        nik: formData.nik,
        email: formData.email
      });

      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP telah dikirim ke email Anda.");
        setShowOtpModal(true); // Munculkan pop-up kotak OTP
      }
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.message || "NIK atau Email tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fungsi Handle Input OTP (Pindah Fokus Otomatis)
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Pindah ke kotak berikutnya jika angka diisi
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Balik ke kotak sebelumnya jika dihapus (Backspace)
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // 3. Fungsi Verifikasi & Reset (Final Step)
  const handleFinalReset = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) return Alert.alert("Error", "Masukkan 6 digit OTP lengkap");

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        nik: formData.nik,
        otp: finalOtp,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setShowOtpModal(false);
        Alert.alert("Sukses", "Password berhasil diubah!", [{ text: "Login", onPress: () => router.replace('/') }]);
      }
    } catch (error) {
      Alert.alert("OTP Salah", "Kode yang Anda masukkan tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Isi data di bawah untuk memulai proses reset password.</Text>
        
        {/* FORM INPUT UTAMA */}
        <View style={styles.inputWrapper}>
          <Ionicons name="card-outline" size={20} color="#D32F2F" style={styles.icon} />
          <TextInput placeholder="Masukkan NIK" style={styles.input} onChangeText={(t) => setFormData({...formData, nik: t})} keyboardType="numeric" />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#D32F2F" style={styles.icon} />
          <TextInput placeholder="Masukkan Email" style={styles.input} onChangeText={(t) => setFormData({...formData, email: t})} autoCapitalize="none" />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.icon} />
          <TextInput placeholder="Buat Password Baru" style={styles.input} secureTextEntry onChangeText={(t) => setFormData({...formData, newPassword: t})} />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRequestOTP} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verifikasi & Kirim OTP</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnBackText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAL POP-UP KHUSUS 6 KOTAK OTP --- */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.otpBox}>
            <Text style={styles.otpTitle}>Verifikasi OTP</Text>
            <Text style={styles.otpSubtitle}>Masukkan 6 digit kode yang dikirim ke email Anda.</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleFinalReset} disabled={loading}>
               {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Konfirmasi OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowOtpModal(false)} style={{marginTop: 15}}>
              <Text style={{color: '#888'}}>Batal</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 55, borderWidth: 1, borderColor: '#EEE'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  btnPrimary: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnBack: { marginTop: 25, alignItems: 'center' },
  btnBackText: { color: '#888' },

  // Styles untuk Pop-up OTP
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  otpBox: { backgroundColor: 'white', width: '90%', padding: 25, borderRadius: 20, alignItems: 'center' },
  otpTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  otpSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  otpInput: {
    width: 45, height: 55, backgroundColor: '#F5F5F5', borderRadius: 10,
    borderWidth: 1, borderColor: '#DDD', textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#D32F2F'
  }
});