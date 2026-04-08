import React from 'react';
import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext'; // Sesuaikan path karena sekarang di folder screens
import { StatusBar, SafeAreaView } from 'react-native'; 
import Head from 'expo-router/head';

export default function RootLayoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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