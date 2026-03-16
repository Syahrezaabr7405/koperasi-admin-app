const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper untuk baca/tulis file database JSON
const dbPath = path.join(__dirname, 'database.json');

const getDB = () => {
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data);
};

const saveDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// --- ROUTES / API ---

// 1. Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
});

// 2. Register
app.post('/register', (req, res) => {
    const { name, username, password, nik, phone } = req.body;
    const db = getDB();
    
    if (db.users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username sudah dipakai' });
    }

    const newUser = {
        id: 'usr' + Date.now(),
        name,
        username,
        password,
        nik,
        phone,
        role: 'customer',
        balance: 0,
        pokokPaid: false,
        wajibMonths: 0
    };

    db.users.push(newUser);
    saveDB(db);
    res.json({ success: true, user: newUser });
});

// 3. Get Products
app.get('/products', (req, res) => {
    const db = getDB();
    res.json(db.products);
});

// 4. Update Saldo (Simulasi TopUp / Bayar Simpanan)
app.post('/user/update-balance', (req, res) => {
    const { userId, amount, type } = req.body; // type: 'topup', 'bayar_pokok', 'bayar_wajib'
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ message: 'User tidak ditemukan' });

    const user = db.users[userIndex];
    
    // --- FIX PENTING: PAKSA JADI ANGKA ---
    // Saat baca dari file DB, jadikan Number
    const currentSaldo = parseInt(user.balance || 0);
    const nominal = parseInt(amount); 
    // ------------------------------

    if (type === 'topup') {
        user.balance = currentSaldo + nominal;
    } else if (type === 'bayar_pokok') {
        const biayaPokok = 50000;
        
        if (currentSaldo < biayaPokok) return res.status(400).json({ message: 'Saldo kurang' });
        
        // Kurangi Saldo (Number)
        user.balance = currentSaldo - biayaPokok;
        user.pokokPaid = true;
        
    } else if (type === 'bayar_wajib') {
        const biayaWajib = 10000;
        
        // Cek Saldo
        if (currentSaldo < biayaWajib) return res.status(400).json({ message: 'Saldo kurang' });
        
        // Cek Tanggal Terakhir Bayar
        const now = new Date();
        const lastPaid = user.lastPaidWajib ? new Date(user.lastPaidWajib) : null;
        
        if (lastPaid) {
            const isSameMonth = lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear();
            if (isSameMonth) {
                return res.status(400).json({ message: 'Simpanan Wajib bulan ini sudah dibayar.' });
            }
        }

        // Kurangi Saldo (Number)
        user.balance = currentSaldo - biayaWajib;
        user.wajibMonths += 1; // Jangan parseInt +1, tapi biarkan otomatis
        user.lastPaidWajib = now.toISOString();
    }

    // Simpan User yang sudah diupdate
    db.users[userIndex] = user;
    saveDB(db);
    
    // Kirim Response User Terbaru
    res.json({ success: true, user });
});

// 5. Create Order (Checkout)
app.post('/orders', (req, res) => {
    const { userId, cartItems, total, address } = req.body;
    const db = getDB();
    
    // Validasi saldo
    const user = db.users.find(u => u.id === userId);
    if (user.balance < total) {
        return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });
    }

    // Potong saldo
    user.balance -= total;
    
    // Simpan order
    const newOrder = {
        id: 'ord' + Date.now(),
        userId,
        userName: user.name,
        items: cartItems,
        total,
        address,
        status: 'Sedang Diproses', // Default status
        date: new Date().toISOString()
    };
    
    db.orders.push(newOrder);
    
    // Update user di DB
    const userIndex = db.users.findIndex(u => u.id === userId);
    db.users[userIndex] = user;
    
    saveDB(db);
    res.json({ success: true, order: newOrder, user });
});

// 6. Get Orders (Admin)
app.get('/orders', (req, res) => {
    const db = getDB();
    res.json(db.orders);
});


// 7. Update Status Pesanan (Admin)
app.put('/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Status baru: 'Dikirim', 'Selesai', dll
    const db = getDB();
    
    const orderIndex = db.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return res.status(404).json({ message: 'Order tidak ditemukan' });

    db.orders[orderIndex].status = status;
    saveDB(db);
    res.json({ success: true, order: db.orders[orderIndex] });
});

// 8. Tambah Produk Baru (Admin)
app.post('/products', (req, res) => {
    const { name, price, image } = req.body; // Pastikan ambil 'image'
    const db = getDB();
    
    const newProduct = {
        id: Date.now(), 
        name,
        price: parseInt(price),
        // Jika user tidak isi gambar, pakai default (placeholder)
        image: image ? image : 'https://picsum.photos/seed/barang/200/200' 
    };
    
    db.products.push(newProduct);
    saveDB(db);
    res.json({ success: true, product: newProduct });
});

// 9. Hapus Produk (Admin)
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB();
    
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id != id); // Hapus produk
    
    if (db.products.length === initialLength) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    saveDB(db);
    res.json({ success: true });
});

// 10. Ambil Semua Data User (Untuk Admin)
app.get('/users', (req, res) => {
    const db = getDB();
    // Hapus password sebelum dikirim ke frontend demi keamanan
    const safeUsers = db.users.map(({ password, ...u }) => u);
    res.json(safeUsers);
});

