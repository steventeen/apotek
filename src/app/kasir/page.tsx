'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Camera, ShoppingCart, Wifi, WifiOff, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/hooks/useCart'
import { db, LocalProduct } from '@/lib/db'
import { BarcodeScanner } from '@/components/kasir/BarcodeScanner'
import { CartItem } from '@/components/kasir/CartItem'
import { CheckoutModal } from '@/components/kasir/CheckoutModal'
import { toast } from 'sonner'

export default function KasirClient() {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<LocalProduct[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCart()

  // 1. Monitor Online Status & Auto Sync
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingTransactions()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 2. Fetch & Cache Products
  useEffect(() => {
    async function initProducts() {
      try {
        const { data, error } = await supabase.from('obat').select('id, kode_plu, nama, harga_jual, stok, satuan').eq('is_active', true)
        if (data) {
          await db.products.clear()
          await db.products.bulkAdd(data)
        }
      } catch (e) {
        console.log('Using local product cache')
      }
    }
    initProducts()
  }, [supabase])

  // 3. Search Logic (Local First)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const performSearch = async () => {
      const results = await db.products
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

  // 4. Handle Scanner Result
  const handleScan = async (code: string) => {
    const product = await db.products.where('kode_plu').equals(code).first()
    if (product) {
      addToCart(product)
      toast.success(`Ditambahkan: ${product.nama}`)
      setShowScanner(false)
    } else {
      toast.error('Obat tidak ditemukan')
    }
  }

  // 5. Sync Logic
  const syncPendingTransactions = async () => {
    const pending = await db.transactions.where('synced').equals(0).toArray()
    if (pending.length === 0) return

    setIsSyncing(true)
    let successCount = 0

    for (const tx of pending) {
      try {
        // Simpan ke Supabase
        const { data, error: txError } = await supabase.from('transaksi').insert({
          no_invoice: tx.no_invoice,
          total: tx.total,
          bayar: tx.bayar,
          kembali: tx.kembali,
          metode: tx.metode,
          created_at: tx.created_at
        }).select('id').single()

        if (data) {
          // Simpan detailnya
          const details = tx.items.map(item => ({
            transaksi_id: data.id,
            obat_id: item.id,
            qty: item.quantity,
            harga_satuan: item.harga_jual,
            subtotal: item.harga_jual * item.quantity
          }))
          
          const { error: dtError } = await supabase.from('detail_transaksi').insert(details)
          if (!dtError) {
            await db.transactions.update(tx.id!, { synced: 1 })
            successCount++
          }
        }
      } catch (e) {
        console.error('Failed to sync transaction', tx.id, e)
      }
    }

    if (successCount > 0) toast.success(`${successCount} transaksi disinkronkan ke cloud`)
    setIsSyncing(false)
  }

  // 6. Handle Checkout
  const handleCheckout = async (bayar: number, kembali: number) => {
    const noInvoice = `INV-${new Date().getTime()}`
    const transactionData = {
      no_invoice: noInvoice,
      items: items,
      total: total,
      bayar: bayar,
      kembali: kembali,
      metode: 'tunai',
      created_at: new Date().toISOString(),
      synced: 0
    }

    // Selalu simpan ke Dexie dulu (Safety)
    await db.transactions.add(transactionData)
    
    // Jika online, langsung coba sync
    if (isOnline) {
      syncPendingTransactions()
    }

    clearCart()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShoppingCart className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Kasir Ulebi</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </div>
          {isSyncing && <RefreshCcw className="w-4 h-4 animate-spin text-blue-600" />}
        </div>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
              onClick={() => setShowScanner(true)}
            >
              <Camera className="w-6 h-6" />
            </Button>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border overflow-hidden z-20">
                {searchResults.map(p => (
                  <button 
                    key={p.id}
                    className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition border-b last:border-none"
                    onClick={() => {
                      addToCart(p)
                      setSearchTerm('')
                      setSearchResults([])
                    }}
                  >
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{p.nama}</p>
                      <p className="text-xs text-gray-500">{p.kode_plu} • Stok: {p.stok} {p.satuan}</p>
                    </div>
                    <p className="font-bold text-blue-600">Rp {Number(p.harga_jual).toLocaleString('id-ID')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart List */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs">Keranjang Belanja ({items.length})</h3>
            {items.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p>Keranjang masih kosong</p>
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
          <div className="bg-white rounded-3xl border shadow-lg sticky top-24 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white">
              <p className="text-blue-400 font-bold uppercase tracking-tight text-xs mb-1">Total Bayar</p>
              <div className="text-4xl font-black">Rp {total.toLocaleString('id-ID')}</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 italic">Pesanan #{new Date().getTime().toString().slice(-6)}</span>
                <span className="font-bold text-gray-800">{items.length} Item</span>
              </div>
              <Button 
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-xl font-black rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50"
                disabled={items.length === 0}
                onClick={() => setShowCheckout(true)}
              >
                CHECKOUT
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
          onConfirm={handleCheckout} 
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  )
}
