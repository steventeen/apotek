'use server'

import { createAdminClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function addUser(formData: { nama_lengkap: string; role: string; pin: string }) {
  const supabase = createAdminClient()

  // 1. Buat user di auth.users terlebih dahulu
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: `temp_${Date.now()}@ulebi.internal`, // Email sementara, akan di-update setelah dapet ID
    password: `ulebi_${formData.pin}`,
    email_confirm: true,
    app_metadata: { role: formData.role }
  })

  if (authError) throw new Error('Gagal membuat akun auth: ' + authError.message)
  if (!authData.user) throw new Error('User tidak terbuat')

  const userId = authData.user.id
  const properEmail = `user_${userId}@ulebi.internal`

  // 2. Update email auth menjadi format standar
  await supabase.auth.admin.updateUserById(userId, { email: properEmail })

  // 3. Masukkan ke tabel public.users
  const { error: profileError } = await supabase
    .from('users')
    .insert([{
      id: userId,
      nama_lengkap: formData.nama_lengkap,
      role: formData.role,
      pin: formData.pin
    }])

  if (profileError) {
    // Cleanup if profile creation fails
    await supabase.auth.admin.deleteUser(userId)
    throw new Error('Gagal membuat profil: ' + profileError.message)
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserPin(userId: string, newPin: string) {
  const supabase = createAdminClient()

  // 1. Update di auth.users (Password)
  const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
    password: `ulebi_${newPin}`
  })

  if (authError) throw new Error('Gagal update password auth: ' + authError.message)

  // 2. Update di public.users (PIN)
  const { error: profileError } = await supabase
    .from('users')
    .update({ pin: newPin })
    .eq('id', userId)

  if (profileError) throw new Error('Gagal update PIN profil: ' + profileError.message)

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = createAdminClient()

  // Tabel public.users akan terhapus otomatis via ON DELETE CASCADE di database
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error('Gagal menghapus user: ' + error.message)

  revalidatePath('/admin')
  return { success: true }
}
