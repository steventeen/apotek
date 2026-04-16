-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITIONS

-- Tabel Profil User (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('pemilik', 'apoteker', 'kasir_senior', 'kasir_magang')),
    pin TEXT NOT NULL CHECK (length(pin) = 4),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pengaturan Toko
CREATE TABLE IF NOT EXISTS public.toko_settings (
    id SERIAL PRIMARY KEY,
    nama_toko TEXT NOT NULL,
    jenis_usaha TEXT NOT NULL CHECK (jenis_usaha IN ('apotek', 'toko_obat', 'kios_obat')),
    no_izin TEXT,
    alamat TEXT,
    no_hp TEXT,
    nama_apoteker TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kategori Obat
CREATE TABLE IF NOT EXISTS public.kategori_obat (
    id SERIAL PRIMARY KEY,
    nama TEXT NOT NULL,
    warna TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Master Data Obat
CREATE TABLE IF NOT EXISTS public.obat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_plu TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    kategori_id INTEGER REFERENCES public.kategori_obat(id) ON DELETE SET NULL,
    harga_beli DECIMAL(12,2) NOT NULL DEFAULT 0,
    harga_jual DECIMAL(12,2) NOT NULL DEFAULT 0,
    stok INTEGER NOT NULL DEFAULT 0,
    min_stok INTEGER NOT NULL DEFAULT 0,
    satuan TEXT NOT NULL,
    isi_per_kemasan INTEGER,
    lokasi_rak TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transaksi Penjualan
CREATE TABLE IF NOT EXISTS public.transaksi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_invoice TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    bayar DECIMAL(12,2) NOT NULL DEFAULT 0,
    kembali DECIMAL(12,2) NOT NULL DEFAULT 0,
    metode TEXT NOT NULL CHECK (metode IN ('tunai', 'qris')),
    status TEXT NOT NULL CHECK (status IN ('selesai', 'retur')) DEFAULT 'selesai',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Detail Item Transaksi
CREATE TABLE IF NOT EXISTS public.detail_transaksi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaksi_id UUID REFERENCES public.transaksi(id) ON DELETE CASCADE,
    obat_id UUID REFERENCES public.obat(id) ON DELETE SET NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    harga_satuan DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

-- Stok Opname
CREATE TABLE IF NOT EXISTS public.stok_opname (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    obat_id UUID REFERENCES public.obat(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    stok_sistem INTEGER NOT NULL,
    stok_fisik INTEGER NOT NULL,
    selisih INTEGER NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FUNCTIONS & TRIGGERS

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_obat_modtime BEFORE UPDATE ON public.obat FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON public.toko_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Deduct Stock on Sale
CREATE OR REPLACE FUNCTION public.handle_deduct_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.obat
    SET stok = stok - NEW.qty
    WHERE id = NEW.obat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_deduct_stock
AFTER INSERT ON public.detail_transaksi
FOR EACH ROW EXECUTE FUNCTION public.handle_deduct_stock();

-- Trigger: Restore Stock on Retur
CREATE OR REPLACE FUNCTION public.handle_restore_stock_on_retur()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika status berubah jadi retur, kembalikan stok semua item di transaksi tersebut
    IF NEW.status = 'retur' AND OLD.status = 'selesai' THEN
        UPDATE public.obat o
        SET stok = o.stok + dt.qty
        FROM public.detail_transaksi dt
        WHERE dt.transaksi_id = NEW.id AND dt.obat_id = o.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_restore_stock_retur
AFTER UPDATE ON public.transaksi
FOR EACH ROW EXECUTE FUNCTION public.handle_restore_stock_on_retur();

-- 4. ROW LEVEL SECURITY (RLS) policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toko_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stok_opname ENABLE ROW LEVEL SECURITY;

-- Politik: Users
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pemilik can manage all users" ON public.users FOR ALL USING (public.get_my_role() = 'pemilik');

-- Politik: Toko Settings
CREATE POLICY "Authenticated users can view settings" ON public.toko_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pemilik can manage settings" ON public.toko_settings FOR ALL USING (public.get_my_role() = 'pemilik');

-- Politik: Kategori Obat
CREATE POLICY "Everyone can view categories" ON public.kategori_obat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pemilik/Apoteker can manage categories" ON public.kategori_obat FOR ALL USING (public.get_my_role() IN ('pemilik', 'apoteker'));

-- Politik: Obat
CREATE POLICY "Everyone can view obat" ON public.obat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pemilik/Apoteker can manage obat" ON public.obat FOR ALL USING (public.get_my_role() IN ('pemilik', 'apoteker'));

-- Politik: Transaksi
CREATE POLICY "Everyone can view transactions" ON public.transaksi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized can insert transactions" ON public.transaksi FOR INSERT WITH CHECK (public.get_my_role() IN ('pemilik', 'apoteker', 'kasir_senior', 'kasir_magang'));
CREATE POLICY "Kasir Senior can update for retur within 24h" ON public.transaksi 
    FOR UPDATE 
    USING (
        (public.get_my_role() = 'kasir_senior' AND created_at > now() - interval '24 hours') OR
        (public.get_my_role() IN ('pemilik', 'apoteker'))
    );
CREATE POLICY "Pemilik/Apoteker can manage transactions" ON public.transaksi FOR ALL USING (public.get_my_role() IN ('pemilik', 'apoteker'));

-- Politik: Detail Transaksi
CREATE POLICY "Everyone can view details" ON public.detail_transaksi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized can insert details" ON public.detail_transaksi FOR INSERT WITH CHECK (public.get_my_role() IN ('pemilik', 'apoteker', 'kasir_senior', 'kasir_magang'));

-- Politik: Stok Opname
CREATE POLICY "Authorized can view opname" ON public.stok_opname FOR SELECT USING (public.get_my_role() IN ('pemilik', 'apoteker'));
CREATE POLICY "Pemilik/Apoteker can manage opname" ON public.stok_opname FOR ALL USING (public.get_my_role() IN ('pemilik', 'apoteker'));
