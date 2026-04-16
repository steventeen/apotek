# Aturan Pengembangan Apotek Ulebi

Aturan ini wajib diikuti oleh AI assistant dan pengembang untuk menjaga konsistensi codebase proyek Apotek Ulebi.

## 1. Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS
- **Backend/Database**: Supabase (Auth, PostgreSQL, Storage, Realtime)

## 2. Struktur Folder
Struktur proyek harus mengikuti konvensi berikut:
- `/src/app`: Halaman (pages), layout, dan routing.
- `/src/components`: Komponen UI yang reusable (Atom, Molecule, Organism).
- `/src/lib`: Utilities, konfigurasi Supabase client, dan helper functions.
- `/src/types`: Definisi tipe data TypeScript (Interface, Enum, Type).
- `/src/hooks`: Custom React hooks.

## 3. Konvensi Penamaan & Bahasa
- **Komentar Kode**: Gunakan **Bahasa Indonesia** untuk menjelaskan logika atau tujuan modul.
- **Variabel & Fungsi**: Gunakan **camelCase** dalam **Bahasa Inggris** (contoh: `getProducts`, `isLoading`).
- **Komponen React**: Gunakan **PascalCase** dalam **Bahasa Inggris** (contoh: `InventoryTable`).
- **File & Folder**: Gunakan **kebab-case** (contoh: `product-form.tsx`).

## 4. Keamanan & Database
- **Row Level Security (RLS)**: Semua operasi database WAJIB menghormati kebijakan RLS di Supabase. JANGAN melakukan bypass RLS kecuali ada alasan teknis yang sangat mendesak dan disetujui.
- **Server Actions**: Gunakan Next.js Server Actions untuk mutasi data dengan validasi di sisi server.

## 5. Dokumentasi
- Setiap fungsi yang kompleks harus memiliki deskripsi JSDoc singkat dalam Bahasa Indonesia.
- Update file `.agent/rules/apotek-ulebi.md` jika ada perubahan struktur atau ketentuan baru.
