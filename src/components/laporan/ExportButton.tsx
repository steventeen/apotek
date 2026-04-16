'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Papa from 'papaparse'
import { toast } from 'sonner'

interface ExportButtonProps {
  data: any[]
  filename: string
  label?: string
}

export function ExportButton({ data, filename, label = 'Export CSV' }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    try {
      const csv = Papa.unparse(data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Berhasil mengekspor ${filename}.csv`)
    } catch (error) {
      console.error(error)
      toast.error('Gagal mengekspor data')
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      className="gap-2 h-9 border-green-200 text-green-700 hover:bg-green-50"
    >
      <Download className="w-4 h-4" />
      {label}
    </Button>
  )
}
