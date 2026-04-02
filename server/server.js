const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const midtransClient = require('midtrans-client'); // Tambahan Midtrans
const nodemailer = require('nodemailer'); // Tambahkan di baris paling atas

const app = express();
const PORT = process.env.PORT || 5000;

// 1. MIDDLEWARE
app.use(cors({
  origin: ["https://koperasi-admin-app.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// 2. KONFIGURASI MIDTRANS (Ganti Key dengan milikmu di Dashboard Midtrans)
let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY, // Ambil dari pengaturan Vercel
    clientKey: process.env.MIDTRANS_CLIENT_KEY  // Ambil dari pengaturan Vercel
});

// 3. LOGIKA KONEKSI MONGODB
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

// 4. MODEL DATA (Tetap sama)
// Cari bagian Model Data (Poin nomor 4) dan ubah jadi begini:
const User = mongoose.model('User', new mongoose.Schema({
    name: String, 
    username: { type: String }, // Hapus unique: true
    password: String,
    nik: { type: String },      // Hapus unique: true
    email: { type: String, lowercase: true },
    phone: String, 
    role: { type: String, default: 'customer' },
    balance: { type: Number, default: 0 }, 
    pokokPaid: { type: Boolean, default: false },
    wajibMonths: { type: Number, default: 0 }, 
    lastPaidWajib: String,
    resetOtp: String,         // Untuk simpan kode OTP sementara
    otpExpires: Date          // Masa berlaku OTP
}));

// --- KONFIGURASI PENGIRIM EMAIL (NODEMAILER) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'syahrezaadminkopkel@gmail.com', // Ganti dengan email koperasimu
        pass: 'dnsn aftf liym cczn'      // Ganti dengan App Password dari Google
    }
});

// --- ENDPOINT: REQUEST RESET PASSWORD ---
app.post('/api/forgot-password', async (req, res) => {
    const { nik, email } = req.body;

    try {
        // Cari user yang NIK dan Email-nya COCOK & role-nya 'customer'
        const user = await User.findOne({ 
            nik: nik, 
            email: email.toLowerCase(),
            role: 'customer' 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Data NIK atau Email tidak ditemukan dalam sistem.' 
            });
        }

        // Buat OTP 6 Digit
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 3600000; 
        await user.save();

        // Kirim Email
        await transporter.sendMail({
            from: '"Koperasi Jati" <noreply@koperasi.com>',
            to: user.email,
            subject: "Kode Reset Password Akun Koperasi",
            html: `<h3>Kode OTP Anda: <b>${otp}</b></h3>
                   <p>Gunakan kode ini untuk mengganti password Anda. Jangan berikan kode ini kepada siapapun.</p>`
        });

        res.json({ success: true, message: 'Kode OTP telah dikirim ke email Anda.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengirim email.' });
    }
});

