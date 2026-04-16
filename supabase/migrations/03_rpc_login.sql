-- Fungsi untuk verifikasi PIN secara aman (bypassing RLS)
-- Fungsi ini berjalan sebagai SECURITY DEFINER (superuser) agar anon user dapat mengecek PIN tanpa akses penuh ke tabel users.

CREATE OR REPLACE FUNCTION public.check_user_pin(p_pin TEXT)
RETURNS TABLE (id UUID, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.role
    FROM public.users u
    WHERE u.pin = p_pin
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Berikan izin akses ke publik/anon agar dapat memanggil fungsi ini
GRANT EXECUTE ON FUNCTION public.check_user_pin(TEXT) TO anon, authenticated;
