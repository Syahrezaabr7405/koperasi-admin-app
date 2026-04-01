import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gunakan URL Server Backend
// Jika testing di HP asli (bukan emulator), ganti localhost ke IP Laptopmu
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://koperasi-admin-app-jknh.vercel.app' 
  : 'http://localhost:5000'; 

// --- HELPER: AMBIL DATA USER DARI STORAGE ---
const getStoredUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('koperasi_user');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Gagal mengambil storage:", e);
    return null;
  }
};

// --- AUTHENTICATION ---
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Server error' };
  }
};

export const registerUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/register`, data);
    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Server error' };
  }
};

// Tambahkan di api.js
export const verifyOTP = async (nik, otp) => {
  try {
    const response = await axios.post(`${API_URL}/api/verify-otp`, { nik, otp });
    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Server error' };
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/reset-password`, data);
    return response.data;
  } catch (error) {
    return error.response ? error.response.data : { success: false, message: 'Server error' };
  }
};

// --- PRODUCTS ---
export const getProducts = async () => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const addProduct = async (productData) => {
  // Pastikan price dikirim sebagai Number untuk MongoDB Atlas
  const formattedData = {
    ...productData,
    price: Number(productData.price)
  };
  const response = await axios.post(`${API_URL}/products`, formattedData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axios.delete(`${API_URL}/products/${productId}`);
  return response.data;
};

// --- USERS & BALANCE ---
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.log('Error fetching users:', error);
    return [];
  }
};

export const getUser = async () => {
  try {
    const userObj = await getStoredUser();
    if (!userObj) return null;
    
    // MongoDB Atlas menggunakan _id. Kita cek keduanya agar aman.
    const uid = userObj._id || userObj.id;
    const response = await axios.get(`${API_URL}/user/${uid}`);
    return response.data;
  } catch (error) {
    console.log("Error fetching user:", error);
    return null;
  }
};

export const updateBalance = async (userId, amount, type) => {
  try {
    // Menambahkan log agar kamu bisa cek di terminal/console jika ada masalah
    console.log(`Mengirim ${type} sebesar ${amount} ke ID: ${userId}`);

    const response = await axios.post(`${API_URL}/user/update-balance`, {
      userId: userId, 
      amount: Number(amount), // Mengambil keunggulan kodemu (memastikan angka)
      type: type
    });
    
    return response.data; // Mengembalikan sukses (misal: {success: true, user: ...})
  } catch (error) {
    // Mengambil keunggulan kode saya (menangkap error agar tidak crash)
    console.error("Detail Error API:", error.response?.data || error.message);
    return error.response?.data || { success: false, message: "Koneksi server gagal" };
  }
};

// --- ORDERS ---
export const createOrder = async (orderData) => {
  const response = await axios.post(`${API_URL}/orders`, orderData);
  return response.data;
};

export const getOrders = async () => {
  const response = await axios.get(`${API_URL}/orders`);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.put(`${API_URL}/orders/${orderId}`, { status });
  return response.data;
};

// --- TOP UP SYSTEM ---
export const requestTopUp = async (userId, amount) => {
  const response = await axios.post(`${API_URL}/topup/request`, { 
    userId, 
    amount: Number(amount) 
  });
  return response.data;
};

export const getTopUpRequests = async () => {
  const response = await axios.get(`${API_URL}/topup/requests`);
  return response.data;
};

export const approveTopUp = async (requestId) => {
  const response = await axios.put(`${API_URL}/topup/approve/${requestId}`);
  return response.data;
};

export const getTopUpHistory = async () => {
  const response = await axios.get(`${API_URL}/topup/history`);
  return response.data;
};

// --- FITUR WAJIB ---
export const payWajib = async () => {
  try {
    const userObj = await getStoredUser();
    if (!userObj) return { success: false, message: 'User belum login' };
    
    const uid = userObj._id || userObj.id;
    const response = await axios.post(`${API_URL}/pay-wajib`, { userId: uid });
    return response.data;
  } catch (error) {
    console.log("Error Pay Wajib:", error);
    return error.response ? error.response.data : { success: false, message: 'Server error' };
  }
};