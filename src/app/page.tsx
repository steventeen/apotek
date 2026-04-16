'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  PlusCircle, 
  LayoutDashboard,
  Loader2,
  RefreshCcw,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryGrid } from '@/components/dashboard/SummaryGrid'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { SyncManager } from '@/lib/sync-manager'
import { ConnectivityIndicator } from '@/components/shared/ConnectivityIndicator'
import { AppHeader } from '@/components/shared/AppHeader'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DashboardPage() {
  const supabase = createClient()
  const isOnline = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('')
  const [stats, setStats] = useState({ totalSales: 0, txCount: 0, estimatedProfit: 0 })
  const [chartData, setChartData] = useState<{ date: string; sales: number }[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.app_metadata?.role || '')

      const today = new Date()
      const startOfToday = startOfDay(today).toISOString()
      const endOfToday = endOfDay(today).toISOString()

      // 1. Fetch Today's Stats
      const { data: todayTxs } = await supabase
        .from('transaksi')
        .select('id, total, detail_transaksi(qty, harga_satuan, obat(harga_beli))')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday)
        .eq('status', 'selesai')

      if (todayTxs) {
        const totalSales = todayTxs.reduce((acc, tx) => acc + Number(tx.total), 0)
        const txCount = todayTxs.length
        
        let estimatedProfit = 0
        todayTxs.forEach(tx => {
          tx.detail_transaksi?.forEach((dt: any) => {
            const hargaBeli = dt.obat?.harga_beli || 0
            estimatedProfit += (Number(dt.harga_satuan) - Number(hargaBeli)) * dt.qty
          })
        })

        setStats({ totalSales, txCount, estimatedProfit })
      }

      // 2. Fetch 7-Day Trend
      const sevenDaysAgo = subDays(today, 7).toISOString()
      const { data: recentTxs } = await supabase
        .from('transaksi')
        .select('total, created_at')
        .gte('created_at', sevenDaysAgo)
        .eq('status', 'selesai')
        .order('created_at', { ascending: true })

      if (recentTxs) {
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(today, 6 - i)
          return format(d, 'dd MMM')
        })

        const trend = days.map(dayLabel => {
          const daySales = recentTxs
            .filter(tx => format(new Date(tx.created_at), 'dd MMM') === dayLabel)
            .reduce((acc, tx) => acc + Number(tx.total), 0)
          return { date: dayLabel, sales: daySales }
        })
        setChartData(trend)
      }

      // 3. Fetch Low Stock
      const { data: lowStock } = await supabase
        .from('obat')
        .select('id, nama, stok, min_stok, satuan')
        .lte('stok', 'min_stok') // Error in filter logic fixed below: stok <= min_stok
      
      // Since Supabase doesn't support comparing columns directly in .lte easy, we fetch and filter
      const { data: allObat } = await supabase.from('obat').select('id, nama, stok, min_stok, satuan')
      if (allObat) {
        setLowStockItems(allObat.filter(o => o.stok <= o.min_stok))
      }

    } catch (e) {
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Initial Master Data Sync
    if (isOnline) {
      SyncManager.syncMasterData()
    }

    // Real-time Stock Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'obat' },
        (payload) => {
          const updated = payload.new as any
          setLowStockItems(prev => {
            const exists = prev.find(i => i.id === updated.id)
            if (updated.stok <= updated.min_stok) {
              if (exists) return prev.map(i => i.id === updated.id ? updated : i)
              return [...prev, updated]
            } else {
              return prev.filter(i => i.id !== updated.id)
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium animate-pulse">Menyiapkan Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="Dashboard Utama" />
      
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Summary Widgets */}
        <SummaryGrid stats={stats} />

        {/* Middle Section: Chart & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SalesChart data={chartData} />
          </div>
          <div className="lg:col-span-1">
            <LowStockAlert items={lowStockItems} />
          </div>
        </div>

        {/* Quick Actions / Role Specific */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Menu Cepat
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/kasir">
              <div className="p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 flex flex-col items-center gap-3 transition cursor-pointer group">
                <ShoppingCart className="w-6 h-6 text-blue-600 group-hover:scale-110 transition" />
                <span className="text-sm font-bold text-blue-800">Buka Kasir</span>
              </div>
            </Link>
            
            {['pemilik', 'apoteker'].includes(userRole) && (
              <Link href="/obat">
                <div className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-100 flex flex-col items-center gap-3 transition cursor-pointer group">
                  <Package className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition" />
                  <span className="text-sm font-bold text-emerald-800">Kelola Stok</span>
                </div>
              </Link>
            )}

            <Link href="/laporan">
              <div className="p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl border border-purple-100 flex flex-col items-center gap-3 transition cursor-pointer group">
                <FileText className="w-6 h-6 text-purple-600 group-hover:scale-110 transition" />
                <span className="text-sm font-bold text-purple-800">Lihat Laporan</span>
              </div>
            </Link>
            
            {userRole === 'pemilik' && (
              <Link href="/settings">
                <div className="p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl border border-orange-100 flex flex-col items-center gap-3 transition cursor-pointer group">
                  <LayoutDashboard className="w-6 h-6 text-orange-600 group-hover:scale-110 transition" />
                  <span className="text-sm font-bold text-orange-800">Pengaturan</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
