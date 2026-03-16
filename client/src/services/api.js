import axios from 'axios';

// Gunakan URL Server (Backend), bukan URL App (Frontend)
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://koperasi-admin-app-jknh.vercel.app/' // <--- GANTI DENGAN LINK SERVERMU
  : 'http://localhost:5000';

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

export const getProducts = async () => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const updateBalance = async (userId, amount, type) => {
  const response = await axios.post(`${API_URL}/user/update-balance`, { userId, amount, type });
  return response.data;
};

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

export const addProduct = async (productData) => {
  const response = await axios.post(`${API_URL}/products`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axios.delete(`${API_URL}/products/${productId}`);
  return response.data;
};

// --- FUNGSI GET USER (AMBIL DATA TERBARU) ---
export const getUser = async () => {
  try {
    // Ambil User ID dari Local Storage
    const savedUser = localStorage.getItem('koperasi_user');
    
    if (!savedUser) {
      return null;
    }
    
    const userObj = JSON.parse(savedUser);
    
    // Panggil API User dari Backend
    const response = await axios.get(`${API_URL}/user/${userObj.id}`);
    return response.data;
    
  } catch (error) {
    console.log("Error fetching user:", error);
    return null;
  }
};

export const requestTopUp = async (userId, amount) => {
  const response = await axios.post(`${API_URL}/topup/request`, { userId, amount });
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

// --- FUNGSI BARU: BAYAR WAJIB ---
export const payWajib = async () => {
  try {
    // Ambil user ID dari localStorage
    const savedUser = localStorage.getItem('koperasi_user');
    if(!savedUser) return { success: false, message: 'User belum login' };
    
    const userObj = JSON.parse(savedUser);

    // Panggil endpoint /pay-wajib
    const response = await axios.post(`${API_URL}/pay-wajib`, { userId: userObj.id });
    return response.data;
    
  } catch (error) {
    console.log("Error Pay Wajib:", error);
    return error.response ? error.response.data : { success: false, message: 'Terjadi kesalahan server.' };
  }
};

// --- FUNGSI AMBIL SEMUA DATA USER (UNTUK ADMIN) ---
export const getUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.log('Error fetching users:', error);
    return [];
  }
};

