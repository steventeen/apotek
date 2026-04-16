import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Membuat Supabase client untuk digunakan di Server Components, 
 * Server Actions, atau Route Handlers.
 * Client ini menangani cookies secara otomatis untuk autentikasi.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ini dibiarkan kosong agar Server Component tidak crash saat mencoba set cookies
            // Pengaturan cookies sebenarnya harus dilakukan di Middleware atau Route Handler
          }
        },
      },
    }
  )
}
