import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { UserTable } from './UserTable'
import { Toaster } from 'sonner'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'pemilik') redirect('/dashboard')

  // Fetch all users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('nama_lengkap', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Manajemen User" />
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen User</h1>
            <p className="text-slate-500">Kelola akses kasir dan apoteker ke sistem.</p>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="/api/admin/repair-users" 
              target="_blank"
              className="bg-amber-100 text-amber-800 hover:bg-amber-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
              title="Gunakan ini jika ada kasir yang tidak bisa login meskipun PIN sudah benar"
            >
              Sinkronisasi Auth
            </a>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <UserTable users={users || []} />
        </div>
        <Toaster position="top-right" richColors />
      </main>
    </div>
  )
}
