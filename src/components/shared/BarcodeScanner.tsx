'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, X, RefreshCcw } from 'lucide-react'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResult: (result: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onResult }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'qr-reader'

  useEffect(() => {
    if (open) {
      // Tunggu DOM elemen tersedia
      const timer = setTimeout(() => {
        startScanner()
      }, 300)
      return () => {
        clearTimeout(timer)
        stopScanner()
      }
    } else {
      stopScanner()
    }
  }, [open])

  const startScanner = async () => {
    try {
      if (scannerRef.current) await stopScanner()
      
      const html5QrCode = new Html5Qrcode(elementId)
      scannerRef.current = html5QrCode
      setIsScanning(true)
      setError(null)

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      }

      await html5QrCode.start(
        { facingMode: 'environment' }, // Gunakan kamera belakang
        config,
        (decodedText) => {
          onResult(decodedText)
          onOpenChange(false)
        },
        (errorMessage) => {
          // Abaikan error "QR code not found" yang berisik di log
        }
      )
    } catch (err: any) {
      console.error(err)
      setError('Gagal mengakses kamera. Pastikan izin kamera diizinkan.')
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop()
        scannerRef.current = null
      }
      setIsScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none">
        <DialogHeader className="p-4 bg-white border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Pindai Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square flex items-center justify-center bg-black">
          <div id={elementId} className="w-full h-full" />
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
              <X className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-800 font-medium">{error}</p>
              <Button variant="outline" className="mt-4" onClick={startScanner}>
                Coba Lagi
              </Button>
            </div>
          )}

          {!isScanning && !error && (
            <div className="flex flex-col items-center gap-2">
              <RefreshCcw className="w-8 h-8 animate-spin text-white" />
              <p className="text-white text-sm">Menyiapkan Kamera...</p>
            </div>
          )}

          {/* Overlay Bingkai Scan */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
              <div className="w-full h-full border-2 border-blue-400 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400/50 animate-scan shadow-[0_0_15px_blue]" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-white border-t">
          <p className="text-xs text-center text-gray-500 w-full">
            Arahkan kamera ke barcode obat agar terdeteksi otomatis
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
