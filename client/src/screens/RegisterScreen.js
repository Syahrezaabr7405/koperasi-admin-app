// src/screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { registerUser } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', nik: '', phone: '', email: '' });

  const handleRegister = async () => {
    if(!formData.name || !formData.username || !formData.password || !formData.email) return Alert.alert('Error', 'Mohon lengkapi data');
    
    const result = await registerUser(formData);
    if (result.success) {
      Alert.alert('Sukses', 'Pendaftaran berhasil, silakan login');
      navigation.goBack();
    } else {
      Alert.alert('Gagal', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daftar Akun</Text>
      <TextInput placeholder="Nama Lengkap" style={styles.input} onChangeText={(t) => setFormData({...formData, name: t})} />
      <TextInput placeholder="NIK" style={styles.input} onChangeText={(t) => setFormData({...formData, nik: t})} />
      <TextInput placeholder="Email Aktif" style={styles.input} onChangeText={(t) => setFormData({...formData, email: t})} keyboardType="email-address"autoCapitalize="none"/>
      <TextInput placeholder="No HP" style={styles.input} onChangeText={(t) => setFormData({...formData, phone: t})} />
      <TextInput placeholder="Username" style={styles.input} onChangeText={(t) => setFormData({...formData, username: t})} />
      <TextInput placeholder="Password" style={styles.input} onChangeText={(t) => setFormData({...formData, password: t})} secureTextEntry />
      <Button title="Daftar" onPress={handleRegister} color="#D32F2F" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#D32F2F' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }
});