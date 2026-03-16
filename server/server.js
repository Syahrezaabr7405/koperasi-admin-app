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

// Variabel untuk menyimpan status koneksi
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // Jika belum ada koneksi, buat koneksi baru
  console.log("🔄 Menghubungkan ke MongoDB...");
  const db = await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Tunggu 5 detik saja sebelum timeout
  });
  
  cachedDb = db;
  console.log("✅ Terhubung ke MongoDB Atlas");
  return db;
}

// Middleware untuk memastikan database terhubung di setiap request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
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
    userId: String, amount: Number, status: String, date: String
}));

// 4. ROUTES

app.get('/', (req, res) => {
    res.send('Backend Koperasi API is running and connected to DB!');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: 'Username atau password salah' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error saat login' });
    }
});

app.post('/register', async (req, res) => {
    const { name, username, password, nik, phone } = req.body;
    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ success: false, message: 'Username sudah dipakai' });

        const newUser = new User({ name, username, password, nik, phone });
        await newUser.save();
        res.json({ success: true, user: newUser });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal daftar' });
    }
});

app.post('/user/update-balance', async (req, res) => {
    const { userId, amount, type } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const currentSaldo = parseInt(user.balance || 0);
    const nominal = parseInt(amount);

    if (type === 'topup') {
        user.balance = currentSaldo + nominal;
    } else if (type === 'bayar_pokok') {
        const biayaPokok = 50000;
        if (currentSaldo < biayaPokok) return res.status(400).json({ message: 'Saldo kurang' });
        user.balance = currentSaldo - biayaPokok;
        user.pokokPaid = true;
    } else if (type === 'bayar_wajib') {
        const biayaWajib = 10000;
        if (currentSaldo < biayaWajib) return res.status(400).json({ message: 'Saldo kurang' });
        
        const now = new Date();
        const lastPaid = user.lastPaidWajib ? new Date(user.lastPaidWajib) : null;
        if (lastPaid && lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear()) {
            return res.status(400).json({ message: 'Simpanan Wajib bulan ini sudah dibayar.' });
        }
        user.balance = currentSaldo - biayaWajib;
        user.wajibMonths += 1;
        user.lastPaidWajib = now.toISOString();
    }

    await user.save();
    res.json({ success: true, user });
});

app.post('/orders', async (req, res) => {
    const { userId, cartItems, total, address } = req.body;
    const user = await User.findById(userId);
    if (user.balance < total) return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });

    user.balance -= total;
    const newOrder = new Order({
        userId, userName: user.name, items: cartItems, total, address,
        date: new Date().toISOString()
    });
    
    await newOrder.save();
    await user.save();
    res.json({ success: true, order: newOrder, user });
});

app.get('/topup/requests', async (req, res) => {
    const requests = await TopupRequest.find({ status: 'Menunggu Konfirmasi' });
    const fullRequests = await Promise.all(requests.map(async (r) => {
        const user = await User.findById(r.userId);
        return { ...r._doc, userName: user ? user.name : 'Unknown', id: r._id };
    }));
    res.json(fullRequests);
});

app.get('/products', async (req, res) => res.json(await Product.find()));

// EXPORT
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;