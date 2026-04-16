'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ExportButton } from './ExportButton'
import { startOfDay, endOfDay, format } from 'date-fns'

export function HarianTab() {
  const supabase = createClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState({ omzet: 0, txCount: 0, profit: 0 })

  const fetchDaily = async () => {
    setLoading(true)
    try {
      const start = startOfDay(new Date(date)).toISOString()
      const end = endOfDay(new Date(date)).toISOString()

      // 1. Fetch Transactions for Summary
      const { data: txs } = await supabase
        .from('transaksi')
        .select(`
          id, 
          total, 
          detail_transaksi(qty, harga_satuan, obat(harga_beli))
        `)
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('status', 'selesai')

      if (txs) {
        const omzet = txs.reduce((acc, t) => acc + Number(t.total), 0)
        const txCount = txs.length
        let profit = 0
        txs.forEach(t => {
          t.detail_transaksi?.forEach((dt: any) => {
            const modal = dt.obat?.harga_beli || 0
            profit += (Number(dt.harga_satuan) - Number(modal)) * dt.qty
          })
        })
        setSummary({ omzet, txCount, profit })
      }

      // 2. Fetch Aggregated Items
      const { data: itemData } = await supabase
        .from('detail_transaksi')
        .select(`
          qty,
          harga_satuan,
          subtotal,
          obat(nama, kode_plu, kategori_obat(nama)),
          transaksi!inner(created_at, status)
        `)
        .gte('transaksi.created_at', start)
        .lte('transaksi.created_at', end)
        .eq('transaksi.status', 'selesai')

      if (itemData) {
        // Group by Obat ID or Name for the table
        const grouped: any = {}
        itemData.forEach((row: any) => {
          const name = row.obat?.nama || 'Unknown'
          if (!grouped[name]) {
            grouped[name] = {
              nama: name,
              kode: row.obat?.kode_plu,
              kategori: row.obat?.kategori_obat?.nama,
              qty: 0,
              total: 0
            }
          }
          grouped[name].qty += row.qty
          grouped[name].total += Number(row.subtotal)
        })
        setItems(Object.values(grouped))
      }
    } catch (e) {
      toast.error('Gagal mengambil data harian')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDaily()
  }, [date])

  const exportData = items.map(i => ({
    Tanggal: date,
    'Kode PLU': i.kode,
    'Nama Obat': i.nama,
    Kategori: i.kategori,
    Qty: i.qty,
    'Total Penjualan': i.total
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="w-48 h-10"
          />
          <Button variant="secondary" onClick={fetchDaily} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <ExportButton data={exportData} filename={`Laporan_Harian_${date}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 border-blue-100 bg-blue-50/30">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total Omset</p>
          <p className="text-2xl font-black text-gray-800">Rp {summary.omzet.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-4 border-purple-100 bg-purple-50/30">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Transaksi</p>
          <p className="text-2xl font-black text-gray-800">{summary.txCount}</p>
        </Card>
        <Card className="p-4 border-green-100 bg-green-50/30">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Estimasi Laba</p>
          <p className="text-2xl font-black text-gray-800">Rp {summary.profit.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama Obat</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Total Penjualan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-400 italic">
                  Tidak ada transaksi pada tanggal ini.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-gray-800">{item.nama}</TableCell>
                  <TableCell className="text-xs text-gray-500">{item.kategori || '-'}</TableCell>
                  <TableCell className="text-center font-mono">{item.qty}</TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    Rp {item.total.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
