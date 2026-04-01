const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Nama produk wajib diisi'] 
  },
  price: { 
    type: Number, 
    required: [true, 'Harga produk wajib diisi'] 
  },
  image: { 
    type: String, 
    default: null // Ini akan menyimpan string Base64 dari Expo Image Picker
  },
  category: {
    type: String,
    default: 'Umum'
  }
}, { 
  timestamps: true // Otomatis membuat kolom createdAt dan updatedAt
});

// Pencegahan error jika model sudah terdefinisi (penting untuk Vercel/Serverless)
module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);