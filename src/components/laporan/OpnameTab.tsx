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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Search, 
  Scan, 
  Save, 
  Loader2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

export function OpnameTab() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [medicines, setMedicines] = useState<any[]>([])
  const [opnameData, setOpnameData] = useState<Record<string, number>>({})
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const searchMedicine = async () => {
    if (!searchTerm) {
      toast.info('Masukkan nama atau kode PLU')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('obat')
        .select('id, nama, kode_plu, stok, satuan')
        .or(`nama.ilike.%${searchTerm}%,kode_plu.eq.${searchTerm}`)
        .limit(10)
      
      if (error) throw error
      setMedicines(data || [])
    } catch (e) {
      toast.error('Gagal mencari obat')
    } finally {
      setLoading(false)
    }
  }

  const handleOpnameChange = (id: string, value: string) => {
    setOpnameData(prev => ({ ...prev, [id]: Number(value) }))
  }

  const handleRemarkChange = (id: string, value: string) => {
    setRemarks(prev => ({ ...prev, [id]: value }))
  }

  const submitOpname = async (id: string) => {
    const fisik = opnameData[id]
    if (fisik === undefined) {
      toast.error('Input stok fisik terlebih dahulu')
      return
    }

    const item = medicines.find(m => m.id === id)
    const selisih = fisik - item.stok
    
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Record to Audit Log
      const { error: logError } = await supabase
        .from('stok_opname')
        .insert([{
          obat_id: id,
          user_id: user?.id,
          stok_sistem: item.stok,
          stok_fisik: fisik,
          selisih: selisih,
          keterangan: remarks[id] || 'Stok Opname Rutin'
        }])
      
      if (logError) throw logError

      // 2. Sync / Update Master Obat
      const { error: updateError } = await supabase
        .from('obat')
        .update({ stok: fisik })
        .eq('id', id)
      
      if (updateError) throw updateError

      toast.success(`Berhasil sinkronisasi stok: ${item.nama}`)
      
      // Update local state to reflect new system stock
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, stok: fisik } : m))
      
      // Clear inputs for this item
      const newOpname = { ...opnameData }
      delete newOpname[id]
      setOpnameData(newOpname)

    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan opname')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white border-none shadow-sm flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Ketik nama obat atau scan barcode untuk opname..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchMedicine()}
          />
        </div>
        <Button className="h-11 px-6 bg-slate-900" onClick={searchMedicine} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scan className="w-4 h-4 mr-2" />}
          Cari Obat
        </Button>
      </Card>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama Obat / PLU</TableHead>
              <TableHead className="text-center">Stok Sistem</TableHead>
              <TableHead className="text-center w-[150px]">Stok Fisik</TableHead>
              <TableHead className="text-center">Selisih</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-gray-400 italic">
                  Belum ada obat yang dipilih. Gunakan pencarian di atas.
                </TableCell>
              </TableRow>
            ) : (
              medicines.map(item => {
                const fisik = opnameData[item.id]
                const selisih = fisik !== undefined ? fisik - item.stok : 0
                
                return (
                  <TableRow key={item.id} className="hover:bg-slate-50 transition">
                    <TableCell>
                      <p className="font-bold text-gray-800">{item.nama}</p>
                      <p className="text-[10px] text-gray-400 font-mono tracking-wider">{item.kode_plu}</p>
                    </TableCell>
                    <TableCell className="text-center font-bold text-gray-500">
                      {item.stok} {item.satuan}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input 
                        type="number" 
                        min={0}
                        className="h-9 text-center font-black bg-blue-50 border-blue-200"
                        placeholder="Fisik"
                        value={opnameData[item.id] ?? ''}
                        onChange={(e) => handleOpnameChange(item.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {fisik !== undefined && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          selisih === 0 ? 'bg-slate-100 text-slate-500' : 
                          selisih < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {selisih > 0 ? `+${selisih}` : selisih}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Catatan..." 
                        className="h-9 text-xs"
                        value={remarks[item.id] || ''}
                        onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 h-9 gap-2"
                        onClick={() => submitOpname(item.id)}
                        disabled={isSubmitting || fisikus === undefined}
                      >
                        <Save className="w-4 h-4" />
                        Simpan
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          <span className="font-bold">Perhatian:</span> Menyimpan data stok opname akan <span className="underline italic">otomatis memperbarui</span> jumlah stok obat di database sistem agar sesuai dengan jumlah fisik yang Anda input. Semua riwayat selisih tetap akan tersimpan di tabel audit stok opname.
        </p>
      </div>
    </div>
  )
}
