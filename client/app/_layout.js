import React from 'react';
import { Stack } from 'expo-router';
import { CartProvider } from '../src/CartContext';
import { StatusBar, SafeAreaView } from 'react-native'; 
import Head from 'expo-router/head'; // 1. Tambahkan import ini

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 2. Tambahkan Head untuk konfigurasi Web */}
      <Head>
        <title>Koperasi App</title>
        <meta name="description" content="Aplikasi Koperasi JKNH" />
        <link rel="icon" href="/assets/favicon.png" /> 
      </Head>

      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot" options={{ headerShown: false }} />
          <Stack.Screen name="main" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </CartProvider>
    </SafeAreaView>
  );
}