import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const TopUpScreen = ({ user, onTopUpSuccess }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [showWebView, setShowWebView] = useState(false);

    const handleProcessPayment = async () => {
        if (!amount || parseInt(amount) < 10000) {
            alert("Minimal Top Up adalah Rp 10.000");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('https://koperasi-admin-app-jknh.vercel.app/api/topup/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id, // Pastikan ID user dikirim
                    username: user.name,
                    amount: amount
                }),
            });

            const data = await response.json();
            if (data.success) {
                setPaymentUrl(data.redirect_url);
                setShowWebView(true);
            } else {
                alert("Gagal membuat transaksi: " + data.message);
            }
        } catch (error) {
            alert("Terjadi kesalahan koneksi ke server");
        } finally {
            setLoading(false);
        }
    };

    const handleWebViewNavigationStateChange = (newNavState) => {
        // Jika URL mengandung kata 'finish' atau 'success' (tergantung setting Midtrans)
        // Kita bisa asumsikan user selesai (tapi saldo tetap diupdate otomatis oleh Webhook Backend)
        if (newNavState.url.includes('finish') || newNavState.url.includes('error')) {
            setTimeout(() => {
                setShowWebView(false);
                setPaymentUrl(null);
                if (onTopUpSuccess) onTopUpSuccess(); // Fungsi untuk refresh saldo di halaman utama
            }, 3000);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Top Up Saldo Koperasi</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Masukkan Nominal (Contoh: 50000)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleProcessPayment}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Bayar via QRIS / E-Wallet</Text>}
            </TouchableOpacity>

            {/* Modal untuk menampilkan WebView Midtrans */}
            <Modal visible={showWebView} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={styles.headerWebView}>
                        <TouchableOpacity onPress={() => setShowWebView(false)}>
                            <Text style={{ color: 'red', fontWeight: 'bold' }}>Tutup</Text>
                        </TouchableOpacity>
                        <Text>Pembayaran Aman</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    
                    <WebView 
                        source={{ uri: paymentUrl }} 
                        onNavigationStateChange={handleWebViewNavigationStateChange}
                        startInLoadingState={true}
                        renderLoading={() => <ActivityIndicator size="large" style={styles.loader} />}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 20, fontSize: 16 },
    button: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    headerWebView: { height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, borderBottomWidth: 1, borderColor: '#eee' },
    loader: { position: 'absolute', top: '50%', left: '50%' }
});

export default TopUpScreen;