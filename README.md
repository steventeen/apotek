# Apotek Ulebi - Sistem Kasir & Inventori Modern

Apotek Ulebi adalah aplikasi Point of Sale (POS) dan manajemen inventori apotek yang dirancang untuk kecepatan, keamanan, dan ketahanan terhadap gangguan internet. Dibangun dengan Next.js 14, Supabase, dan Dexie.js (IndexedDB).

## ✨ Fitur Utama

- 🔐 **Sistem Login PIN**: Akses cepat dan aman dengan role-based access control (Pemilik, Apoteker, Kasir).
- 🛒 **Sistem Kasir Offline-Ready**: Tetap bisa melayani transaksi meskipun internet mati. Data akan otomatis sinkron saat online.
- 📦 **Manajemen Inventori**: CRUD obat, kategori, cetak label barcode, dan alert stok rendah.
- 📊 **Dashboard & Laporan**: Grafik tren penjualan 7 hari, rekap laba rugi, dan data obat terlaris.
- 📋 **Stok Opname**: Audit stok fisik vs sistem dengan fitur sinkronisasi otomatis.
- 🖨️ **Struk & Barcode**: Cetak struk via Bluetooth Thermal Printer atau simpan sebagai gambar.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Database Lokal**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS
- **Visualisasi**: Recharts
- **Offline Mode**: @ducanh2912/next-pwa

## 🛠️ Cara Install & Run Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/steventeen/apotek.git
   cd apotek
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Buat file `.env.local` dan isi dengan kunci dari Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📦 Panduan Deploy ke Vercel

1. **Push ke GitHub**: Pastikan semua perubahan sudah di-push ke branch `main`.
2. **Koneksikan ke Vercel**: Import proyek dari GitHub ke Dashboard Vercel.
3. **Set Environment Variables**: Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di panel pengaturan Vercel.
4. **Deploy**: Klik Deploy. Vercel akan menangani build dan deployment secara otomatis.

---
Dikembangkan dengan ❤️ untuk **Apotek Ulebi**.
