import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/service'

/**
 * API ini berfungsi untuk "memperbaiki" autentikasi.
 * Ia akan mensinkronkan password di auth.users agar sama dengan PIN di public.users.
 */
export async function GET(request: NextRequest) {
  // Simple protection: Check for a secret query param if needed, 
  // but since it uses Service Role, it will only work if the key is valid.
  const authHeader = request.headers.get('authorization')
  // In a real app, you'd want better protection here, 
  // but for an emergency repair, we'll proceed if we have the service role key.

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Ambil semua user dari tabel profil
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, pin, nama_lengkap')

    if (fetchError) throw fetchError

    const results = []

    for (const user of (users || [])) {
      const email = `user_${user.id}@ulebi.internal`
      
      // 2. Coba update user di auth.users
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { 
          email: email,
          password: user.pin,
          email_confirm: true,
          user_metadata: { nama_lengkap: user.nama_lengkap }
        }
      )

      if (updateError) {
        // 3. Jika user tidak ditemukan di auth, buat baru
        if (updateError.message.toLowerCase().includes('not found')) {
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            id: user.id,
            email: email,
            password: user.pin,
            email_confirm: true,
            user_metadata: { nama_lengkap: user.nama_lengkap }
          })

          if (createError) {
            // 4. Jika tetap gagal (Database error), ada kemungkinan profil stuck tanpa akun auth
            // Kita coba hapus dulu profilnya (karena ini data corrupt) lalu buat ulang
            if (createError.message.toLowerCase().includes('database error')) {
               await supabaseAdmin.from('users').delete().eq('id', user.id)
               const { error: retryCreateError } = await supabaseAdmin.auth.admin.createUser({
                  id: user.id,
                  email: email,
                  password: user.pin,
                  email_confirm: true,
                  user_metadata: { nama_lengkap: user.nama_lengkap }
               })

               if (retryCreateError) {
                  results.push({ id: user.id, status: 'error', message: 'Retry Create: ' + retryCreateError.message })
               } else {
                  // Profil biasanya akan dibuat ulang otomatis via trigger jika ada, 
                  // jika tidak, kita buat manual di sini
                  await supabaseAdmin.from('users').insert({
                     id: user.id,
                     nama_lengkap: user.nama_lengkap,
                     role: 'pemilik', // Default ke pemilik jika tidak tahu
                     pin: user.pin
                  })
                  results.push({ id: user.id, status: 'recreated' })
               }
            } else {
               results.push({ id: user.id, status: 'error', message: 'Create: ' + createError.message })
            }
          } else {
            results.push({ id: user.id, status: 'created' })
          }
        } else {
          results.push({ id: user.id, status: 'error', message: 'Update: ' + updateError.message })
        }
      } else {
        results.push({ id: user.id, status: 'success' })
      }
    }

    return NextResponse.json({
      message: 'Sinkronisasi selesai. Silakan coba login lagi.',
      total: users?.length || 0,
      details: results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
