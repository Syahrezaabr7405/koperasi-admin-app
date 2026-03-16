import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ForgotScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Lupa Password?</Text>
        <Text style={styles.text}>
          Untuk keamanan data anggota, reset password tidak dapat dilakukan otomatis oleh sistem.
        </Text>
        
        <Text style={styles.label}>Solusinya:</Text>
        <Text style={styles.text}>
          1. Hubungi Admin via WhatsApp di nomor: {'\n'}
             <Text style={styles.phone}>0899-8094-777</Text>
          </Text>
        <Text style={styles.text}>
          2. Berikan Nama, Username, dan NIK Anda.
        </Text>
        <Text style={styles.text}>
          3. Admin akan mereset password Anda.
        </Text>
        <Text style={styles.text}>
          4. Admin akan memberikan password baru lewat pesan WA tersebut.
        </Text>

        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  card: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  text: { fontSize: 14, lineHeight: 22, color: '#333' },
  phone: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
  btnBack: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  btnText: { color: 'white', fontWeight: 'bold' }
});