'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Tag, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface KategoriDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function KategoriDialog({ open, onOpenChange, onRefresh }: KategoriDialogProps) {
  const supabase = createClient()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [isSeeding, setIsSeeding] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('kategori_obat').select('*').order('nama')
      setCategories(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchCategories()
  }, [open])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.from('kategori_obat').insert({
        nama: newName,
        warna: newColor
      })
      if (error) throw error
      setNewName('')
      fetchCategories()
      onRefresh()
      toast.success('Kategori berhasil ditambahkan')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini? Obat dengan kategori ini akan menjadi "Tanpa Kategori".')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('kategori_obat').delete().eq('id', id)
      if (error) throw error
      fetchCategories()
      onRefresh()
      toast.success('Kategori dihapus')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const defaultCats = [
        { nama: 'Obat Bebas', warna: '#22c55e' },
        { nama: 'Obat Bebas Terbatas', warna: '#3b82f6' },
        { nama: 'Obat Keras', warna: '#ef4444' },
        { nama: 'Psikotropika', warna: '#a855f7' },
        { nama: 'Narkotika', warna: '#1e293b' },
        { nama: 'Alat Kesehatan', warna: '#eab308' },
        { nama: 'Suplemen', warna: '#f97316' }
      ]

      const { error } = await supabase.from('kategori_obat').upsert(defaultCats, { onConflict: 'nama' })
      if (error) throw error
      
      fetchCategories()
      onRefresh()
      toast.success('Kategori default berhasil dimuat!')
    } catch (error: any) {
      toast.error('Gagal memuat kategori: ' + error.message)
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Kelola Kategori Obat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Form Tambah */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3 space-y-1">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Nama Kategori</Label>
                <Input 
                  placeholder="Contoh: Obat Batuk" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-white border-none h-11"
                />
              </div>
              <div className="col-span-1 space-y-1">
                <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Warna</Label>
                <Input 
                  type="color" 
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="p-1 h-11 w-full bg-white border-none cursor-pointer"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={loading || !newName} className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
            </Button>
          </div>

          {/* List Kategori */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Daftar Kategori</Label>
            {loading && categories.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-4">Belum ada kategori</p>
                <Button variant="outline" onClick={handleSeed} disabled={isSeeding} className="border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 bg-blue-50/50">
                  {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Muat Kategori Umum
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-white border rounded-xl group">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.warna }} />
                      <span className="font-medium text-gray-700">{cat.nama}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <DialogFooter className="border-t pt-4">
             <Button variant="ghost" className="text-xs text-blue-500 hover:text-blue-700" onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? 'Memproses...' : 'Muat Ulang Kategori Umum'}
             </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
