const mongoose = require('mongoose');
const fs = require('fs');

// 1. Koneksi ke MongoDB
const MONGO_URI = "mongodb+srv://rezaadmin:I4p3KqVEmEv5H96w@cluster0.oa0pdog.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI);

// 2. Definisi Model (Sama seperti di server.js)
const User = mongoose.model('User', new mongoose.Schema({
    name: String, username: String, password: String, nik: String, phone: String, 
    role: String, balance: Number, pokokPaid: Boolean, wajibMonths: Number, lastPaidWajib: String
}));

// 3. Fungsi Migrasi
const migrateData = async () => {
    const rawData = fs.readFileSync('./database.json');
    const db = JSON.parse(rawData);

    // Masukkan semua user dari JSON ke MongoDB
    if (db.users && db.users.length > 0) {
        await User.insertMany(db.users);
        console.log(`${db.users.length} user berhasil dipindah!`);
    }
    
    console.log("Migrasi selesai!");
    process.exit();
};

migrateData();