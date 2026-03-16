// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { loginUser } from '../services/api';
import { useCart } from '../CartContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useCart();

  const handleLogin = async () => {
    const result = await loginUser(username, password);
    if (result.success) {
      setUser(result.user);
      navigation.replace('MainApp'); // Pindah ke halaman utama
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KOPERASI MERAH PUTIH</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Masuk" onPress={handleLogin} color="#D32F2F" />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Belum punya akun? Daftar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#D32F2F' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  link: { color: 'blue', marginTop: 15, textAlign: 'center' }
});