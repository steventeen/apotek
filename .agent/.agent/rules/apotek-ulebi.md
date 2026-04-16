# Workspace Rules - Apotek Ulebi

Daftar aturan dan standar pengembangan untuk project Apotek Ulebi.

## 1. Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (Auth, PostgreSQL, Storage, RLS)

## 2. Struktur Folder
Seluruh kode sumber berada di dalam direktori `src/`:
- `src/app`: Definisi halaman, routing, dan layout (App Router).
- `src/components`: Komponen UI yang reusable dan bersifat modular.
- `src/lib`: Utilities, konfigurasi Supabase client, dan fungsi helper.
- `src/types`: Definisi tipe data TypeScript (Interface, Type, Enums).
- `src/hooks`: Custom React hooks untuk logika yang dapat digunakan kembali.

## 3. Konvensi Penulisan Kode
- **Komentar**: Gunakan **Bahasa Indonesia** untuk menjelaskan logika kode yang kompleks atau memberikan dokumentasi fungsi.
- **Penamaan**: Gunakan **camelCase** dalam **Bahasa Inggris** untuk nama fungsi, variabel, dan properti.
  - Contoh: `getProductData`, `totalAmount`, `isTransactionPending`.
- **Komponen**: Gunakan **PascalCase** untuk nama komponen React.
  - Contoh: `Navbar.tsx`, `TransactionCard.tsx`.

## 4. Keamanan & Database
- Semua operasi database **WAJIB** mematuhi kebijakan **Row Level Security (RLS)** di Supabase.
- Pastikan setiap query mempertimbangkan hak akses pengguna berdasarkan role (Owner, Apothecary, Senior Cashier, Junior Cashier).
- Gunakan `supabase-js` client yang dikonfigurasi di `src/lib/supabase.ts`.

## 5. Komitmen Terhadap Desain
- Gunakan desain yang **Premium**, **Aesthetic**, dan **Responsive**.
- Prioritaskan pengalaman pengguna (UX) dengan mikro-animasi dan transisi yang halus.
- Implementasikan fitur **Offline-First** (PWA) untuk memastikan kasir tetap bisa bekerja di area dengan sinyal lemah.
