import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const role = user?.app_metadata?.role

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Apotek Ulebi</h1>
      <p className="mb-4">Selamat datang, <span className="font-semibold">{user?.email}</span></p>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p>Role Anda: <span className="uppercase font-bold text-blue-700">{role}</span></p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow rounded-xl border">
          <h2 className="font-bold mb-2">Total Transaksi Hari Ini</h2>
          <p className="text-3xl font-bold text-blue-600">Rp 0</p>
        </div>
        <div className="p-6 bg-white shadow rounded-xl border">
          <h2 className="font-bold mb-2">Stok Obat Menipis</h2>
          <p className="text-3xl font-bold text-red-600">0</p>
        </div>
      </div>
    </div>
  )
}
