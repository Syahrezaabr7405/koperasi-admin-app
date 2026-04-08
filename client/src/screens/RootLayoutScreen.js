import React from 'react';
import { Stack } from 'expo-router';
import { CartProvider } from '../context/CartContext'; 
import { StatusBar, Platform, View } from 'react-native'; 

export default function RootLayoutScreen() {
  return (
    // Gunakan View biasa jika di Web, SafeAreaView hanya untuk Mobile
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />
      
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot" />
          <Stack.Screen name="main" />
          <Stack.Screen name="admin" />
        </Stack>
      </CartProvider>
    </View>
  );
}