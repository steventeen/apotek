'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const obatSchema = z.object({
  kode_plu: z.string().min(1, 'Kode PLU wajib diisi'),
  nama: z.string().min(3, 'Nama obat minimal 3 karakter'),
  kategori_id: z.string().min(1, 'Pilih kategori'),
  harga_beli: z.coerce.number().min(0).default(0),
  harga_jual: z.coerce.number().min(0).default(0),
  stok: z.coerce.number().min(0).default(0),
  min_stok: z.coerce.number().min(0).default(5),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  lokasi_rak: z.string().optional().nullable().default(''),
})

type ObatFormValues = z.infer<typeof obatSchema>

interface ObatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  onSubmit: (data: ObatFormValues) => Promise<void>
  categories: { id: string; nama: string }[]
}

export function ObatDialog({ open, onOpenChange, initialData, onSubmit, categories }: ObatDialogProps) {
  const [isSearchingKFA, setIsSearchingKFA] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(obatSchema),
    defaultValues: {
      kode_plu: '',
      nama: '',
      kategori_id: '',
      harga_beli: 0,
      harga_jual: 0,
      stok: 0,
      min_stok: 5,
      satuan: 'Tablet',
      lokasi_rak: '',
    }
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          kode_plu: initialData.kode_plu || '',
          nama: initialData.nama || '',
          kategori_id: initialData.kategori_id?.toString() || '',
          harga_beli: initialData.harga_beli || 0,
          harga_jual: initialData.harga_jual || 0,
          stok: initialData.stok || 0,
          min_stok: initialData.min_stok || 5,
          satuan: initialData.satuan || 'Tablet',
          lokasi_rak: initialData.lokasi_rak || '',
        })
      } else {
        form.reset({
          kode_plu: '',
          nama: '',
          kategori_id: '',
          harga_beli: 0,
          harga_jual: 0,
          stok: 0,
          min_stok: 5,
          satuan: 'Tablet',
          lokasi_rak: '',
        })
      }
    }
  }, [initialData, form, open])

  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Obat' : 'Tambah Obat Baru'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="kode_plu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode PLU / Barcode</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Scan barcode..." {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={async () => {
                            const plu = form.getValues('kode_plu')
                            if (!plu) return
                            setIsSearchingKFA(true)
                            await new Promise(r => setTimeout(r, 1000))
                            if (plu === '899') {
                              form.setValue('nama', 'Paracetamol 500mg')
                              form.setValue('satuan', 'Tablet')
                            }
                            setIsSearchingKFA(false)
                          }}
                          disabled={isSearchingKFA}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Obat</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Amoxicillin 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="kategori_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val)} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="satuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <FormControl>
                      <Input placeholder="Tablet / Botol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="harga_beli"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Beli</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="harga_jual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stok</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Obat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
