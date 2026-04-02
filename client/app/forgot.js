import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { verifyOTP, resetPassword } from '../src/services/api';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';

const API_URL = 'https://koperasi-admin-app-jknh.vercel.app'; 

export default function ForgotScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  // Alur: 1 (Form NIK/Email), 2 (Input OTP), 3 (Input Password Baru)
  const [step, setStep] = useState(1); 
  
  const [formData, setFormData] = useState({ nik: '', email: '', newPassword: '', confirmPassword: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const inputRefs = useRef([]);

  // --- STEP 1: VALIDASI NIK & EMAIL ---
  const handleRequestOTP = async () => {
    if (!formData.nik || !formData.email) {
      return Alert.alert("Peringatan", "NIK dan Email wajib diisi.");
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        nik: formData.nik,
        email: formData.email
      });
      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP telah dikirim ke email Anda.");
        setStep(2); // Pindah ke tampilan input OTP
      }
    } catch (error) {
      // Menampilkan pesan spesifik dari server (misal: "Email tidak terdaftar")
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
      // Pastikan URL API sudah benar (tanpa double /api jika perlu)
      const response = await axios.post(`${API_URL}/api/verify-otp`, {
        nik: formData.nik,
        otp: finalOtp
      });

      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP sesuai.");
        setStep(3); // Pindah ke tampilan Reset Password
      }
    } catch (error) {
      // Ambil pesan error spesifik dari backend (misal: "OTP sudah kedaluwarsa")
      const msg = error.response?.data?.message || "Kode OTP tidak sesuai atau kedaluwarsa.";
      
      // Jika error 404, berarti rutenya belum ada di server
      if (error.response?.status === 404) {
        Alert.alert("Error 404", "Rute API tidak ditemukan. Cek kembali URL di backend.");
      } else {
        Alert.alert("Gagal", msg);
      }

      console.log("Detail Error Verify:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: UPDATE PASSWORD BARU ---
  const handleUpdatePassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      return Alert.alert("Error", "Semua kolom wajib diisi.");
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return Alert.alert("Error", "Konfirmasi password tidak cocok.");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        nik: formData.nik,
        otp: otp.join(''),
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        Alert.alert("Sukses", "Password berhasil diubah!", [
          { text: "Kembali Login", onPress: () => router.replace('/') }
        ]);
      }
    } catch (error) {
      Alert.alert("Gagal", "Gagal memperbarui password.");
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
  }
});