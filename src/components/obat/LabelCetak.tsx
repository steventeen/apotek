'use client'

import { useEffect, useRef, useState } from 'react'
import bwipjs from 'bwip-js'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, X } from 'lucide-react'
import { toast } from 'sonner'

interface LabelCetakProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  obat: {
    nama: string
    kode_plu: string
    harga_jual: number
  } | null
}

export function LabelCetak({ open, onOpenChange, obat }: LabelCetakProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerated, setIsGenerated] = useState(false)

  useEffect(() => {
    if (open && obat && canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',       // Barcode type
          text: obat.kode_plu,   // Text to encode
          scale: 3,              // 3x scaling factor
          height: 10,            // Bar height, in millimeters
          includetext: true,     // Show human-readable text
          textxalign: 'center',  // Always good to set this
        })
        setIsGenerated(true)
      } catch (e) {
        console.error(e)
        toast.error('Gagal menghasilkan barcode')
      }
    }
  }, [open, obat])

  const handlePrint = () => {
    const content = canvasRef.current?.toDataURL()
    if (!content) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Label - ${obat?.nama}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
              .label { border: 1px solid #eee; padding: 10px; text-align: center; width: 40mm; height: 30mm; display: flex; flex-direction: column; justify-content: center; }
              .nama { font-weight: bold; font-size: 10px; margin-bottom: 5px; text-transform: uppercase; }
              .harga { font-weight: bold; font-size: 12px; margin-top: 5px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="nama">${obat?.nama}</div>
              <img src="${content}" />
              <div class="harga">Rp ${Number(obat?.harga_jual).toLocaleString('id-ID')}</div>
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Label Barcode</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <div className="bg-white p-4 shadow-sm border rounded-sm flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-center uppercase truncate w-full">{obat?.nama}</span>
            <canvas ref={canvasRef} />
            <span className="font-bold text-sm">Rp {Number(obat?.harga_jual).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button className="w-full bg-slate-900" onClick={handlePrint} disabled={!isGenerated}>
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
