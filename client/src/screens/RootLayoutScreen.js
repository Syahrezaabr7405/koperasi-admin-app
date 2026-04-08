import React, { useState, useEffect } from 'react'; // Tambah useState & useEffect
import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext'; 
import { StatusBar, SafeAreaView, View } from 'react-native'; 
import Head from 'expo-router/head';

export default function RootLayoutScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cegah render sebelum browser siap
  if (!isMounted) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Head>
        <title>Koperasi Merah Putih</title>
        <meta name="description" content="Aplikasi Koperasi Jati" />
      </Head>

      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot" options={{ headerShown: false }} />
          <Stack.Screen name="main" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </View>
  );
}