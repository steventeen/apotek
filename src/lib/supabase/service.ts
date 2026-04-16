import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Service Role Client
 * HANYA untuk digunakan di SERVER (Server Actions, API Routes).
 * Client ini memiliki izin admin penuh (bypassing RLS).
 */
export const createAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
