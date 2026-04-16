'use client'

import { useState } from 'react'
import { StrukRenderer } from '@/components/Struk'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CartItem } from '@/hooks/useCart'

interface CheckoutModalProps {
  items: CartItem[]
  total: number
  toko: { nama: string; alamat: string; no_hp: string }
  userEmail: string
  onConfirm: (bayar: number, kembali: number) => Promise<void>
  onClose: () => void
}

export function CheckoutModal({ items, total, toko, userEmail, onConfirm, onClose }: CheckoutModalProps) {
  const [bayar, setBayar] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [invoiceNo, setInvoiceNo] = useState('')

  const numBayar = Number(bayar) || 0
  const kembali = numBayar - total

  const handleProcess = async () => {
    if (numBayar < total) {
      toast.error('Jumlah bayar kurang')
      return
    }
    const noInvoice = `INV-${new Date().getTime()}`
    setInvoiceNo(noInvoice)
    await onConfirm(numBayar, kembali)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col items-center p-6 text-center animate-in zoom-in-95 duration-200 my-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Transaksi Berhasil!</h2>
          <p className="text-xs text-gray-400 mb-6">Data telah diamankan ke sistem.</p>
          
          <div className="w-full bg-slate-50 rounded-2xl p-2 mb-6">
            <StrukRenderer 
              toko={toko}
              transaksi={{
                no_invoice: invoiceNo,
                kasir: userEmail.split('@')[0],
                tanggal: new Date().toLocaleString('id-ID')
              }}
              items={items.map(item => ({
                nama: item.nama,
                qty: item.quantity,
                harga: item.harga_jual,
                subtotal: item.harga_jual * item.quantity
              }))}
              total={total}
              bayar={numBayar}
              kembali={kembali}
            />
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold rounded-2xl" onClick={onClose}>
            Tutup
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
                  type="button"
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
