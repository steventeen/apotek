'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Loader2, TrendingUp, Trophy } from 'lucide-react'
import { startOfMonth, endOfMonth, endOfToday, format, subMonths, eachWeekOfInterval } from 'date-fns'
import { toast } from 'sonner'
import { ExportButton } from './ExportButton'

export function BulananTab() {
  const supabase = createClient()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])

  const fetchMonthly = async () => {
    setLoading(true)
    try {
      const start = startOfMonth(new Date(month)).toISOString()
      const end = endOfMonth(new Date(month)).toISOString()

      // 1. Fetch Weekly Data
      const { data: txs } = await supabase
        .from('transaksi')
        .select('total, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('status', 'selesai')

      if (txs) {
        const weeks = eachWeekOfInterval({
          start: new Date(start),
          end: new Date(end)
        })

        const mapped = weeks.map((w, idx) => {
          const wStart = w
          const wEnd = weeks[idx + 1] ? weeks[idx + 1] : new Date(end)
          const weekSales = txs
            .filter(t => {
              const d = new Date(t.created_at)
              return d >= wStart && d < wEnd
            })
            .reduce((acc, t) => acc + Number(t.total), 0)
          
          return { name: `W${idx + 1}`, sales: weekSales }
        })
        setWeeklyData(mapped)
      }

      // 2. Fetch Top 10 Items
      const { data: top } = await supabase
        .from('detail_transaksi')
        .select(`
          qty,
          subtotal,
          obat(nama, kode_plu),
          transaksi!inner(created_at, status)
        `)
        .gte('transaksi.created_at', start)
        .lte('transaksi.created_at', end)
        .eq('transaksi.status', 'selesai')

      if (top) {
        const aggregated: any = {}
        top.forEach((row: any) => {
          const name = row.obat?.nama || 'Unknown'
          if (!aggregated[name]) {
            aggregated[name] = { nama: name, qty: 0, total: 0 }
          }
          aggregated[name].qty += row.qty
          aggregated[name].total += Number(row.subtotal)
        })
        
        const sorted = Object.values(aggregated)
          .sort((a: any, b: any) => b.qty - a.qty)
          .slice(0, 10)
        
        setTopItems(sorted)
      }
    } catch (e) {
      toast.error('Gagal memuat rekap bulanan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonthly()
  }, [month])

  const exportData = topItems.map((item, idx) => ({
    Bulan: month,
    Peringkat: idx + 1,
    Obat: item.nama,
    'Qty Terjual': item.qty,
    'Total Rupiah': item.total
  }))

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { label: format(d, 'MMMM yyyy'), value: format(d, 'yyyy-MM') }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-64 h-10">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ExportButton data={exportData} filename={`Laporan_Top_10_${month}`} label="Export Top 10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Penjualan Mingguan
          </h3>
          <div className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(v) => `Rp ${v/1000}k`} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top 10 Items */}
        <Card className="p-6 rounded-2xl shadow-sm overflow-hidden">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Top 10 Laris
          </h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Memuat data...</div>
            ) : topItems.length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic">Data kosong.</div>
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate text-sm">{item.nama}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.qty} Terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-700">Rp {item.total.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
