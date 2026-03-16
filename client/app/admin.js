import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Button, 
  StatusBar, 
  SafeAreaView,
  Image,
  Modal,
  Platform
} from 'react-native';

// IMPORT LIBRARY EKSTRA
import * as XLSX from 'xlsx'; 
import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

import { useRouter } from 'expo-router';
import { 
  getOrders, 
  updateOrderStatus, 
  getProducts, 
  addProduct, 
  deleteProduct, 
  getUsers, 
  updateBalance,
  getTopUpHistory,
  getTopUpRequests,
  approveTopUp 
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
  
  // --- STATE CUSTOM ALERT BARU ---
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertData, setCustomAlertData] = useState({
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false
  });

  // --- STATE MODAL TOP UP SALDO (INPUT NOMINAL) ---
  const [showAmountModal, setShowAmountModal] = useState(false); 
  const [showConfirmModal, setShowConfirmModal] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('50000');

  // --- STATE PRODUK ---
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdImage, setNewProdImage] = useState(null);

  // --- HELPER FUNGSI ALERT CUSTOM ---
  const showAlert = (title, message, onConfirm = null) => {
    setCustomAlertData({
      title,
      message,
      onConfirm, 
      showCancel: onConfirm !== null 
    });
    setShowCustomAlert(true);
  };

  useEffect(() => {
    if(activeTab === 'orders') fetchOrders();
    if(activeTab === 'products') fetchProducts();
    if(activeTab === 'members') fetchUsers();
    if(activeTab === 'approve') fetchTopUpRequests();
    if(activeTab === 'database') {
        fetchUsers();
        fetchTopUpHistory();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    const data = await getOrders();
    setOrders(data.reverse()); 
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

  const handleExportExcel = async () => {
    try {
      if (users.length === 0) {
        return showAlert('Perhatian', 'Data anggota masih kosong.');
      }
      const dataToWrite = users.map(u => ({
        Username: u.username,
        Nama: u.name,
        NIK: u.nik || '-',
        NoHP: u.phone || '-',
        Saldo: u.balance,
        Role: u.role
      }));
      const ws = XLSX.utils.json_to_sheet(dataToWrite);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DataKoperasi");

      if (Platform.OS === 'web') {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "DataAnggota.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showAlert('Sukses', 'File Excel berhasil didownload.');
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = "DataAnggota_" + new Date().getTime() + ".xlsx";
        const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        const uri = directory + fileName;
        await FileSystem.writeAsStringAsync(uri, wbout, { encoding: 'base64' });
        await shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Simpan Data Excel',
          UTI: 'com.microsoft.excel.xlsx',
        });
        showAlert('Sukses', 'File Excel berhasil dibuat!');
      }
    } catch (error) {
      showAlert('Gagal', 'Gagal membuat Excel.');
    }
  };

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
    const res = await updateBalance(selectedUser.id, parseInt(topUpAmount), 'topup');
    if(res.success) {
      fetchUsers(); 
      showAlert('Berhasil', 'Saldo berhasil ditambahkan.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    showAlert('Konfirmasi', `Ubah status pesanan menjadi "${newStatus}"?`, async () => {
        await updateOrderStatus(orderId, newStatus);
        fetchOrders(); 
    });
  };

  const handleAddProduct = async () => {
    if(!newProdName || !newProdPrice) {
      return showAlert('Data Kosong', 'Nama Produk dan Harga wajib diisi.');
    }
    await addProduct({ name: newProdName, price: newProdPrice, image: newProdImage });
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

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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

  const handleApproveTopUp = async (id) => {
    await approveTopUp(id);
    fetchTopUpRequests();
    showAlert('Sukses', 'Top Up Diterima.');
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: '#f0f0f0' }}> 
      <StatusBar barStyle="light-content" backgroundColor="#333" />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ADMIN PANEL</Text>
          <TouchableOpacity onPress={() => { setUser(null); router.replace('/index'); }}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabSwitch}>
          <TouchableOpacity style={[styles.tabBtn, activeTab==='orders' && styles.activeTab]} onPress={() => setActiveTab('orders')}>
            <Text style={{fontWeight:'bold'}}>Pesanan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab==='products' && styles.activeTab]} onPress={() => setActiveTab('products')}>
            <Text style={{fontWeight:'bold'}}>Produk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab==='members' && styles.activeTab]} onPress={() => setActiveTab('members')}>
            <Text style={{fontWeight:'bold'}}>Saldo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab==='approve' && styles.activeTab]} onPress={() => setActiveTab('approve')}>
            <Text style={{fontWeight:'bold'}}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab==='database' && styles.activeTab]} onPress={() => setActiveTab('database')}>
            <Text style={{fontWeight:'bold'}}>Database</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{flex:1}}>
          {/* CONTENT: ORDERS - BAGIAN YANG DIMODIFIKASI */}
          {activeTab === 'orders' && (
            <View style={{padding: 10}}>
              {orders.length === 0 && <Text style={{textAlign:'center', marginTop:20}}>Belum ada pesanan.</Text>}
              {orders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.bold}>ID: {order.id}</Text>
                    <Text style={{fontSize: 10, color: 'gray'}}>{order.date || ''}</Text>
                  </View>
                  
                  <Text>Pembeli: <Text style={styles.bold}>{order.userName}</Text></Text>
                  <Text style={{marginBottom:5}}>Alamat: {order.address}</Text>

                  {/* BOX RINCIAN BARANG BARU */}
                  <View style={styles.orderDetailContainer}>
                    <Text style={styles.orderDetailTitle}>🛒 Rincian Barang:</Text>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <View key={index} style={styles.orderDetailItem}>
                          <Text style={{flex: 1, fontSize: 13}}>• {item.name}</Text>
                          <Text style={{fontWeight: 'bold', fontSize: 13}}>x{item.quantity}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{fontSize: 12, color: 'gray', fontStyle: 'italic'}}>Tidak ada detail barang</Text>
                    )}
                  </View>

                  <Text style={[styles.bold, {marginTop: 10, color: '#D32F2F', fontSize: 16}]}>
                    Total: Rp {order.total}
                  </Text>
                  
                  <View style={styles.statusBox}>
                    <Text>Status: <Text style={{fontWeight: 'bold', color: '#4CAF50'}}>{order.status}</Text></Text>
                    <View style={styles.actions}>
                      <Button title="Proses" onPress={() => handleStatusChange(order.id, 'Sedang Diproses')} />
                      <Button title="Kirim" onPress={() => handleStatusChange(order.id, 'Dikirim')} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* CONTENT: PRODUCTS */}
          {activeTab === 'products' && (
            <View style={{padding: 10}}>
              <View style={styles.formCard}>
                <Text style={{fontWeight:'bold', marginBottom:5}}>Tambah Produk</Text>
                <TextInput placeholder="Nama Produk" style={styles.input} value={newProdName} onChangeText={setNewProdName} />
                <TextInput placeholder="Harga" style={styles.input} value={newProdPrice} onChangeText={setNewProdPrice} keyboardType="numeric" />
                
                {Platform.OS !== 'web' ? (
                  <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
                    {newProdImage ? (
                      <>
                        <Image source={{ uri: newProdImage }} style={styles.previewImageInBox} />
                        <Text style={styles.uploadText}>Ubah Foto</Text>
                      </>
                    ) : (
                      <View style={styles.placeholderInBox}>
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadText}>Pilih Foto Produk</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.uploadBox, {opacity: 0.5}]}>
                    <Text style={styles.uploadIcon}>🚫</Text>
                    <Text style={styles.uploadText}>Upload Foto Hanya Mobile</Text>
                  </View>
                )}
                
                <Button title="Simpan Produk" onPress={handleAddProduct} />
              </View>

              <FlatList
                data={products}
                scrollEnabled={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                  <View style={styles.prodItem}>
                    {item.image && <Image source={{ uri: item.image }} style={styles.prodThumb} />}
                    <View style={{flex:1}}>
                      <Text style={{fontWeight:'bold'}}>{item.name}</Text>
                      <Text style={{fontSize:12}}>Rp {item.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnDelete} onPress={() => handleDeleteProduct(item.id)}>
                      <Text style={{color:'white'}}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {/* CONTENT: MEMBERS */}
          {activeTab === 'members' && (
            <View style={{padding: 10}}>
                <Text style={{textAlign:'center', marginBottom:10, fontSize:16}}>Saldo Anggota</Text>
                {users.length === 0 && <Text style={{textAlign:'center'}}>Belum ada anggota.</Text>}
                {users.map((u) => (
                  <View key={u.id} style={styles.card}>
                    <View>
                      <Text style={styles.bold}>{u.name}</Text>
                      <Text>Username: {u.username}</Text>
                      <Text style={{color:'#D32F2F', fontWeight:'bold'}}>Saldo: Rp {u.balance}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnTopUp} onPress={() => openAmountModal(u)}>
                      <Text style={styles.txtBtnTopUp}>+ Top Up Custom</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* CONTENT: APPROVE */}
          {activeTab === 'approve' && (
            <View style={{padding: 10}}>
                <Text style={{textAlign:'center', marginBottom:10, fontWeight:'bold'}}>Permintaan Top Up</Text>
                {topupRequests.length === 0 && <Text style={{textAlign:'center'}}>Tidak ada request pending.</Text>}
                {topupRequests.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.bold}>{req.userName} (@{req.username})</Text>
                    <Text>Nominal: <Text style={{color:'#D32F2F', fontWeight:'bold'}}>Rp {req.amount}</Text></Text>
                    <TouchableOpacity style={[styles.btnPay, {backgroundColor:'#4CAF50', marginTop:10}]} onPress={() => handleApproveTopUp(req.id)}>
                      <Text style={styles.txtBtn}>Terima Saldo</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {/* CONTENT: DATABASE */}
          {activeTab === 'database' && (
            <View style={{padding: 10}}>
                <View style={styles.databaseHeader}>
                  <Text style={styles.dbTitle}>Database Anggota</Text>
                  <TouchableOpacity style={styles.btnExport} onPress={handleExportExcel}>
                    <Text style={styles.btnExportText}>📥 Export Excel</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tableContainer}>
                  <View style={[styles.row, styles.headerRow]}>
                    <Text style={[styles.cell, styles.headerCell]}>User</Text>
                    <Text style={[styles.cell, styles.headerCell]}>Nama</Text>
                    <Text style={[styles.cell, styles.headerCell]}>NIK</Text>
                    <Text style={[styles.cell, styles.headerCell]}>Saldo</Text>
                  </View>
                  {users.map((u) => (
                    <View key={u.id} style={styles.row}>
                      <Text style={styles.cell}>{u.username}</Text>
                      <Text style={styles.cell}>{u.name}</Text>
                      <Text style={styles.cell}>{u.nik || '-'}</Text>
                      <Text style={styles.cell}>{u.balance}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{marginTop:20, fontWeight:'bold', marginBottom:10}}>History Top Up</Text>
                {topupHistory.map((item) => (
                   <View key={item.id} style={styles.card}>
                     <View>
                       <Text style={styles.bold}>{item.userName}</Text>
                       <Text>Nominal: <Text style={{color:'#D32F2F', fontWeight:'bold'}}>Rp {item.amount}</Text></Text>
                       <Text style={{fontSize:10, color:'gray'}}>{new Date(item.date).toLocaleString()}</Text>
                     </View>
                     <Text style={{fontSize:12, color:'green'}}>Status: {item.status}</Text>
                   </View>
                ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* --- MODAL CUSTOM ALERT --- */}
      <Modal animationType="fade" transparent={true} visible={showCustomAlert}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertIcon}>{customAlertData.title.includes('Gagal') ? '⚠️' : 'ℹ️'}</Text>
            <Text style={styles.alertTitle}>{customAlertData.title}</Text>
            <Text style={styles.alertMessage}>{customAlertData.message}</Text>
            <View style={styles.alertButtonContainer}>
              {customAlertData.showCancel && <Button title="Batal" onPress={() => setShowCustomAlert(false)} color="#888" />}
              <Button title={customAlertData.showCancel ? "Ya, Lanjut" : "OK"} onPress={() => { if (customAlertData.onConfirm) customAlertData.onConfirm(); setShowCustomAlert(false); }} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL INPUT NOMINAL --- */}
      <Modal animationType="slide" transparent={true} visible={showAmountModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Isi Nominal Top Up</Text>
            <TextInput style={styles.topUpInput} keyboardType="numeric" value={topUpAmount} onChangeText={setTopUpAmount} />
            <View style={{flexDirection:'row', justifyContent:'space-between', width: '100%'}}>
              <Button title="Batal" onPress={() => setShowAmountModal(false)} color="#888" />
              <Button title="Lanjut" onPress={proceedToConfirm} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL KONFIRMASI --- */}
      <Modal animationType="fade" transparent={true} visible={showConfirmModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Konfirmasi Top Up</Text>
            <Text style={styles.modalText}>Tambah Rp {topUpAmount} ke {selectedUser?.name}?</Text>
            <View style={{flexDirection:'row', width:'100%', justifyContent:'space-between', marginTop:20}}>
              <Button title="Batal" onPress={() => setShowConfirmModal(false)} color="#888" />
              <Button title="Ya, Tambah" onPress={confirmTopUp} color="#4CAF50" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: '#f0f0f0' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: 15, backgroundColor: '#333' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logout: { color: '#ff5555', fontWeight: 'bold' },
  tabSwitch: { flexDirection:'row', backgroundColor:'white' },
  tabBtn: { flex:1, padding:15, alignItems:'center', borderBottomWidth:1, borderColor:'#ccc' },
  activeTab: { borderBottomWidth:3, borderColor:'#D32F2F' },
  card: { backgroundColor:'white', padding:15, marginBottom:10, borderRadius:8, borderWidth:1, borderColor:'#ddd' },
  bold: { fontWeight:'bold' },
  statusBox: { marginTop:10, paddingTop:10, borderTopWidth:1, borderColor:'#eee' },
  actions: { flexDirection:'row', gap:10, marginTop:5 },
  formCard: { backgroundColor:'white', padding:15, marginBottom:15, borderRadius:8 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, marginBottom:5, borderRadius:4 },
  uploadBox: { borderWidth:1, borderColor:'#ccc', borderStyle:'dashed', borderRadius:8, padding:15, marginBottom:15, alignItems:'center', backgroundColor:'#f9f9f9' },
  previewImageInBox: { width:'100%', height:150, borderRadius:5, marginBottom:5 },
  placeholderInBox: { alignItems:'center', width:'100%', height:150, justifyContent:'center' },
  uploadIcon: { fontSize:30, marginBottom:5 },
  uploadText: { fontSize:14, color:'#666', fontWeight:'bold' },
  prodItem: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'white', padding:10, marginBottom:5, borderRadius:5 },
  btnDelete: { backgroundColor:'red', padding:5, borderRadius:4 },
  prodThumb: { width:50, height:50, borderRadius:4, marginRight:10 },
  btnPay: { padding: 8, borderRadius: 4, alignItems:'center' },
  txtBtn: { color: 'white', fontSize: 10 },
  btnTopUp: { backgroundColor: '#4CAF50', paddingVertical:8, paddingHorizontal:12, borderRadius:15, marginTop:10, alignItems:'center' },
  txtBtnTopUp: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  databaseHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 20 },
  dbTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  btnExport: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20 },
  btnExportText: { color: 'white', fontWeight: 'bold' },
  tableContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: { backgroundColor: '#333' },
  cell: { flex: 1, padding: 10, textAlign: 'center', color: '#333', fontSize: 10 },
  headerCell: { color: 'white', fontWeight: 'bold' },
  alertOverlay: { position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  alertBox: { width: '85%', backgroundColor: 'white', padding: 25, borderRadius: 15, alignItems: 'center' },
  alertIcon: { fontSize: 40, marginBottom: 10 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  alertMessage: { textAlign: 'center', marginBottom: 25 },
  alertButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  modalContainer: { position: 'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 15, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalText: { textAlign: 'center', marginBottom: 20 },
  topUpInput: { width: '100%', borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:12, fontSize:16, textAlign:'center', marginBottom: 20 },

  // STYLING KHUSUS UNTUK RINCIAN PESANAN BARU
  orderDetailContainer: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#eee' },
  orderDetailTitle: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 5 },
  orderDetailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
});