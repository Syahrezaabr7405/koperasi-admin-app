// src/screens/MainTabs.js
import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ScrollView, Image } from 'react-native';
import { getProducts, updateBalance, createOrder } from '../services/api';
import { useCart } from '../CartContext';

const Tab = createBottomTabNavigator();

// Screen 1: Shop
function ShopScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Toko Koperasi</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.img} />
            <Text style={styles.prodName}>{item.name}</Text>
            <Text style={styles.price}>Rp {item.price}</Text>
            <TouchableOpacity style={styles.btnAdd} onPress={() => addToCart(item)}>
              <Text style={styles.txtBtn}>+ Keranjang</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Screen 2: Savings (Simpanan)
function SavingsScreen() {
  const { user, setUser } = useCart();

  const handleTopUp = async () => {
    const res = await updateBalance(user.id, 100000, 'topup');
    if(res.success) {
      setUser(res.user);
      Alert.alert('Sukses', 'Saldo bertambah Rp 100.000');
    }
  };

  const handlePokok = async () => {
    if(user.pokokPaid) return Alert.alert('Info', 'Sudah lunas');
    const res = await updateBalance(user.id, 50000, 'bayar_pokok');
    if(res.success) setUser(res.user);
    else Alert.alert('Gagal', res.message);
  };

  const handleWajib = async () => {
    const res = await updateBalance(user.id, 10000, 'bayar_wajib');
    if(res.success) setUser(res.user);
    else Alert.alert('Gagal', res.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Simpanan & Saldo</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.lblSaldo}>Saldo Anda:</Text>
        <Text style={styles.valSaldo}>Rp {user?.balance || 0}</Text>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={handleTopUp}>
        <Text style={styles.txtAction}>+ Tambah Saldo (Simulasi)</Text>
      </TouchableOpacity>

      <View style={styles.savingsBox}>
        <Text style={styles.savingTitle}>Simpanan Pokok (Rp 50.000)</Text>
        <Text>Status: {user?.pokokPaid ? 'LUNAS' : 'BELUM'}</Text>
        <TouchableOpacity disabled={user?.pokokPaid} style={styles.btnPay} onPress={handlePokok}>
          <Text style={styles.txtBtn}>Bayar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.savingsBox}>
        <Text style={styles.savingTitle}>Simpanan Wajib (Rp 10.000)</Text>
        <Text>Total Bulan: {user?.wajibMonths || 0}</Text>
        <TouchableOpacity style={styles.btnPay} onPress={handleWajib}>
          <Text style={styles.txtBtn}>Bayar Bulan Ini</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Screen 3: Cart
function CartScreen() {
  const { cart, removeFromCart, clearCart, cartTotal, user } = useCart();
  const [address, setAddress] = useState('');

  const handleCheckout = async () => {
    if(cart.length === 0) return;
    if(!address) return Alert.alert('Error', 'Isi alamat pengiriman');
    
    const res = await createOrder({
      userId: user.id,
      cartItems: cart,
      total: cartTotal,
      address: address
    });

    if(res.success) {
      Alert.alert('Sukses', 'Pesanan dibuat! Saldo terpotong.');
      setUser(res.user); // Update saldo user
      clearCart();
      setAddress('');
    } else {
      Alert.alert('Gagal', res.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Keranjang</Text>
      {cart.map((item, index) => (
        <View key={index} style={styles.cartItem}>
          <Text>{item.name}</Text>
          <Text>Rp {item.price}</Text>
          <Text style={{color:'red'}} onPress={() => removeFromCart(index)}>Hapus</Text>
        </View>
      ))}
      <Text style={styles.total}>Total: Rp {cartTotal}</Text>
      <TextInput placeholder="Alamat Pengiriman" style={styles.input} value={address} onChangeText={setAddress} />
      <Button title="Checkout (QRIS Admin)" onPress={handleCheckout} color="#D32F2F" />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ activeTintColor: '#D32F2F' }}>
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarLabel: 'Belanja' }} />
      <Tab.Screen name="Savings" component={SavingsScreen} options={{ tabBarLabel: 'Simpanan' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Keranjang' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { flex: 1, backgroundColor: 'white', padding: 10, margin: 5, borderRadius: 8, alignItems: 'center' },
  img: { width: 80, height: 80, marginBottom: 5, borderRadius: 4 },
  prodName: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  price: { color: '#D32F2F', fontWeight: 'bold', marginBottom: 5 },
  btnAdd: { backgroundColor: '#D32F2F', padding: 5, borderRadius: 4 },
  txtBtn: { color: 'white', fontSize: 10 },
  balanceCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20, alignItems: 'center' },
  lblSaldo: { fontSize: 16 }, valSaldo: { fontSize: 28, fontWeight: 'bold', color: '#D32F2F' },
  actionBtn: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  txtAction: { color: 'white', fontWeight: 'bold' },
  savingsBox: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10 },
  savingTitle: { fontWeight: 'bold', marginBottom: 5 },
  btnPay: { backgroundColor: '#333', padding: 8, borderRadius: 4, marginTop: 5, alignItems: 'center' },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 10, marginBottom: 5, borderRadius: 5 },
  total: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, textAlign: 'right' },
  input: { backgroundColor: 'white', padding: 10, borderRadius: 5, marginBottom: 10 }
});