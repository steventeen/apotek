import { createClient } from '@/lib/supabase/server'

export default async function KasirPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Point of Sale (Kasir)</h1>
      <p className="mb-6 text-gray-600">Selamat bekerja, <span className="font-semibold">{user?.email}</span> (Role: {role})</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm h-96 flex items-center justify-center text-gray-400">
            [ Area Pencarian & Daftar Item ]
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm h-96 flex flex-col justify-between">
            <h2 className="font-bold border-bottom pb-2">Ringkasan Pesanan</h2>
            <div className="text-4xl font-bold text-center text-blue-600">Rp 0</div>
            <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
              BAYAR SEKARANG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
