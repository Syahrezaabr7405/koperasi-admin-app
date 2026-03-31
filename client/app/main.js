import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  TextInput, 
  ScrollView, 
  Image, 
  Button, 
  StatusBar, 
  SafeAreaView,
  Modal 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; 
import Logo from '../assets/images/Logo.jpeg'; 
import Background from '../assets/images/background.jpg';
import { useRouter } from 'expo-router';
import { 
  getProducts, 
  updateBalance, 
  createOrder, 
  requestTopUp,
  getOrders   
} from '../src/services/api';
import { useCart } from '../src/CartContext';

export default function MainScreen() {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, user, setUser } = useCart();
  const [activeTab, setActiveTab] = useState('shop'); 
  const [products, setProducts] = useState([]);
  const [address, setAddress] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // STATE MODAL TOP UP 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  // ---------------------------------

  const [userData, setUserData] = useState(null);
  
  // --- STATE PESANAN (POIN 2) ---
  const [orders, setOrders] = useState([]);
  // -------------------------------

  // --- STATE MODAL ALERT CUSTOM ---
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', onConfirm: null, showCancel: false });
  // --------------------------------------------------

  // Load User
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('koperasi_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setUserData(parsedUser);
        } else {
          // Jika tidak ada user di storage, paksa ke halaman login
          router.replace('/');
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('koperasi_user', JSON.stringify(user));
      } catch (e) {}
    }
  }, [user]);

  // --- EFFECT FETCH DATA (SHOP & ORDERS) ---
  useEffect(() => {
    if(activeTab === 'shop') fetchProducts();
    // Ambil order terbaru jika user ada dan tab keranjang aktif
    if(activeTab === 'cart' && user) fetchOrders(); 
  }, [activeTab, user]);
  // --------------------------------------------------

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  // --- FUNGSI FETCH ORDERS (POIN 3) ---
  const fetchOrders = async () => {
    if(!user) return;
    const data = await getOrders();
    // Ambil ID dengan aman
    const currentUserId = user._id || user.id;
    const myOrders = data.filter(o => o.userId === currentUserId);
    setOrders(myOrders.reverse());
  };
  // --------------------------------------------------

  // --- FUNGSI HELPER ALERT CUSTOM ---
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

  // --- LOGIKA TOP UP ---
  const handleTopUp = () => {
    setShowTopUpModal(true);
  };

  const selectAmount = (amount) => {
    setTopUpAmount(amount.toString());
  };

  const confirmTopUpRequest = async () => {
    const amountNum = parseInt(topUpAmount);
    if (!amountNum || amountNum < 5000) {
      return alert('Minimal top up adalah Rp 5.000');
    }

    setShowTopUpModal(false);
    const res = await requestTopUp(user.id, amountNum);
    if(res.success) {
      setTopUpAmount('');
      setShowInstructionModal(true);
    } else {
      alert('Gagal mengirim permintaan');
    }
  };

  // --- FUNGSI SIMPANAN WAJIB ---
  const handleWajib = async () => {
    const currentUser = user || localStorage.getItem('koperasi_user');
    
    if(!currentUser) return showAlert('Gagal', 'User data tidak ditemukan.');
    if (typeof currentUser === 'string') {
        try { currentUser = JSON.parse(currentUser); } catch(e) {}
    }

    const biayaWajib = 10000;
    const saldoSaatIni = currentUser.balance;

    if (saldoSaatIni < biayaWajib) {
      return showAlert('Gagal', `Saldo kurang.\nSaldo: Rp ${saldoSaatIni}\nBiaya: Rp ${biayaWajib}`);
    }

    // Cek Bulan Ini Sudah Lunas?
    const now = new Date();
    const lastPaid = currentUser.lastPaidWajib ? new Date(currentUser.lastPaidWajib) : null;
    let isLunasBulanIni = false;
    if (lastPaid) {
        const bulanIni = now.getMonth();
        const tahunIni = now.getFullYear();
        const bulanBayar = lastPaid.getMonth();
        const tahunBayar = lastPaid.getFullYear();
        isLunasBulanIni = (bulanIni === bulanBayar && tahunIni === tahunBayar);
    }

    if (isLunasBulanIni) {
      return showAlert('Info', 'Simpanan Wajib bulan ini sudah dibayar.\nSilakan bayar bulan depan.');
    }

    showAlert('Konfirmasi', `Bayar Iuran Wajib bulan ini sebesar Rp ${biayaWajib}?`, async () => {
       const res = await updateBalance(currentUser.id, biayaWajib, 'bayar_wajib');
       if (res.success) {
         const updatedUser = { ...currentUser, balance: res.user.balance, wajibMonths: res.user.wajibMonths + 1 };
         setUser(updatedUser);
         setUserData(updatedUser);
         try { localStorage.setItem('koperasi_user', JSON.stringify(updatedUser)); } catch(e) {}
         showAlert('Berhasil', `Pembayaran Wajib Berhasil!\nTotal Bulan: ${updatedUser.wajibMonths}`);
       } else {
         showAlert('Gagal', res.message || 'Gagal membayar.');
       }
    });
  };

  // --- FUNGSI SIMPANAN POKOK ---
  const handlePokok = async () => {
    if (user.pokokPaid) return showAlert('Lunas', 'Simpanan Pokok sudah lunas!');
    const res = await updateBalance(user.id, 250000, 'pay_pokok');
    if(res.success) {
      const currentUser = { ...user, balance: res.user.balance, pokokPaid: true };
      setUser(currentUser);
      setUserData(currentUser);
      showAlert('Berhasil', 'Simpanan Pokok Lunas!');
    } else {
      showAlert('Gagal', res.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !address) return showAlert('Kosong', 'Keranjang atau Alamat belum diisi.');
    const res = await createOrder({ userId: user._id || user.id, cartItems: cart, total: cartTotal, address });
    if (res.success) {
      showAlert('Sukses', 'Pesanan berhasil dibuat. Saldo dipotong.');
      setUser(res.user);
      setUserData(res.user);
      clearCart();
      setAddress('');
      // Refresh orders agar pesanan baru muncul di history
      fetchOrders();
    } else {
      showAlert('Gagal', res.message);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('koperasi_user'); // Bersihkan storage agar tidak auto-login lagi
    } catch (e) {}
    
    // Gunakan '/' untuk kembali ke halaman index utama di root folder app
    router.replace('/'); 
    setShowLogoutModal(false);
  };

  const renderContent = () => {
    if (activeTab === 'shop') {
      return (
        <View style={{padding: 15}}>
          <Text style={styles.headerTitle}>Toko Koperasi</Text>
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
    } else if (activeTab === 'cart') {
      return (
        // --- TAB KERANJANG + HISTORY (POIN 4) ---
        <View style={{padding: 15, paddingBottom: 80, flex:1}}>
          <Text style={styles.headerTitle}>Keranjang & Riwayat</Text>
          
          {/* 1. INPUT KERANJANG (ISI ALAMAT) */}
          <View style={{paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 20}}>
            {cart.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                <View style={{flex:1}}>
                  <Text style={{fontWeight:'bold'}}>{item.name}</Text>
                  <Text>Rp {item.price}</Text>
                </View>
                <TouchableOpacity style={{padding: 5}} onPress={() => removeFromCart(index)}>
                  <Text style={{color:'red', fontWeight:'bold'}}>Hapus</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.total}>Total: Rp {cartTotal}</Text>
            <TextInput placeholder="Alamat Pengiriman" style={styles.input} value={address} onChangeText={setAddress} />
            <Button title="Checkout (Pesan Sekarang)" onPress={handleCheckout} color="#D32F2F" />
          </View>

          {/* 2. HISTORY STATUS PESANAN */}
          <Text style={{fontWeight:'bold', marginBottom: 10, color:'#333'}}>Lacak Status Pesanan</Text>
          {orders.length === 0 ? (
             <Text style={{textAlign:'center', color:'#999', marginTop: 10}}>Belum ada pesanan.</Text>
          ) : (
            <View>
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 5}}>
                    <Text style={{fontWeight:'bold', color:'#333'}}>ID: {order.id}</Text>
                    <Text style={[styles.statusText, order.status === 'Sedang Diproses' && styles.statusProses, order.status === 'Dikirim' && styles.statusDikirim, order.status === 'Selesai' && styles.statusSelesai]}>
                      {order.status}
                    </Text>
                  </View>
                  <Text style={{fontSize:12, color:'#666', marginBottom: 5}}>Total: Rp {order.total}</Text>
                  <Text style={{fontSize:12, color:'#666', marginBottom: 5}}>Alamat: {order.address}</Text>
                  <Text style={{fontSize:10, color:'#999'}}>Tanggal: {new Date(order.date).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    } else if (activeTab === 'savings') {
      return (
        <View style={{padding: 15, paddingBottom: 80, flex:1}}>
          <Text style={styles.headerTitle}>Simpanan & Saldo</Text>
          
          {/* 1. CARD NOMINAL SALDO */}
          <View style={styles.balanceCard}>
            <Text style={styles.lblSaldo}>Saldo Aktif:</Text>
            <Text style={styles.valSaldo}>Rp {userData ? userData.balance : (user ? user.balance : 0)}</Text>
          </View>

          {/* 2. TOMBOL TOP UP */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleTopUp}>
             <Text style={styles.txtAction}>+ Top Up Saldo</Text>
          </TouchableOpacity>

          {/* 3. CARD STATUS POKOK & WAJIB */}
          <View style={styles.statusHeader}>
            <View style={[styles.statusCard, {borderColor: (userData ? userData.pokokPaid : user?.pokokPaid) ? '#4CAF50' : '#ff9800'}]}>
              <Text style={styles.statusTitle}>Simpanan Pokok</Text>
              <Text style={styles.statusValue}>{(userData ? userData.pokokPaid : user?.pokokPaid) ? '✅ Lunas' : '⏳ Belum Lunas'}</Text>
              <TouchableOpacity 
                disabled={(userData ? userData.pokokPaid : user?.pokokPaid)} 
                style={[styles.btnPayInline, (userData ? userData.pokokPaid : user?.pokokPaid) && {opacity:0.5}]} 
                onPress={handlePokok}
              >
                <Text style={styles.txtInline}>Bayar</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.statusCard, {borderColor: '#D32F2F'}]}>
              <Text style={styles.statusTitle}>Simpanan Wajib</Text>
              <Text style={styles.statusValue}>{(userData ? userData.wajibMonths : user?.wajibMonths || 0)} Bulan Lunas</Text>
              <TouchableOpacity 
                style={styles.btnPayInline} 
                onPress={handleWajib}
              >
                <Text style={styles.txtInline}>Bayar Bulan Ini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#D32F2F" />
      
      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <Ionicons name="person-circle-outline" size={40} color="#D32F2F" />
          <View style={styles.profileInfo}>
            <Text style={styles.greeting}>Halo,</Text>
            <Text style={styles.userName}>{user?.name || 'Member'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{flex:1}}>
        {renderContent()}
      </ScrollView>
      
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('shop')}>
          <Ionicons name="cart-outline" size={20} color={activeTab==='shop'?'#D32F2F':'#999'} />
          <Text style={[styles.tabText, activeTab==='shop'&&styles.activeText]}>Belanja</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('savings')}>
          <Ionicons name="wallet-outline" size={20} color={activeTab==='savings'?'#D32F2F':'#999'} />
          <Text style={[styles.tabText, activeTab==='savings'&&styles.activeText]}>Simpanan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('cart')}>
          <Ionicons name="basket-outline" size={20} color={activeTab==='cart'?'#D32F2F':'#999'} />
          <Text style={[styles.tabText, activeTab==='cart'&&styles.activeText]}>Keranjang ({cart.length})</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL LOGOUT */}
      {showLogoutModal && (
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Keluar Akun?</Text>
            <Text style={styles.modalText}>Apakah Anda yakin ingin keluar?</Text>
            <View style={styles.modalActions}>
              <Button title="Batal" onPress={() => setShowLogoutModal(false)} color="#888"/>
              <Button title="Ya" onPress={confirmLogout} color="#D32F2F"/>
            </View>
          </View>
        </View>
      )}

      {/* --- MODAL CUSTOM ALERT --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCustomAlert}
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.alertContainer}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{alertData.title}</Text>
            <Text style={styles.alertMessage}>{alertData.message}</Text>
            
            <View style={styles.alertActions}>
              {alertData.showCancel && (
                <Button title="Batal" onPress={() => setShowCustomAlert(false)} color="#888" />
              )}
              <Button 
                title={alertData.showCancel ? "Ya, Lanjut" : "OK"} 
                onPress={handleConfirmAlert} 
                color="#D32F2F" 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL TOP UP --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTopUpModal}
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.topUpModalBox}>
            <Text style={styles.modalTitle}>Isi Nominal Top Up</Text>
            
            <TextInput
              style={styles.topUpInput}
              placeholder="Masukkan jumlah (Contoh: 50000)"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />

            <Text style={styles.chipLabel}>Pilihan Cepat:</Text>
            <View style={styles.chipContainer}>
              {[50000, 100000, 200000, 300000, 500000, 1000000].map((val) => (
                <TouchableOpacity 
                  key={val} 
                  style={[styles.chip, parseInt(topUpAmount) === val && styles.chipActive]} 
                  onPress={() => selectAmount(val)}
                >
                  <Text style={[styles.chipText, parseInt(topUpAmount) === val && styles.chipTextActive]}>
                    {val >= 1000 ? (val/1000) + 'rb' : val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:20}}>
              <Button title="Batal" onPress={() => {setShowTopUpModal(false); setTopUpAmount('')}} color="#888" />
              <Button title="Lanjut" onPress={confirmTopUpRequest} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL INSTRUKSI --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showInstructionModal}
        onRequestClose={() => setShowInstructionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Permintaan Terkirim</Text>
            <Text style={styles.modalText}>Silakan transfer uang sesuai nominal ke rekening Admin:</Text>
            <View style={styles.bankInfo}>
              <Text style={{fontWeight:'bold'}}>Bank Seabank: 901704164483</Text>
              <Text style={{fontWeight:'bold'}}>a.n SYAHREZA ABROR ALVARIZQI</Text>
              <Text style={{fontWeight:'bold'}}>Bukti Transfer Konfirmasi ke nomor Admin 0899-8094-777</Text>
            </View>
            <View style={{marginTop:20}}>
              <Button title="Oke, Siap" onPress={() => setShowInstructionModal(false)} color="#4CAF50" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 20 },
  profileLeft: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 10 },
  greeting: { color: '#888', fontSize: 12 },
  userName: { color: '#333', fontSize: 18, fontWeight: 'bold' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', margin: 15, marginTop: 10, color: '#333' },
  card: { flex: 1, backgroundColor: 'white', padding: 10, margin: 5, borderRadius: 8, alignItems: 'center' },
  img: { width: 80, height: 80, marginBottom: 5, borderRadius: 4 },
  prodName: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  price: { color: '#D32F2F', fontWeight: 'bold', marginBottom: 5 },
  btnAdd: { backgroundColor: '#D32F2F', padding: 5, borderRadius: 4 },
  txtBtn: { color: 'white', fontSize: 10 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 10, marginHorizontal: 15, marginBottom: 5, borderRadius: 5 },
  total: { fontSize: 18, fontWeight: 'bold', marginVertical: 10, textAlign: 'right', marginRight: 15 },
  input: { backgroundColor: 'white', padding: 10, borderRadius: 5, marginHorizontal: 15, marginBottom: 10 },
  tabBar: { height: 60, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee' },
  tabItem: { flex: 1, alignItems: 'center' },
  tabText: { color: '#999', fontWeight: 'bold' },
  activeText: { color: '#D32F2F' },

  // Style Simpanan
  balanceCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginHorizontal: 15, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', elevation: 3 },
  lblSaldo: { fontSize: 14, color: '#666', marginBottom: 5 },
  valSaldo: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32' },

  actionBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 15, marginBottom: 20, elevation: 2 },
  txtAction: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statusCard: { flex: 1, padding: 20, borderRadius: 15, borderWidth: 1, backgroundColor: '#fff', alignItems: 'center', elevation: 2 },
  statusTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  statusValue: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  btnPayInline: { backgroundColor: '#333', padding: 8, borderRadius: 8, paddingHorizontal: 20 },
  txtInline: { color: 'white', fontSize: 12, fontWeight: 'bold' },

  // Style Tracking Pesanan (BARU)
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
    padding: 4,
    borderRadius: 4,
    color: '#fff'
  },
  statusProses: { backgroundColor: '#FFF3E0', color: '#FF9800' }, // Kuning
  statusDikirim: { backgroundColor: '#E3F2FD', color: '#2196F3' }, // Biru
  statusSelesai: { backgroundColor: '#E8F5E9', color: '#4CAF50' }, // Hijau

  // Style Modal General
  modalContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalBox: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  bankInfo: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, width: '100%', marginVertical: 10 },

  topUpModalBox: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 15, alignItems: 'center' },
  topUpInput: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, textAlign: 'center', backgroundColor: '#f9f9f9', marginBottom: 20 },
  chipLabel: { width: '100%', marginBottom: 10, fontWeight: 'bold', color: '#666' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  chip: { width: '48%', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center', marginBottom: 8 },
  chipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  chipText: { color: '#333', fontSize: 12 },
  chipTextActive: { color: 'white', fontWeight: 'bold' },

  // Style Alert Custom
  alertContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  alertBox: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 15, alignItems: 'center' },
  alertTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  alertMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  alertActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' }
});