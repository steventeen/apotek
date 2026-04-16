import { createBrowserClient } from '@supabase/ssr'

/**
 * Membuat Supabase client untuk digunakan di Client Components.
 * Client ini akan berjalan di browser pengguna.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
