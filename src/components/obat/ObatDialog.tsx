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
  harga_beli: z.coerce.number().min(0),
  harga_jual: z.coerce.number().min(0),
  stok: z.coerce.number().min(0),
  min_stok: z.coerce.number().min(0),
  satuan: z.string().min(1, 'Satuan wajib diisi'),
  lokasi_rak: z.string().optional(),
})

type ObatFormValues = z.infer<typeof obatSchema>

interface ObatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  categories: { id: string; nama: string }[]
}

export function ObatDialog({ open, onOpenChange, initialData, onSubmit, categories }: ObatDialogProps) {
  const [isSearchingKFA, setIsSearchingKFA] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ObatFormValues>({
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
    if (initialData) {
      form.reset({
        ...initialData,
        kategori_id: initialData.kategori_id?.toString() || ''
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
  }, [initialData, form, open])

  // Mock KFA Search
  const handleKFALookup = async () => {
    const plu = form.getValues('kode_plu')
    if (!plu) {
      toast.error('Masukkan kode PLU/Barcode terlebih dahulu')
      return
    }

    setIsSearchingKFA(true)
    // Simulasi API call SATUSEHAT KFA
    await new Promise(r => setTimeout(r, 1500))
    
    // Logic dummy: jika barcode tertentu, isi data otomatis
    if (plu === '899' || plu === '123') {
      form.setValue('nama', 'Paracetamol 500mg (Auto-filled)')
      form.setValue('satuan', 'Tablet')
      toast.success('Data ditemukan di database KFA!')
    } else {
      toast.info('Data tidak ditemukan di KFA, silakan isi manual')
    }
    setIsSearchingKFA(false)
  }

  const handleFormSubmit = async (values: ObatFormValues) => {
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
              {/* Scan / PLU */}
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
                          onClick={handleKFALookup}
                          disabled={isSearchingKFA}
                        >
                          {isSearchingKFA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          <span className="ml-2 hidden sm:inline">Cari KFA</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nama Obat */}
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

              {/* Kategori */}
              <FormField
                control={form.control}
                name="kategori_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

              {/* Satuan */}
              <FormField
                control={form.control}
                name="satuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan (Eceran)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tablet / Botol / Pcs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Harga Beli */}
              <FormField
                control={form.control}
                name="harga_beli"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Beli (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Harga Jual */}
              <FormField
                control={form.control}
                name="harga_jual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stok & Stok Minimal */}
              <FormField
                control={form.control}
                name="stok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok Saat Ini</FormLabel>
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
                    <FormLabel>Stok Minimal (Alert)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rak */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="lokasi_rak"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi Rak (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Rak Depan A-1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {initialData ? 'Update Obat' : 'Simpan Obat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
