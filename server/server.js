const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. MIDDLEWARE
app.use(cors({
  origin: ["https://koperasi-admin-app.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// 2. LOGIKA KONEKSI MONGODB (SERVERLESS OPTIMIZED)
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://rezaadmin:I4p3KqVEmEv5H96w@cluster0.oa0pdog.mongodb.net/koperasi_db?retryWrites=true&w=majority";

let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  cachedDb = db;
  return db;
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: "Gagal terhubung ke database" });
  }
});

// 3. MODEL DATA
const User = mongoose.model('User', new mongoose.Schema({
    name: String, username: { type: String, unique: true }, password: String,
    nik: String, phone: String, role: { type: String, default: 'customer' },
    balance: { type: Number, default: 0 }, pokokPaid: { type: Boolean, default: false },
    wajibMonths: { type: Number, default: 0 }, lastPaidWajib: String
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String, price: Number, image: String
}));

const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String, userName: String, items: Array, total: Number,
    address: String, status: { type: String, default: 'Sedang Diproses' }, date: String
}));

const TopupRequest = mongoose.model('TopupRequest', new mongoose.Schema({
    userId: String, amount: Number, status: { type: String, default: 'Menunggu Konfirmasi' }, date: String
}));

// 4. ROUTES

app.get('/', (req, res) => {
    res.send('Backend Koperasi API is running!');
});

// --- AUTH ---
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: 'Username/Password salah' });
});

app.post('/register', async (req, res) => {
    const { name, username, password, nik, phone } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username sudah dipakai' });
    const newUser = new User({ name, username, password, nik, phone });
    await newUser.save();
    res.json({ success: true, user: newUser });
});

// --- PRODUCTS (ADMIN & USER) ---
app.get('/products', async (req, res) => res.json(await Product.find()));

app.post('/products', async (req, res) => {
    try {
        const { name, price, image } = req.body;
        const newProduct = new Product({ name, price: Number(price), image });
        await newProduct.save();
        res.status(201).json({ success: true, data: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal simpan produk' });
    }
});

app.delete('/products/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- USERS (ADMIN) ---
app.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// --- SALDO & TOPUP ---
app.post('/topup/request', async (req, res) => {
    const { userId, amount } = req.body;
    const request = new TopupRequest({ userId, amount, date: new Date().toISOString() });
    await request.save();
    res.json({ success: true });
});

app.get('/topup/requests', async (req, res) => {
    const requests = await TopupRequest.find({ status: 'Menunggu Konfirmasi' });
    const fullRequests = await Promise.all(requests.map(async (r) => {
        const user = await User.findById(r.userId);
        return { ...r._doc, userName: user ? user.name : 'Unknown', id: r._id };
    }));
    res.json(fullRequests);
});

app.put('/topup/approve/:id', async (req, res) => {
    try {
        const request = await TopupRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Request tidak ditemukan' });
        
        // Pastikan User ditemukan sebelum akses .balance
        const user = await User.findById(request.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User pemilik request ini tidak ditemukan di database' });
        }

        // Tambah saldo dengan aman (jika balance undefined, mulai dari 0)
        user.balance = (user.balance || 0) + Number(request.amount);
        request.status = 'Disetujui';
        
        await user.save();
        await request.save();
        
        res.json({ success: true, message: 'Top up berhasil disetujui' });
    } catch (err) {
        console.error("Error Approve:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ORDERS ---
app.post('/orders', async (req, res) => {
    const { userId, cartItems, total, address } = req.body;
    
    try {
        // Ambil data user TERBARU dari database, jangan percaya data dari body
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

        // Cek saldo asli di database
        if (user.balance < total) {
            return res.status(400).json({ success: false, message: 'Saldo kurang' });
        }

        // Potong saldo
        user.balance -= Number(total);
        
        const newOrder = new Order({ 
            userId, 
            userName: user.name, 
            items: cartItems, 
            total, 
            address, 
            date: new Date().toISOString() 
        });

        await newOrder.save();
        await user.save(); // Simpan saldo baru

        res.json({ success: true, order: newOrder, user: user }); // Kirim balik data user terbaru
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/orders', async (req, res) => res.json(await Order.find()));

app.put('/orders/:id', async (req, res) => {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
});

// EXPORT
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;