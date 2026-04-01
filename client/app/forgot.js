import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Ionicons from '@expo/vector-icons/Ionicons';

// Ganti URL sesuai dengan API_URL di api.js kamu
const API_URL = 'https://koperasi-admin-app-jknh.vercel.app'; 

export default function ForgotScreen() {
  const router = useRouter();
  
  // State Logic
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Input OTP & New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nik: '', email: '', otp: '', newPassword: '' });

  // 1. Fungsi Minta OTP
  const handleRequestOTP = async () => {
    if (!formData.nik || !formData.email) {
      return Alert.alert("Error", "NIK dan Email wajib diisi");
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/forgot-password`, {
        nik: formData.nik,
        email: formData.email
      });

      if (response.data.success) {
        Alert.alert("Berhasil", "Kode OTP telah dikirim ke email Anda.");
        setStep(2); // Pindah ke form ganti password
      }
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.message || "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fungsi Reset Password
  const handleResetPassword = async () => {
    if (!formData.otp || !formData.newPassword) {
      return Alert.alert("Error", "OTP dan Password baru wajib diisi");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/reset-password`, {
        nik: formData.nik,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        Alert.alert("Sukses", "Password berhasil diubah. Silakan login kembali.", [
          { text: "OK", onPress: () => router.replace('/') }
        ]);
      }
    } catch (error) {
      Alert.alert("Gagal", error.response?.data?.message || "OTP salah atau kadaluwarsa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        
        {step === 1 ? (
          <>
            <Text style={styles.subtitle}>Masukkan NIK dan Email yang terdaftar untuk menerima kode OTP.</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput 
                placeholder="Masukkan NIK" 
                style={styles.input} 
                onChangeText={(t) => setFormData({...formData, nik: t})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput 
                placeholder="Masukkan Email Terdaftar" 
                style={styles.input} 
                onChangeText={(t) => setFormData({...formData, email: t})}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleRequestOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Kirim Kode OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Masukkan kode 6-digit yang dikirim ke email dan password baru Anda.</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput 
                placeholder="Kode OTP" 
                style={styles.input} 
                onChangeText={(t) => setFormData({...formData, otp: t})}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#D32F2F" style={styles.icon} />
              <TextInput 
                placeholder="Password Baru" 
                style={styles.input} 
                secureTextEntry
                onChangeText={(t) => setFormData({...formData, newPassword: t})}
              />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} style={{marginTop: 15}}>
              <Text style={{color: '#D32F2F', textAlign: 'center'}}>Kirim ulang kode OTP?</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#D32F2F', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, height: 50,
    borderWidth: 1, borderColor: '#EEE'
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  btnPrimary: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnBack: { marginTop: 25, alignItems: 'center' },
  btnBackText: { color: '#888', fontWeight: '500' }
});