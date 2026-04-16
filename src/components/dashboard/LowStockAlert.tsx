'use client'

import { AlertCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'

interface LowStockItem {
  id: string
  nama: string
  stok: number
  min_stok: number
  satuan: string
}

interface LowStockAlertProps {
  items: LowStockItem[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyToWA = () => {
    if (items.length === 0) return

    const header = `*DAFTAR PESANAN OBAT (STOK MENIPIS)*\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`
    const list = items.map((item, idx) => `${idx + 1}. ${item.nama} (Sisa: ${item.stok} ${item.satuan})`).join('\n')
    const footer = `\n\n_Segera dipesan ke PBF._`

    navigator.clipboard.writeText(header + list + footer)
    setCopied(true)
    toast.success('Daftar pesanan berhasil di-copy ke clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b flex items-center justify-between bg-red-50/30">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-lg text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800">Stok Hampir Habis</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 border-red-200 text-red-600 hover:bg-red-50"
          onClick={handleCopyToWA}
          disabled={items.length === 0}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy ke WA
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 italic text-sm">
            Semua stok dalam kondisi aman.
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{item.nama}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Minimal: {item.min_stok} {item.satuan}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${item.stok === 0 ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                    {item.stok} {item.satuan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
