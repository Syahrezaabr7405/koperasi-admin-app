import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, 
  ScrollView, Button, StatusBar, SafeAreaView, Image, Modal, Platform 
} from 'react-native';

import * as XLSX from 'xlsx'; 
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

import { useRouter } from 'expo-router';
import { 
  getOrders, updateOrderStatus, getProducts, addProduct, 
  deleteProduct, getUsers, updateBalance, getTopUpHistory, 
  getTopUpRequests, approveTopUp 
} from '../src/services/api';
import { useCart } from '../src/CartContext';

export default function AdminScreen() {
  const router = useRouter();
  const { setUser } = useCart();
  const [activeTab, setActiveTab] = useState('orders'); 
  
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [topupRequests, setTopupRequests] = useState([]);
  const [topupHistory, setTopupHistory] = useState([]);
  
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertData, setCustomAlertData] = useState({
    title: '', message: '', onConfirm: null, showCancel: false
  });

  const [showAmountModal, setShowAmountModal] = useState(false); 
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('50000');

  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState(null);

  const showAlert = (title, message, onConfirm = null) => {
    setCustomAlertData({
      title, message, onConfirm, showCancel: onConfirm !== null 
    });
    setShowCustomAlert(true);
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = () => {
    if(activeTab === 'orders') fetchOrders();
    if(activeTab === 'products') fetchProducts();
    if(activeTab === 'members') fetchUsers();
    if(activeTab === 'approve') fetchTopUpRequests();
    if(activeTab === 'database') {
        fetchUsers();
        fetchTopUpHistory();
    }
  };

  // --- API CALLS WITH ID MAPPING ---
  const fetchOrders = async () => {
    const data = await getOrders();
    setOrders(Array.isArray(data) ? data.reverse() : []); 
  };

  const fetchProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const fetchTopUpRequests = async () => {
    const data = await getTopUpRequests();
    setTopupRequests(data);
  };

  const fetchTopUpHistory = async () => {
    const data = await getTopUpHistory();
    setTopupHistory(data);
  };

  // --- LOGIC FUNCTIONS ---
  const openAmountModal = (user) => {
    setSelectedUser(user);
    setTopUpAmount('50000'); 
    setShowAmountModal(true);
  };

  const proceedToConfirm = () => {
    const amount = parseInt(topUpAmount);
    if(!amount || amount < 1000) {
      setShowAmountModal(false);
      return showAlert('Kesalahan', 'Minimal Top Up Rp 1.000');
    }
    setShowAmountModal(false); 
    setShowConfirmModal(true);  
  };

  const confirmTopUp = async () => {
    setShowConfirmModal(false);
    // CRITICAL: Gunakan _id untuk MongoDB
    const targetId = selectedUser._id || selectedUser.id;
    const res = await updateBalance(targetId, parseInt(topUpAmount), 'topup');
    if(res.success) {
      fetchUsers(); 
      showAlert('Berhasil', 'Saldo berhasil ditambahkan.');
    } else {
      showAlert('Gagal', res.message || 'Gagal update saldo.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    showAlert('Konfirmasi', `Ubah status pesanan menjadi "${newStatus}"?`, async () => {
        try {
            await updateOrderStatus(orderId, newStatus);
            fetchOrders(); 
        } catch (error) {
            showAlert('Gagal', 'Gagal memperbarui status.');
        }
    });
  };

  const handleAddProduct = async () => {
    if(!newProdName || !newProdPrice) {
      return showAlert('Data Kosong', 'Nama Produk dan Harga wajib diisi.');
    }
    const res = await addProduct({ 
      name: newProdName, 
      price: Number(newProdPrice), // Pastikan Number
      image: newProdImage 
    });
    
    setNewProdName(''); setNewProdPrice(''); setNewProdImage(null);
    fetchProducts();
    showAlert('Berhasil', 'Produk berhasil ditambahkan.');
  };

  const handleDeleteProduct = async (id) => {
    showAlert('Hapus Produk', 'Yakin Anda ingin menghapus produk ini?', async () => {
      await deleteProduct(id);
      fetchProducts();
    });
  };

  const handleApproveTopUp = async (requestId) => {
    const res = await approveTopUp(requestId);
    if(res.success) {
      fetchTopUpRequests();
      showAlert('Sukses', 'Top Up Diterima.');
    } else {
      showAlert('Gagal', 'Gagal menyetujui Top Up.');
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        setNewProdImage(`data:image/jpeg;base64,${base64Data}`);
      }
    } catch (error) {
      showAlert('Error Foto', 'Gagal mengambil foto.');
    }
  };

  const handleExportExcel = async () => {
    try {
      if (users.length === 0) return showAlert('Perhatian', 'Data anggota kosong.');
      const dataToWrite = users.map(u => ({
        Username: u.username,
        Nama: u.name,
        NIK: u.nik || '-',
        Saldo: u.balance,
      }));
      const ws = XLSX.utils.json_to_sheet(dataToWrite);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DataKoperasi");
      
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + "DataAnggota.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: 'base64' });
      await shareAsync(uri);
    } catch (error) {
      showAlert('Gagal', 'Gagal export data.');
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: '#f0f0f0' }}> 
      <StatusBar barStyle="light-content" backgroundColor="#333" />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ADMIN PANEL</Text>
          <TouchableOpacity onPress={() => { setUser(null); router.replace('/'); }}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitch}>
          {['orders', 'products', 'members', 'approve', 'database'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTab]} 
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{fontWeight:'bold', fontSize: 10}}>{tab.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{flex:1}}>
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <View style={{padding: 10}}>
              {orders.map((order) => (
                <View key={order._id || order.id} style={styles.card}>
                  <Text style={styles.bold}>Order ID: {order._id || order.id}</Text>
                  <Text>User: {order.userName}</Text>
                  <Text style={styles.priceText}>Total: Rp {order.total}</Text>
                  <View style={styles.actions}>
                    <Button title="Proses" onPress={() => handleStatusChange(order._id || order.id, 'Diproses')} />
                    <Button title="Selesai" color="green" onPress={() => handleStatusChange(order._id || order.id, 'Selesai')} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <View style={{padding: 10}}>
              <View style={styles.formCard}>
                <TextInput placeholder="Nama Produk" style={styles.input} value={newProdName} onChangeText={setNewProdName} />
                <TextInput placeholder="Harga" style={styles.input} value={newProdPrice} onChangeText={setNewProdPrice} keyboardType="numeric" />
                <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
                  {newProdImage ? <Image source={{uri: newProdImage}} style={{width: 100, height: 100}} /> : <Text>Pilih Foto</Text>}
                </TouchableOpacity>
                <Button title="Tambah Produk" onPress={handleAddProduct} />
              </View>
              {products.map(p => (
                <View key={p._id || p.id} style={styles.prodItem}>
                  <Text>{p.name} - Rp {p.price}</Text>
                  <TouchableOpacity onPress={() => handleDeleteProduct(p._id || p.id)}>
                    <Text style={{color: 'red'}}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* APPROVE TAB */}
          {activeTab === 'approve' && (
            <View style={{padding: 10}}>
              {topupRequests.map((req) => (
                <View key={req._id || req.id} style={styles.card}>
                  <Text style={styles.bold}>{req.userName}</Text>
                  <Text>Nominal: Rp {req.amount}</Text>
                  <TouchableOpacity 
                    style={[styles.btnTopUp, {backgroundColor: '#4CAF50'}]} 
                    onPress={() => handleApproveTopUp(req._id || req.id)}
                  >
                    <Text style={{color: 'white'}}>Setujui</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* DATABASE TAB */}
          {activeTab === 'database' && (
            <View style={{padding: 10}}>
              <Button title="Export Excel" onPress={handleExportExcel} color="#4CAF50" />
              <View style={{marginTop: 10}}>
                {users.map(u => (
                  <View key={u._id || u.id} style={styles.row}>
                    <Text style={styles.cell}>{u.username}</Text>
                    <Text style={styles.cell}>{u.balance}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* MODALS (Custom Alert, Amount, Confirm) */}
      <Modal visible={showCustomAlert} transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{customAlertData.title}</Text>
            <Text>{customAlertData.message}</Text>
            <View style={{flexDirection: 'row', marginTop: 20, gap: 10}}>
              {customAlertData.showCancel && <Button title="Batal" onPress={() => setShowCustomAlert(false)} color="#888" />}
              <Button title="OK" onPress={() => { customAlertData.onConfirm?.(); setShowCustomAlert(false); }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL INPUT SALDO CUSTOM */}
      <Modal visible={showAmountModal} transparent animationType="slide">
         <View style={styles.alertOverlay}>
           <View style={styles.alertBox}>
             <Text style={styles.modalTitle}>Nominal Top Up</Text>
             <TextInput 
               style={styles.topUpInput} 
               keyboardType="numeric" 
               value={topUpAmount} 
               onChangeText={setTopUpAmount} 
             />
             <View style={{flexDirection: 'row', gap: 10}}>
               <Button title="Batal" onPress={() => setShowAmountModal(false)} color="#888" />
               <Button title="Lanjut" onPress={proceedToConfirm} />
             </View>
           </View>
         </View>
      </Modal>

      <Modal visible={showConfirmModal} transparent>
         <View style={styles.alertOverlay}>
           <View style={styles.alertBox}>
             <Text>Yakin tambah Rp {topUpAmount}?</Text>
             <View style={{flexDirection: 'row', marginTop: 20, gap: 10}}>
               <Button title="Batal" onPress={() => setShowConfirmModal(false)} color="#888" />
               <Button title="Ya, Tambah" onPress={confirmTopUp} color="green" />
             </View>
           </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },
  header: { flexDirection:'row', justifyContent:'space-between', padding: 15, backgroundColor: '#333' },
  title: { color: 'white', fontWeight: 'bold' },
  logout: { color: '#ff5555' },
  tabSwitch: { flexDirection:'row', backgroundColor:'white' },
  tabBtn: { flex:1, padding:12, alignItems:'center', borderBottomWidth:1, borderColor:'#ddd' },
  activeTab: { borderBottomWidth:3, borderColor:'#D32F2F' },
  card: { backgroundColor:'white', padding:15, marginBottom:10, borderRadius:8, elevation: 2 },
  bold: { fontWeight:'bold' },
  priceText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16, marginVertical: 5 },
  actions: { flexDirection:'row', gap:10, marginTop:10 },
  formCard: { backgroundColor:'white', padding:15, marginBottom:15 },
  input: { borderBottomWidth:1, borderColor:'#ccc', marginBottom:10, padding: 5 },
  uploadBox: { height: 120, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  prodItem: { flexDirection:'row', justifyContent:'space-between', padding:10, backgroundColor:'white', marginBottom:2 },
  btnTopUp: { padding: 10, borderRadius: 5, alignItems: 'center' },
  alertOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  alertBox: { width:'80%', backgroundColor:'white', padding:20, borderRadius:10, alignItems:'center' },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  topUpInput: { width: '100%', borderBottomWidth: 1, marginBottom: 20, textAlign: 'center', fontSize: 20 },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1, textAlign: 'center' }
});