import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Image, 
  Button, 
  StatusBar, 
  SafeAreaView,
  Modal 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; 
import { useRouter } from 'expo-router';

// Imports internal
import TopUpScreen from './src/screens/TopUpScreen'; 
import { 
  getProducts, 
  updateBalance, 
  createOrder, 
  getOrders 
} from '../src/services/api';
import { useCart } from '../src/CartContext';

export default function MainScreen() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, user, setUser } = useCart();
  
  // UI States
  const [activeTab, setActiveTab] = useState('shop'); 
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState('');
  
  // Modals States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', onConfirm: null, showCancel: false });

  // 1. Inisialisasi User & Sinkronisasi LocalStorage
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const isWeb = typeof window !== 'undefined' && window.localStorage;
        if (isWeb) {
          const savedUser = localStorage.getItem('koperasi_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else if (!user) {
            router.replace('/');
          }
        } else {
          if (!user) router.replace('/');
        }
      } catch (e) {
        console.error("Gagal load user:", e);
      }
    };
    loadUserFromStorage();
  }, []);

  // 2. Fetch Data berdasarkan Tab Aktif
  useEffect(() => {
    if (activeTab === 'shop') fetchProducts();
    if (activeTab === 'cart' && user) fetchOrders();
  }, [activeTab, user]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const data = await getOrders();
      const currentUserId = user._id || user.id;
      const myOrders = data.filter(o => o.userId === currentUserId);
      setOrders(myOrders.reverse());
    } catch (err) {
      console.error("Fetch orders error:", err);
    }
  };

  // 3. Helper Alert Kustom
  const showAlert = (title, message, onConfirm = null) => {
    setAlertData({
      title,
      message,
      onConfirm,
      showCancel: onConfirm !== null
    });
    setShowCustomAlert(true);
  };

  const handleConfirmAlert = async () => {
    if (alertData.onConfirm) await alertData.onConfirm();
    setShowCustomAlert(false);
  };

  // 4. Logika Transaksi (Simpanan & Checkout)
  const handleWajib = async () => {
    if (!user) return;

    const biayaWajib = 10000;
    const saldoSaatIni = user.balance || 0;

    if (saldoSaatIni < biayaWajib) {
      return showAlert('Gagal', `Saldo kurang.\nSaldo: Rp ${saldoSaatIni}\nIuran: Rp ${biayaWajib}`);
    }

    // Validasi apakah bulan ini sudah bayar
    const now = new Date();
    const lastPaid = user.lastPaidWajib ? new Date(user.lastPaidWajib) : null;
    if (lastPaid && now.getMonth() === lastPaid.getMonth() && now.getFullYear() === lastPaid.getFullYear()) {
      return showAlert('Info', 'Simpanan Wajib bulan ini sudah lunas.');
    }

    showAlert('Konfirmasi', `Bayar iuran wajib Rp ${biayaWajib}?`, async () => {
      const res = await updateBalance(user._id || user.id, biayaWajib, 'wajib');
      if (res.success) {
        setUser(res.user);
        showAlert('Berhasil', `Pembayaran Berhasil!\nTotal: ${res.user.wajibMonths} Bulan`);
      } else {
        showAlert('Gagal', res.message);
      }
    });
  };

  const handlePokok = async () => {
    if (user.pokokPaid) return showAlert('Lunas', 'Simpanan Pokok sudah lunas!');
    
    showAlert('Konfirmasi', 'Bayar Simpanan Pokok Rp 50.000?', async () => {
      const res = await updateBalance(user._id || user.id, 50000, 'pokok');
      if (res.success) {
        setUser(res.user);
        showAlert('Berhasil', 'Simpanan Pokok Lunas!');
      } else {
        showAlert('Gagal', res.message || 'Saldo tidak cukup');
      }
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showAlert('Kosong', 'Keranjang masih kosong.');
    if (!address.trim()) return showAlert('Alamat', 'Silakan isi alamat pengiriman.');

    try {
      const res = await createOrder({ 
        userId: user._id || user.id, 
        cartItems: cart, 
        total: cartTotal, 
        address: address 
      });

      if (res.success) {
        showAlert('Sukses', 'Pesanan berhasil dibuat!');
        setUser(res.user);
        clearCart();
        setAddress('');
        fetchOrders();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal terhubung ke server.';
      showAlert('Gagal', msg);
    }
  };

  const confirmLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('koperasi_user');
    router.replace('/');
  };

  // 5. Render Components
  const renderShop = () => (
    <View style={styles.contentPadding}>
      <Text style={styles.headerTitle}>Toko Koperasi</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => (item._id || item.id).toString()}
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

  const renderCart = () => (
    <View style={styles.contentPadding}>
      <Text style={styles.headerTitle}>Keranjang & Riwayat</Text>
      
      {/* Bagian Checkout */}
      <View style={styles.checkoutSection}>
        {cart.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <Text style={{flex:1}}>{item.name}</Text>
            <Text style={{marginRight: 10}}>Rp {item.price}</Text>
            <TouchableOpacity onPress={() => removeFromCart(index)}>
              <Ionicons name="trash-outline" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}
        <Text style={styles.total}>Total: Rp {cartTotal}</Text>
        <TextInput 
          placeholder="Alamat Pengiriman Lengkap" 
          style={styles.input} 
          value={address} 
          onChangeText={setAddress} 
        />
        <Button title="Checkout Sekarang" onPress={handleCheckout} color="#D32F2F" />
      </View>

      {/* Bagian History */}
      <Text style={styles.subTitle}>Lacak Pesanan</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada riwayat pesanan.</Text>
      ) : (
        orders.map((order) => (
          <View key={order._id || order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>ID: {(order._id || order.id).slice(-6)}</Text>
              <Text style={[styles.statusBadge, styles[`status${order.status.replace(/\s/g, '')}`]]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.orderDetail}>Total: Rp {order.total}</Text>
            <Text style={styles.orderDate}>{new Date(order.date).toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderSavings = () => (
    <View style={styles.contentPadding}>
      <Text style={styles.headerTitle}>Simpanan & Saldo</Text>
      
      <View style={styles.balanceCard}>
        <Text style={styles.lblSaldo}>Saldo Aktif:</Text>
        <Text style={styles.valSaldo}>Rp {user?.balance || 0}</Text>
      </View>

      <TouchableOpacity style={styles.topUpBtn} onPress={() => setIsTopUpVisible(true)}>
        <Text style={styles.txtWhite}>+ Top Up Saldo</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <View style={[styles.statusCard, { borderColor: user?.pokokPaid ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.cardLabel}>Pokok</Text>
          <Text style={styles.cardValue}>{user?.pokokPaid ? '✅ Lunas' : '⏳ Belum'}</Text>
          {!user?.pokokPaid && (
            <TouchableOpacity style={styles.smallBtn} onPress={handlePokok}>
              <Text style={styles.txtWhiteSmall}>Bayar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.statusCard, { borderColor: '#D32F2F' }]}>
          <Text style={styles.cardLabel}>Wajib</Text>
          <Text style={styles.cardValue}>{user?.wajibMonths || 0} Bulan</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={handleWajib}>
            <Text style={styles.txtWhiteSmall}>Bayar Iuran</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header Profile */}
      <View style={styles.topProfile}>
        <View style={styles.rowAlignCenter}>
          <Ionicons name="person-circle" size={45} color="#D32F2F" />
          <View style={{marginLeft: 10}}>
            <Text style={styles.greet}>Selamat datang,</Text>
            <Text style={styles.name}>{user?.name || 'Member'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="log-out-outline" size={26} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{flex:1}}>
        {activeTab === 'shop' && renderShop()}
        {activeTab === 'cart' && renderCart()}
        {activeTab === 'savings' && renderSavings()}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabItem icon="cart" label="Belanja" active={activeTab === 'shop'} onPress={() => setActiveTab('shop')} />
        <TabItem icon="wallet" label="Simpanan" active={activeTab === 'savings'} onPress={() => setActiveTab('savings')} />
        <TabItem icon="basket" label={`Keranjang (${cart.length})`} active={activeTab === 'cart'} onPress={() => setActiveTab('cart')} />
      </View>

      {/* Modals */}
      <CustomAlert visible={showCustomAlert} data={alertData} onConfirm={handleConfirmAlert} onCancel={() => setShowCustomAlert(false)} />
      
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Keluar Akun?</Text>
            <View style={styles.row}>
              <Button title="Batal" onPress={() => setShowLogoutModal(false)} color="#888" />
              <Button title="Ya, Keluar" onPress={confirmLogout} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isTopUpVisible} animationType="slide">
        <SafeAreaView style={{flex:1}}>
          <TouchableOpacity style={styles.closeModal} onPress={() => setIsTopUpVisible(false)}>
            <Ionicons name="close" size={30} color="#D32F2F" />
          </TouchableOpacity>
          <TopUpScreen user={user} onTopUpSuccess={() => { setIsTopUpVisible(false); }} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Sub-komponen Tab
const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={`${icon}${active ? '' : '-outline'}`} size={22} color={active ? '#D32F2F' : '#999'} />
    <Text style={[styles.tabLabel, active && {color:'#D32F2F'}]}>{label}</Text>
  </TouchableOpacity>
);

// Sub-komponen Alert
const CustomAlert = ({ visible, data, onConfirm, onCancel }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>{data.title}</Text>
        <Text style={styles.alertMsg}>{data.message}</Text>
        <View style={styles.row}>
          {data.showCancel && <Button title="Batal" onPress={onCancel} color="#888" />}
          <Button title={data.showCancel ? "Lanjut" : "OK"} onPress={onConfirm} color="#D32F2F" />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  topProfile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#EEE' },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'center' },
  greet: { fontSize: 12, color: '#888' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  contentPadding: { padding: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  subTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  
  // Shop
  card: { flex: 1, backgroundColor: 'white', padding: 12, margin: 6, borderRadius: 12, alignItems: 'center', elevation: 2 },
  img: { width: 90, height: 90, borderRadius: 8, marginBottom: 10 },
  prodName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  price: { color: '#D32F2F', fontWeight: 'bold', marginVertical: 5 },
  btnAdd: { backgroundColor: '#D32F2F', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  txtBtn: { color: 'white', fontSize: 11 },

  // Cart & Orders
  checkoutSection: { backgroundColor: 'white', padding: 15, borderRadius: 12, elevation: 1 },
  cartItem: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#EEE' },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginVertical: 15 },
  input: { borderAround: 1, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15 },
  orderCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: 'bold', color: '#555' },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  statusSedangDiproses: { backgroundColor: '#FFF3E0', color: '#EF6C00' },
  statusDikirim: { backgroundColor: '#E3F2FD', color: '#1565C0' },
  statusSelesai: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },

  // Savings
  balanceCard: { backgroundColor: '#2E7D32', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  lblSaldo: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  valSaldo: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  topUpBtn: { backgroundColor: '#1976D2', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statusCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 15, borderWidth: 2, alignItems: 'center' },
  cardLabel: { fontSize: 12, color: '#666' },
  cardValue: { fontSize: 16, fontWeight: 'bold', marginVertical: 5 },
  smallBtn: { backgroundColor: '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  txtWhiteSmall: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  txtWhite: { color: 'white', fontWeight: 'bold' },

  // Tabs
  tabBar: { flexDirection: 'row', height: 70, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#EEE', paddingBottom: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, color: '#999', marginTop: 4 },

  // Modals & Alerts
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '80%', backgroundColor: 'white', padding: 25, borderRadius: 15, alignItems: 'center' },
  alertBox: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 20 },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  alertMsg: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' },
  closeModal: { padding: 20, alignSelf: 'flex-end' }
});