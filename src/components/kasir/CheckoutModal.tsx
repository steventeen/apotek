'use client'

import { useState, useRef } from 'react'
import { CheckCircle2, Download, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/hooks/useCart'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

interface CheckoutModalProps {
  items: CartItem[]
  total: number
  onConfirm: (bayar: number, kembali: number) => Promise<void>
  onClose: () => void
}

export function CheckoutModal({ items, total, onConfirm, onClose }: CheckoutModalProps) {
  const [bayar, setBayar] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  const numBayar = Number(bayar) || 0
  const kembali = numBayar - total

  const handleProcess = async () => {
    if (numBayar < total) {
      toast.error('Jumlah bayar kurang')
      return
    }
    await onConfirm(numBayar, kembali)
    setIsSuccess(true)
  }

  const saveAsImage = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current)
      const link = document.createElement('a')
      link.download = `struk-${new Date().getTime()}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaksi Berhasil!</h2>
          <p className="text-gray-500 mb-8">Data telah disimpan {navigator.onLine ? 'ke cloud' : 'secara lokal (offline)'}.</p>
          
          {/* Receipt Preview (Hidden from view, used for capture) */}
          <div className="fixed left-[-9999px]">
            <div ref={receiptRef} className="p-8 bg-white text-black w-[300px] font-mono text-sm leading-tight border">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg uppercase">APOTEK ULEBI</h3>
                <p>Kesehatan Anda Prioritas Kami</p>
                <p className="text-[10px] mt-1">{new Date().toLocaleString('id-ID')}</p>
                <div className="border-b border-dashed my-2"></div>
              </div>
              <div className="space-y-1 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.nama} x{item.quantity}</span>
                    <span>{(Number(item.harga_jual) * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="border-b border-dashed my-2"></div>
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>BAYAR</span>
                <span>Rp {numBayar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between underline">
                <span>KEMBALI</span>
                <span>Rp {kembali.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-center mt-6 text-[10px]">
                <p>Terima kasih atas kunjungan Anda</p>
                <p>Semoga lekas sembuh</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full mb-4">
            <Button variant="outline" className="flex items-center gap-2" onClick={saveAsImage}>
              <Download className="w-4 h-4" /> Gambar
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={() => toast.info('Fitur cetak Bluetooth sedang disiapkan')}>
              <Printer className="w-4 h-4" /> Struk
            </Button>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Pembayaran</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
            <span className="text-blue-700 font-semibold text-lg">Total Tagihan</span>
            <span className="text-2xl font-black text-blue-900">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Jumlah Bayar</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">Rp</span>
              <input 
                type="number" 
                className="w-full h-16 bg-gray-100 rounded-2xl pl-14 pr-4 text-3xl font-black text-gray-800 outline-none focus:ring-4 focus:ring-blue-100 transition"
                autoFocus
                value={bayar}
                onChange={(e) => setBayar(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[total, 50000, 100000].map(val => (
                <button 
                  key={val}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold transition"
                  onClick={() => setBayar(val.toString())}
                >
                  {val.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Kembalian</span>
            <span className={`text-2xl font-black ${kembali < 0 ? 'text-red-500' : 'text-gray-800'}`}>
              Rp {kembali.toLocaleString('id-ID')}
            </span>
          </div>
          
          <Button 
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-xl font-bold rounded-2xl shadow-lg shadow-blue-200"
            disabled={numBayar < total}
            onClick={handleProcess}
          >
            KONFIRMASI PEMBAYARAN
          </Button>
        </div>
      </div>
    </div>
  )
}
