'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  nama_toko: z.string().min(2, 'Nama toko minimal 2 karakter'),
  jenis_usaha: z.enum(['apotek', 'toko_obat', 'kios_obat']),
  no_izin: z.string().min(1, 'Nomor izin wajib diisi'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  no_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
  nama_apoteker: z.string().optional(),
})

export function SettingsForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama_toko: '', jenis_usaha: 'apotek', no_izin: '', alamat: '', no_hp: '', nama_apoteker: '' },
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data) form.reset(data)
        }
      } catch (error) { console.error(error) } finally { setLoading(false) }
    }
    fetchSettings()
  }, [form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (response.ok) {
        toast.success('Pengaturan disimpan')
        router.refresh()
      } else {
        toast.error('Gagal menyimpan')
      }
    } catch (error) { toast.error('Error jaringan') }
  }

  if (loading) return <div className="p-8 text-center">Memuat...</div>

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle>Profil Toko</CardTitle>
        <CardDescription>Beri identitas pada struk belanja Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField control={form.control} name="nama_toko" render={({ field }) => (
                <FormItem><FormLabel>Nama Toko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="jenis_usaha" render={({ field }) => (
                <FormItem><FormLabel>Jenis</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="apotek">Apotek</SelectItem><SelectItem value="toko_obat">Toko Obat</SelectItem><SelectItem value="kios_obat">Kios Obat</SelectItem></SelectContent></Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="no_izin" render={({ field }) => (
              <FormItem><FormLabel>No. Izin</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="alamat" render={({ field }) => (
              <FormItem><FormLabel>Alamat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="no_hp" render={({ field }) => (
              <FormItem><FormLabel>No. HP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="nama_apoteker" render={({ field }) => (
              <FormItem><FormLabel>Apoteker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full">Simpan</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
