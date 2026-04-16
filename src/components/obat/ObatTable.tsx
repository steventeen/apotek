'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Printer, AlertTriangle } from 'lucide-react'

interface Obat {
  id: string
  kode_plu: string
  nama: string
  harga_jual: number
  stok: number
  min_stok: number
  satuan: string
  kategori: {
    nama: string
    warna: string
  }
}

interface ObatTableProps {
  data: Obat[]
  onEdit: (obat: Obat) => void
  onDelete: (id: string) => void
  onPrintLabel: (obat: Obat) => void
  canCRUD: boolean
}

export function ObatTable({ data, onEdit, onDelete, onPrintLabel, canCRUD }: ObatTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[120px]">Kode PLU</TableHead>
            <TableHead>Nama Obat</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead className="text-center">Stok</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-gray-400 italic">
                Tidak ada data obat ditemukan.
              </TableCell>
            </TableRow>
          ) : (
            data.map((obat) => {
              const isLowStock = obat.stok <= obat.min_stok
              
              return (
                <TableRow key={obat.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs">{obat.kode_plu}</TableCell>
                  <TableCell>
                    <div className="font-bold text-gray-800">{obat.nama}</div>
                    <div className="text-[10px] text-gray-400">Eceran: {obat.satuan}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className="capitalize"
                      style={{ 
                        backgroundColor: `${obat.kategori?.warna}20`,
                        color: obat.kategori?.warna,
                        borderColor: `${obat.kategori?.warna}40`
                      }}
                    >
                      {obat.kategori?.nama || 'Umum'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    Rp {Number(obat.harga_jual).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                      {obat.stok}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isLowStock ? (
                      <div className="flex items-center justify-center gap-1 text-red-600 text-[10px] font-bold uppercase animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        Stok Rendah
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Tersedia</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-gray-400 h-14">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onPrintLabel(obat)}
                        title="Print Label Barcode"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      {canCRUD && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit(obat)}
                            className="text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete(obat.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