// 11. Customer Ajukan Top Up (Request)
app.post('/topup/request', (req, res) => {
    const { userId, amount } = req.body;
    const db = getDB();
    
    // Simpan request ke database baru: 'topupRequests'
    if (!db.topupRequests) db.topupRequests = [];

    const newRequest = {
        id: 'top' + Date.now(),
        userId,
        amount: parseInt(amount),
        status: 'Menunggu Konfirmasi', // Status awal
        date: new Date().toISOString()
    };
    
    db.topupRequests.push(newRequest);
    saveDB(db);
    res.json({ success: true, request: newRequest });
});

// 12. Ambil List Request Top Up (Untuk Admin)
app.get('/topup/requests', (req, res) => {
    const db = getDB();
    // Ambil semua request yang statusnya 'Menunggu Konfirmasi'
    const requests = (db.topupRequests || []).filter(r => r.status === 'Menunggu Konfirmasi');
    
    // Join dengan data User agar Admin bisa lihat siapa yang request
    const fullRequests = requests.map(r => {
        const user = db.users.find(u => u.id === r.userId);
        return {
            ...r,
            userName: user ? user.name : 'Unknown',
            username: user ? user.username : 'Unknown'
        };
    });
    
    res.json(fullRequests);
});

// 13. Admin Terima Top Up (Proses Saldo Masuk)
app.put('/topup/approve/:id', (req, res) => {
    const { id } = req.params;
    const db = getDB();
    
    // Cari Request
    const reqIndex = db.topupRequests.findIndex(r => r.id === id);
    if (reqIndex === -1) return res.status(404).json({ message: 'Request tidak ditemukan' });
    
    const request = db.topupRequests[reqIndex];
    
    // Cek User
    const userIndex = db.users.findIndex(u => u.id === request.userId);
    if (userIndex === -1) return res.status(404).json({ message: 'User tidak ditemukan' });
    
    // Tambah Saldo User
    db.users[userIndex].balance += request.amount;
    
    // Ubah Status Request jadi Selesai
    db.topupRequests[reqIndex].status = 'Diterima';
    
    saveDB(db);
    res.json({ success: true });
});

// 14. History Top Up Semua (Untuk Excel)
app.get('/topup/history', (req, res) => {
    const db = getDB();
    // Ambil semua request yang statusnya 'Diterima'
    const history = (db.topupRequests || []).filter(r => r.status === 'Diterima');
    
    // Join dengan nama User
    const fullHistory = history.map(r => {
        const user = db.users.find(u => u.id === r.userId);
        return {
            ...r,
            userName: user ? user.name : 'Unknown',
            userPhone: user ? user.phone : '-'
        };
    });
    
    res.json(fullHistory.reverse()); // Terbaru di atas
});

// 16. Bayar Wajib (PERBAIKAN FIX LOGIKA)
app.post('/pay-wajib', (req, res) => {
    // Ambil nominal dari FE (pastikan FE kirim 'amount': 10000)
    const { userId, amount } = req.body; 
    
    try {
        const db = getDB();
        const userIndex = db.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.json({ success: false, message: 'User tidak ditemukan' });
        }

        const user = db.users[userIndex];
        
        // AMBIL NOMINAL WAJIB (10.000)
        // Kita gunakan nilai hardcoded backend agar aman, atau pakai request amount
        const biayaWajib = 10000; 

        // 1. CEK SALDO
        if (user.balance < biayaWajib) {
            return res.json({ success: false, message: `Saldo kurang. Saldo: Rp ${user.balance}, Biaya: Rp ${biayaWajib}` });
        }

        // 2. KURANGI SALDO (HANYA 10.000, BUKAN 250.000)
        user.balance -= biayaWajib;

        // 3. TAMBAH BULAN
        user.wajibMonths = (user.wajibMonths || 0) + 1;

        // 4. SIMPAN TANGGAL (Opsional, tapi bagus untuk pengecekan bulanan)
        user.lastPaidWajib = new Date().toISOString();

        // 5. SIMPAN KE FILE
        fs.writeFileSync(dbPath, JSON.stringify(db));

        return res.json({ 
            success: true, 
            message: 'Pembayaran Wajib Berhasil',
            newBalance: user.balance, 
            newMonths: user.wajibMonths,
            lastPaid: user.lastPaidWajib 
        });

    } catch (error) {
        console.error("Error Pay Wajib:", error);
        return res.json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// 17. Bayar Pokok (FIXED LOGIKA)
app.post('/pay-pokok', (req, res) => {
    const { userId } = req.body;
    const db = getDB();
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.json({ success: false, message: 'User tidak ditemukan' });
    }

    const user = db.users[userIndex];
    const nominalPokok = 50000;

    // 1. CEK SALDO
    if (user.balance < nominalPokok) {
        return res.json({ success: false, message: 'Saldo tidak mencukupi untuk Pokok!' });
    }

    // 2. UPDATE DATA USER (SALDO BERKURANG, STATUS LUNAS)
    user.balance -= nominalPokok;
    user.pokokPaid = true;

    // 3. SIMPAN
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db));
        
        return res.json({ 
            success: true, 
            message: 'Simpanan Pokok Lunas!',
            newBalance: user.balance,
            pokokPaid: true
        });
    } catch (e) {
        return res.json({ success: false, message: 'Gagal menyimpan database.' });
    }
});


// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});