import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/service'

/**
 * API Sinkronisasi User Auth
 *
 * Tugas utama:
 * 1. Baca semua user dari public.users
 * 2. Untuk tiap user: buat/update akun di auth.users dengan:
 *    - email: user_<uuid>@ulebi.internal
 *    - password: ulebi_<pin>   (format KONSISTEN dengan LoginForm)
 *    - app_metadata.role: <role>  (wajib agar middleware bisa baca role)
 * 3. Pastikan selalu ada minimal 1 akun pemilik (PIN 1234) sebagai fallback
 *
 * Cara akses: GET /api/admin/repair-users
 */
export async function GET(request: NextRequest) {
  const supabaseAdmin = createAdminClient()

  try {
    // ── LANGKAH 1: Ambil semua profil user ──────────────────────────────────
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, pin, nama_lengkap, role')

    if (fetchError) throw new Error('Gagal baca tabel users: ' + fetchError.message)

    const results: Array<{ id: string; nama: string; status: string; message?: string }> = []

    // ── LANGKAH 2: Sinkronisasi tiap user ke auth.users ─────────────────────
    for (const user of (users || [])) {
      const email = `user_${user.id}@ulebi.internal`
      const password = `ulebi_${user.pin}` // Format HARUS sama dengan LoginForm
      const appMeta = { role: user.role }

      // Coba update dulu (jika akun auth sudah ada)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email,
          password,
          email_confirm: true,
          app_metadata: appMeta,
          user_metadata: { nama_lengkap: user.nama_lengkap },
        }
      )

      if (!updateError) {
        results.push({ id: user.id, nama: user.nama_lengkap, status: 'updated' })
        continue
      }

      // Jika gagal update karena user tidak ditemukan → buat baru
      const isNotFound =
        updateError.message.toLowerCase().includes('not found') ||
        updateError.message.toLowerCase().includes('user not found') ||
        updateError.status === 404

      if (isNotFound) {
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email,
          password,
          email_confirm: true,
          app_metadata: appMeta,
          user_metadata: { nama_lengkap: user.nama_lengkap },
        })

        if (createError) {
          results.push({
            id: user.id,
            nama: user.nama_lengkap,
            status: 'error',
            message: 'Create failed: ' + createError.message,
          })
        } else {
          results.push({ id: user.id, nama: user.nama_lengkap, status: 'created' })
        }
      } else {
        results.push({
          id: user.id,
          nama: user.nama_lengkap,
          status: 'error',
          message: 'Update failed: ' + updateError.message,
        })
      }
    }

    // ── LANGKAH 3: Pastikan ada akun pemilik fallback ────────────────────────
    // Jika tidak ada satu pun user sukses, atau sebagai jaring pengaman,
    // buat akun "Pemilik Default" dengan PIN 1234
    const hasSuccess = results.some(r => r.status === 'updated' || r.status === 'created')
    let fallbackMessage = ''

    if (!hasSuccess || (users || []).length === 0) {
      const fallbackId = crypto.randomUUID()
      const fallbackEmail = `pemilik_default@ulebi.internal`
      const fallbackPin = '1234'

      const { error: fallbackAuthError } = await supabaseAdmin.auth.admin.createUser({
        id: fallbackId,
        email: fallbackEmail,
        password: `ulebi_${fallbackPin}`,
        email_confirm: true,
        app_metadata: { role: 'pemilik' },
        user_metadata: { nama_lengkap: 'Pemilik Default' },
      })

      if (!fallbackAuthError) {
        const { error: fallbackDbError } = await supabaseAdmin.from('users').insert({
          id: fallbackId,
          nama_lengkap: 'Pemilik Default',
          role: 'pemilik',
          pin: fallbackPin,
        })

        if (!fallbackDbError) {
          fallbackMessage = 'Akun fallback "Pemilik Default" dibuat. Gunakan PIN 1234 untuk login.'
          results.push({ id: fallbackId, nama: 'Pemilik Default', status: 'created (fallback)' })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sinkronisasi selesai.',
      fallback_info: fallbackMessage || null,
      total_users: users?.length || 0,
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
