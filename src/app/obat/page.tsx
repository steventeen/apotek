'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, RefreshCcw, Loader2, Filter, Search, Plus, Package } from 'lucide-react'
import { SyncManager } from '@/lib/sync-manager'
import { ConnectivityIndicator } from '@/components/shared/ConnectivityIndicator'
import { AppHeader } from '@/components/shared/AppHeader'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { ObatTable } from '@/components/obat/ObatTable'
import { ObatDialog } from '@/components/obat/ObatDialog'
import { LabelCetak } from '@/components/obat/LabelCetak'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ObatPage() {
  const supabase = createClient()
  const isOnline = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string>('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Modals
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingObat, setEditingObat] = useState<any>(null)
  const [printingObat, setPrintingObat] = useState<any>(null)
  const [isLabelOpen, setIsLabelOpen] = useState(false)

  const canCRUD = ['pemilik', 'apoteker'].includes(userRole)

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch User Role
      const { data: { user } } = await supabase.auth.getUser()
      setUserRole(user?.app_metadata?.role || '')

      // 2. Fetch Categories
      const { data: cats } = await supabase.from('kategori_obat').select('*').order('nama')
      setCategories(cats || [])

      // 3. Fetch Obat with Categories
      const { data: obats } = await supabase
        .from('obat')
        .select('*, kategori:kategori_obat(nama, warna)')
        .order('created_at', { ascending: false })
      
      setData(obats || [])
    } catch (error) {
      toast.error('Gagal mengambil data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.kode_plu.includes(searchTerm)
      const matchCategory = selectedCategory === 'all' || item.kategori_id.toString() === selectedCategory
      return matchSearch && matchCategory
    })
  }, [data, searchTerm, selectedCategory])

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (editingObat) {
        const { error } = await supabase
          .from('obat')
          .update(formData)
          .eq('id', editingObat.id)
        if (error) throw error
        toast.success('Obat berhasil diperbarui')
        if (isOnline) SyncManager.syncMasterData()
      } else {
        const { error } = await supabase
          .from('obat')
          .insert([formData])
        if (error) throw error
        toast.success('Obat berhasil ditambahkan')
        if (isOnline) SyncManager.syncMasterData()
      }
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus obat ini?')) return
    
    try {
      const { error } = await supabase.from('obat').delete().eq('id', id)
      if (error) throw error
      toast.success('Obat berhasil diperbarui')
      if (isOnline) SyncManager.syncMasterData()
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader title="Manajemen Obat" />
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border shadow-sm">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Cari nama obat atau kode PLU..." 
              className="pl-10 h-11 bg-slate-50 border-none focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || 'all')}>
              <SelectTrigger className="h-11 bg-slate-50 border-none">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canCRUD && (
          <Button 
            onClick={() => {
              setEditingObat(null)
              setIsDialogOpen(true)
            }}
            className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 flex gap-2 w-full md:w-auto mt-4 md:mt-0"
          >
            <Plus className="w-6 h-6" />
            Tambah Obat
          </Button>
        )}
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="font-medium animate-pulse">Memuat data obat...</p>
        </div>
      ) : (
        <ObatTable 
          data={filteredData}
          onEdit={(obat) => {
            setEditingObat(obat)
            setIsDialogOpen(true)
          }}
          onDelete={handleDelete}
          onPrintLabel={(obat) => {
            setPrintingObat(obat)
            setIsLabelOpen(true)
          }}
          canCRUD={canCRUD}
        />
      )}

      {/* Modals */}
      <ObatDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingObat}
        onSubmit={handleCreateOrUpdate}
        categories={categories}
      />

      <LabelCetak 
        open={isLabelOpen}
        onOpenChange={setIsLabelOpen}
        obat={printingObat}
      />
      </main>
    </div>
  )
}
