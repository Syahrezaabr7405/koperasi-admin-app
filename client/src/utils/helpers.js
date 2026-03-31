// Mengambil ID dari MongoDB Atlas secara otomatis
export const getID = (item) => item?._id || item?.id;

// Format Rupiah agar tampilan profesional
export const formatRupiah = (num) => {
  return `Rp ${new Intl.NumberFormat('id-ID').format(num || 0)}`;
};