// --- ENDPOINT BARU: HANYA VERIFIKASI OTP (STEP 2) ---
app.post('/api/verify-otp', async (req, res) => {
    const { nik, otp } = req.body;
    try {
        const user = await User.findOne({ 
            nik: nik, 
            resetOtp: otp, 
            // otpExpires: { $gt: Date.now() } // Matikan baris ini untuk testing
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Kode OTP salah atau sudah kedaluwarsa.' });
        }

        res.json({ success: true, message: 'OTP Valid.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// --- ENDPOINT: VERIFIKASI OTP & UPDATE PASSWORD BARU ---
app.post('/api/reset-password', async (req, res) => {
    const { nik, otp, newPassword } = req.body;

    console.log("Mencoba reset untuk NIK:", nik, "dengan OTP:", otp);

    try {
        const user = await User.findOne({ 
            nik: nik, 
            resetOtp: otp, 
            // otpExpires: { $gt: Date.now() } // Matikan baris ini untuk testing
        });

        if (!user) {
            console.log("OTP di DB:", user.resetOtp, "vs OTP Input:", otp);
            return res.status(400).json({ success: false, message: 'Kode OTP salah atau sudah kedaluwarsa.' });
        }

        // Update password (disarankan pakai bcrypt untuk hash)
        user.password = newPassword; 
        user.resetOtp = undefined; // Hapus OTP setelah dipakai
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password berhasil diperbarui. Silakan login kembali.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui password.' });
    }
});

const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({
    name: String, 
    price: Number, 
    image: String
}), 'products'); // <--- 'products' adalah nama collection di MongoDB Atlas kamu

// Tambahkan juga model Order jika nanti ingin dipakai
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    userId: String, 
    userName: String, 
    items: Array, 
    total: Number, 
    address: String,
    status: { type: String, default: 'Menunggu' }, 
    date: String
}), 'orders');

const TopupRequest = mongoose.model('TopupRequest', new mongoose.Schema({
    userId: String, amount: Number, status: { type: String, default: 'Menunggu Konfirmasi' }, date: String
}));

// --- ENDPOINT MIDTRANS: BUAT TRANSAKSI ---
app.post('/api/topup/charge', async (req, res) => {
    try {
        const { userId, amount, username } = req.body;
        
        if (!userId) return res.status(400).json({ message: "UserId diperlukan" });

        let parameter = {
            "transaction_details": {
                "order_id": "TOPUP-" + Date.now(),
                "gross_amount": Number(amount)
            },
            "customer_details": {
                "first_name": username
            },
            // METADATA: Sangat penting untuk menyimpan userId agar bisa dibaca saat callback lunas
            "metadata": {
                "user_id": userId
            },
            "enabled_payments": ["gopay", "shopeepay", "other_qris"]
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({ 
            success: true, 
            token: transaction.token, 
            redirect_url: transaction.redirect_url 
        });
    } catch (err) {
        console.error("Midtrans Charge Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ENDPOINT MIDTRANS: CALLBACK (WEBHOOK) ---
// Midtrans akan memanggil URL ini secara otomatis saat user selesai bayar
app.post('/api/midtrans-callback', async (req, res) => {
    const data = req.body;

    try {
        // Cek apakah transaksi sukses (settlement = lunas, capture = kartu kredit sukses)
        if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
            const amount = Number(data.gross_amount);
            const userId = data.metadata ? data.metadata.user_id : null;

            if (userId) {
                // 1. Tambah Saldo User secara otomatis
                await User.findByIdAndUpdate(userId, { $inc: { balance: amount } });

                // 2. Catat di TopupRequest sebagai 'Disetujui' secara otomatis
                const autoRequest = new TopupRequest({
                    userId: userId,
                    amount: amount,
                    status: 'Disetujui',
                    date: new Date().toISOString()
                });
                await autoRequest.save();

                console.log(`[OTOMATIS] Saldo user ${userId} bertambah Rp${amount}`);
            }
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error("Callback Error:", err);
        res.status(500).send("Internal Error");
    }
});

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
    try {
        const { name, username, password, nik, phone, email } = req.body;

        // 1. Cek apakah Username sudah ada
        //const existingUser = await User.findOne({ username });
        //if (existingUser) {
        //    return res.status(400).json({ success: false, message: 'Username sudah dipakai' });
        //}

        // 2. Cek apakah NIK sudah ada (Sangat penting karena NIK bersifat Unique)
        //const existingNik = await User.findOne({ nik });
        //if (existingNik) {
        //    return res.status(400).json({ success: false, message: 'NIK ini sudah terdaftar' });
        //}

        // 3. Simpan user baru
        const newUser = new User({ 
            name, 
            username, 
            password, 
            nik, 
            phone, 
            email: email ? email.toLowerCase() : "" // Hindari error undefined
        });

        await newUser.save();
        res.json({ success: true, user: newUser });

    } catch (err) {
        // JIKA TERJADI ERROR (Misal: masalah indeks atau koneksi Atlas)
        console.error("Detail Error Register:", err);
        
        // Kirim pesan error aslinya ke Frontend agar kamu bisa baca di log/alert
        res.status(500).json({ 
            success: false, 
            message: 'Gagal register: ' + err.message 
        });
    }
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

// --- REVISI FINAL: UPDATE BALANCE & SIMPANAN ---
app.post('/user/update-balance', async (req, res) => {
    try {
        const { userId, amount, type } = req.body;
        
        // 1. Validasi ID User (Mencegah error 'undefined' atau ID kosong)
        if (!userId || userId === "undefined") {
            return res.status(400).json({ 
                success: false, 
                message: 'ID User tidak valid atau tidak terdeteksi.' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User tidak ditemukan di database.' 
            });
        }

        const nominal = Number(amount);
        let transactionSuccess = false;

        // 2. Logika Berdasarkan Tipe Transaksi
        if (type === 'topup') {
            user.balance = (user.balance || 0) + nominal;
            transactionSuccess = true;
        } 
        else if (type.includes('pokok')) {
            // Cek saldo untuk Simpanan Pokok
            if (user.balance < nominal) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Saldo tidak cukup. Saldo Anda Rp${user.balance}, biaya Rp${nominal}` 
                });
            }
            user.balance -= nominal;
            user.pokokPaid = true;
            transactionSuccess = true;
        } 
        else if (type.includes('wajib')) {
            // Cek saldo untuk Simpanan Wajib
            if (user.balance < nominal) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Saldo tidak cukup. Saldo Anda Rp${user.balance}, biaya Rp${nominal}` 
                });
            }
            user.balance -= nominal;
            user.wajibMonths = (user.wajibMonths || 0) + 1;
            user.lastPaidWajib = new Date().toISOString();
            transactionSuccess = true;
        } 
        else {
            // JIKA TYPE TIDAK COCOK (Misal typo: 'payy_pokok')
            return res.status(400).json({ 
                success: false, 
                message: `Tipe transaksi '${type}' tidak dikenal oleh server.` 
            });
        }

        // 3. Simpan Perubahan ke MongoDB
        if (transactionSuccess) {
            await user.save();
            // Kirim balik data user TERBARU agar Frontend bisa langsung update tampilan
            return res.json({ 
                success: true, 
                balance: user.balance, 
                user: user 
            });
        }

    } catch (err) {
        console.error("CRITICAL ERROR Update Balance:", err);
        res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan pada server: " + err.message 
        });
    }
});

// --- TOPUP HISTORY ---
app.get('/topup/history', async (req, res) => {
    try {
        const history = await TopupRequest.find({ status: 'Disetujui' }).sort({ date: -1 });
        const fullHistory = await Promise.all(history.map(async (h) => {
            const user = await User.findById(h.userId);
            return { 
                ...h._doc, 
                userName: user ? user.name : 'User Dihapus',
                id: h._id 
            };
        }));
        res.json(fullHistory);
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// --- SALDO & TOPUP ---
app.post('/topup/request', async (req, res) => {
    const { userId, amount } = req.body;
    const request = new TopupRequest({ userId, amount, date: new Date().toISOString() });
    await request.save();
    res.json({ success: true });
});

app.get('/topup/requests', async (req, res) => {
    try {
        const requests = await TopupRequest.find({ status: 'Menunggu Konfirmasi' });
        const fullRequests = await Promise.all(requests.map(async (r) => {
            const user = await User.findById(r.userId);
            return { 
                ...r._doc, 
                userName: user ? user.name : 'Unknown', 
                username: user ? user.username : '-', // Tambahkan username juga
                id: r._id 
            };
        }));
        res.json(fullRequests);
    } catch (err) {
        res.status(500).json([]);
    }
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

app.get('/user/:id', async (req, res) => {
    try {
        if (req.params.id === "undefined") return res.status(400).json({ message: "ID tidak valid" });
        const user = await User.findById(req.params.id);
        if (user) res.json(user);
        else res.status(404).json({ message: 'User tidak ditemukan' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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