-- Fungsi untuk sinkronisasi role dari public.users ke auth.users (app_metadata)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger saat user baru dibuat di tabel public.users
DROP TRIGGER IF EXISTS tr_sync_role_insert ON public.users;
CREATE TRIGGER tr_sync_role_insert
AFTER INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();

-- Trigger saat role user diupdate di tabel public.users
DROP TRIGGER IF EXISTS tr_sync_role_update ON public.users;
CREATE TRIGGER tr_sync_role_update
AFTER UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();

-- COMMENT: Kode di atas memastikan bahwa field 'role' selalu ada di JWT Supabase Auth
-- sehingga Middleware dapat membacanya tanpa query database manual setiap saat.
