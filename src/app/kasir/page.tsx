'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Camera, ShoppingCart, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/hooks/useCart'
import { db, LocalObat } from '@/lib/offline-db'
import { BarcodeScanner } from '@/components/kasir/BarcodeScanner'
import { CartItem } from '@/components/kasir/CartItem'
import { CheckoutModal } from '@/components/kasir/CheckoutModal'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { SyncManager } from '@/lib/sync-manager'
import { ConnectivityIndicator } from '@/components/shared/ConnectivityIndicator'

export default function KasirClient() {
  const supabase = createClient()
  const isOnline = useOnlineStatus()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<LocalObat[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [tokoSettings, setTokoSettings] = useState<any>(null)
  
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCart()

  // 1. Fetch Toko Settings & Initial Sync
  useEffect(() => {
    async function init() {
      // Fetch Toko Settings
      const { data } = await supabase.from('toko_settings').select('*').limit(1).maybeSingle()
      if (data) setTokoSettings(data)
      
      // Auto-sync master data on load if online
      if (isOnline) {
        await SyncManager.syncMasterData()
      }
    }
    init()
  }, [supabase, isOnline])

  // 2. Search Logic (IndexedDB First)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const performSearch = async () => {
      const results = await db.obat
        .filter(p => 
          p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.kode_plu.includes(searchTerm)
        )
        .limit(5)
        .toArray()
      setSearchResults(results)
    }

    const timeoutId = setTimeout(performSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // 3. Handle Scanner Result
  const handleScan = async (code: string) => {
    const product = await db.obat.where('kode_plu').equals(code).first()
    if (product) {
      addToCart(product)
      toast.success(`Ditambahkan: ${product.nama}`)
      setShowScanner(false)
    } else {
      toast.error('Obat tidak ditemukan di database lokal')
    }
  }

  // 4. Handle Checkout
  const handleCheckout = async (bayar: number, kembali: number) => {
    const noInvoice = `INV-${new Date().getTime()}`
    
    const mainTransaction = {
      no_invoice: noInvoice,
      total: total,
      bayar: bayar,
      kembali: kembali,
      metode: 'tunai',
      status: 'selesai',
      created_at: new Date().toISOString()
    }

    const transactionDetails = items.map(item => ({
      obat_id: item.id,
      qty: item.quantity,
      harga_satuan: item.harga_jual,
      subtotal: item.harga_jual * item.quantity
    }))

    // Save to Offline Queue
    try {
      await db.transactions.add({
        temp_id: `offline-${Date.now()}`,
        no_invoice: noInvoice,
        data: { main: mainTransaction, details: transactionDetails },
        created_at: Date.now(),
        status: 'pending'
      })

      // Optimistic Stock Update in local DB
      for (const item of items) {
        const local = await db.obat.get(item.id)
        if (local) {
          await db.obat.update(item.id, { stok: local.stok - item.quantity })
        }
      }

      toast.success(isOnline ? 'Transaksi berhasil diproses' : 'Transaksi disimpan (Mode Offline)')
      
      // If online, try to sync immediately
      if (isOnline) {
        SyncManager.uploadPendingTransactions()
      }

      clearCart()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menyimpan transaksi')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShoppingCart className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kasir Ulebi</h1>
        </div>

        <ConnectivityIndicator />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Search Area */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition" />
            <Input 
              placeholder="Cari nama obat atau scan PLU..."
              className="h-16 pl-12 pr-16 text-lg rounded-2xl border-2 focus:border-blue-500 shadow-sm transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              size="icon" 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none rounded-xl"
              onClick={() => setShowScanner(true)}
            >
              <Camera className="w-6 h-6" />
            </Button>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border overflow-hidden z-20">
                {searchResults.map(p => {
                  const isLow = p.stok <= p.min_stok
                  return (
                    <button 
                      key={p.id}
                      className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition border-b last:border-none"
                      onClick={() => {
                        addToCart(p)
                        setSearchTerm('')
                        setSearchResults([])
                      }}
                    >
                      <div className="text-left min-w-0 pr-4">
                        <p className="font-bold text-gray-800 truncate">{p.nama}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{p.kode_plu} • 
                          <span className={isLow ? 'text-red-500 font-bold ml-1' : 'ml-1'}>
                            Stok: {p.stok} {p.satuan}
                          </span>
                        </p>
                      </div>
                      <p className="font-bold text-blue-600 whitespace-nowrap">Rp {Number(p.harga_jual).toLocaleString('id-ID')}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cart List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Keranjang Belanja ({items.length})</h3>
            {items.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 h-64 flex flex-col items-center justify-center text-gray-300">
                <ShoppingCart className="w-16 h-16 mb-2 opacity-10" />
                <p className="font-medium">Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    onUpdateQuantity={updateQuantity} 
                    onRemove={removeFromCart} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[32px] border shadow-xl sticky top-24 overflow-hidden border-slate-100">
            <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShoppingCart className="w-24 h-24" />
              </div>
              <p className="text-blue-400 font-bold uppercase tracking-tight text-[10px] mb-1">Total Pembayaran</p>
              <div className="text-4xl font-black">Rp {total.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Item</span>
                <span className="font-black text-slate-800 text-xl">{items.length}</span>
              </div>
              <Button 
                className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-2xl font-black rounded-2xl shadow-2xl shadow-blue-100 transition-transform active:scale-95 disabled:opacity-30 disabled:grayscale"
                disabled={items.length === 0}
                onClick={() => setShowCheckout(true)}
              >
                BAYAR SEKARANG
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
      
      {showCheckout && (
        <CheckoutModal 
          items={items} 
          total={total} 
          toko={tokoSettings || { nama: 'Apotek Ulebi', alamat: '-', no_hp: '-' }}
          onConfirm={handleCheckout} 
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  )
}
