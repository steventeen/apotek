'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  FileText, 
  BarChart3, 
  ClipboardCheck, 
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { HarianTab } from '@/components/laporan/HarianTab'
import { BulananTab } from '@/components/laporan/BulananTab'
import { OpnameTab } from '@/components/laporan/OpnameTab'
import { useRouter } from 'next/navigation'

export default function LaporanPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const role = user?.app_metadata?.role

      if (!['pemilik', 'apoteker'].includes(role)) {
        setAuthorized(false)
        setLoading(false)
        // Redirect non-authorized after 3 seconds or just show block
      } else {
        setAuthorized(true)
        setLoading(false)
      }
    }
    checkAccess()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-md text-center space-y-4">
          <div className="bg-red-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Akses Terbatas</h2>
          <p className="text-gray-500 text-sm">Maaf, halaman Laporan & Stok Opname hanya dapat diakses oleh Pemilik atau Apoteker.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold hover:bg-slate-800 transition"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-100">
            <BarChart3 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Pusat Laporan & Audit</h1>
            <p className="text-gray-500 text-sm italic">Analisis performa toko dan audit stok fisik Anda.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="harian" className="space-y-6">
        <TabsList className="bg-slate-100 p-1.5 h-14 rounded-2xl w-full md:w-auto grid grid-cols-3 md:inline-flex border">
          <TabsTrigger value="harian" className="rounded-xl px-6 font-bold flex items-center gap-2 h-11 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4" /> Harian
          </TabsTrigger>
          <TabsTrigger value="bulanan" className="rounded-xl px-6 font-bold flex items-center gap-2 h-11 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" /> Bulanan
          </TabsTrigger>
          <TabsTrigger value="opname" className="rounded-xl px-6 font-bold flex items-center gap-2 h-11 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <ClipboardCheck className="w-4 h-4" /> Stok Opname
          </TabsTrigger>
        </TabsList>

        <TabsContent value="harian" className="mt-6">
          <HarianTab />
        </TabsContent>
        <TabsContent value="bulanan" className="mt-6">
          <BulananTab />
        </TabsContent>
        <TabsContent value="opname" className="mt-6">
          <OpnameTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
