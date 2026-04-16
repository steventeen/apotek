'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Inisialisasi scanner
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778, // 16:9
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      },
      /* verbose= */ false
    )

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText)
        // Multi-scan mode: kita tidak menghentikan scanner
        // Tapi kita berikan feedback visual (misal: bunyi atau getar jika didukung)
        if (navigator.vibrate) navigator.vibrate(100)
      },
      (errorMessage) => {
        // Abaikan error "no code found" agar log tidak penuh
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Scan Barcode / PLU</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="p-4">
          <div id="reader" className="overflow-hidden rounded-lg"></div>
          {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
          <p className="mt-4 text-gray-500 text-sm text-center">
            Arahkan kamera ke barcode obat. <br />
            Mode multi-scan aktif.
          </p>
        </div>
      </div>
    </div>
  )
}
