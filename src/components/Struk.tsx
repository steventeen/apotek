'use client'

import React, { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { Download, Printer, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printerService } from '@/lib/thermal-printer'
import { toast } from 'sonner'

interface StrukItem {
  nama: string
  qty: number
  harga: number
  subtotal: number
}

interface StrukProps {
  toko: {
    nama: string
    alamat: string
    no_hp: string
  }
  transaksi: {
    no_invoice: string
    kasir: string
    tanggal: string
  }
  items: StrukItem[]
  total: number
  bayar: number
  kembali: number
  autoPrint?: boolean
}

export function StrukRenderer({
  toko,
  transaksi,
  items,
  total,
  bayar,
  kembali,
  autoPrint = false
}: StrukProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)

  const downloadImage = async () => {
    if (!receiptRef.current) return
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      const link = document.createElement('a')
      link.download = `Struk-${transaksi.no_invoice}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Struk berhasil disimpan sebagai gambar')
    } catch (error) {
      toast.error('Gagal menyimpan gambar')
    }
  }

  const handlePrintBluetooth = async () => {
    setIsPrinting(true)
    try {
      const success = await printerService.connect()
      if (success) {
        await printerService.printReceipt({
          toko,
          transaksi: { id: transaksi.no_invoice, kasir: transaksi.kasir, tanggal: transaksi.tanggal },
          items,
          total,
          bayar,
          kembali
        })
        toast.success('Struk sedang dicetak')
      } else {
        // Jika printer tidak terhubung, otomatis simpan ke galeri (download image)
        toast.warning('Printer tidak terhubung, mengunduh gambar...')
        await downloadImage()
      }
    } catch (error) {
      console.error(error)
      await downloadImage()
    } finally {
      setIsPrinting(false)
    }
  }

  // Auto print/save effect
  useEffect(() => {
    if (autoPrint) {
      handlePrintBluetooth()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Visual Struk (untuk tampilan dan capture gambar) */}
      <div 
        ref={receiptRef}
        className="bg-white text-black p-6 w-[300px] shadow-sm border font-mono text-sm leading-tight"
      >
        <div className="text-center mb-4 space-y-1">
          <h2 className="font-bold text-lg uppercase">{toko.nama}</h2>
          <p className="text-[10px] break-words">{toko.alamat}</p>
          <p className="text-[10px]">Telp: {toko.no_hp}</p>
          <div className="border-b border-dashed my-2"></div>
        </div>

        <div className="text-[10px] space-y-0.5 mb-2">
          <div className="flex justify-between">
            <span>Invoice:</span>
            <span>{transaksi.no_invoice}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{transaksi.kasir}</span>
          </div>
          <div className="flex justify-between">
            <span>Waktu:</span>
            <span>{transaksi.tanggal}</span>
          </div>
        </div>

        <div className="border-b border-dashed my-2"></div>

        <div className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="uppercase">{item.nama}</p>
              <div className="flex justify-between text-[11px]">
                <span>{item.qty} x {item.harga.toLocaleString('id-ID')}</span>
                <span>{item.subtotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed my-2"></div>

        <div className="space-y-1">
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>BAYAR</span>
            <span>Rp {bayar.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between underline italic font-bold">
            <span>KEMBALI</span>
            <span>Rp {kembali.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="text-center mt-8 space-y-1">
          <p className="text-[10px]">Terima Kasih Atas Kunjungan Anda</p>
          <p className="text-[10px]">Semoga Lekas Sembuh</p>
          <div className="h-4"></div>
        </div>
      </div>

      {/* Kontrol */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
        <Button 
          variant="outline" 
          onClick={handlePrintBluetooth}
          disabled={isPrinting}
          className="flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button 
          variant="outline" 
          onClick={downloadImage}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Gambar
        </Button>
      </div>
    </div>
  )
}
