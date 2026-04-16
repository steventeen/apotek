'use client'

import { useState } from 'react'
import { Plus, Key, Trash2, UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { addUser, updateUserPin, deleteUser } from './user-actions'

export function UserTable({ users }: { users: any[] }) {
  const [loading, setLoading] = useState(false)
  
  // Add User State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('kasir_magang')
  const [newPin, setNewPin] = useState('')

  // Edit PIN State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editPin, setEditPin] = useState('')

  const handleAdd = async () => {
    if (!newName || !newPin || newPin.length !== 4) {
      toast.error('Data tidak lengkap (PIN harus 4 digit)')
      return
    }
    setLoading(true)
    try {
      await addUser({ nama_lengkap: newName, role: newRole, pin: newPin })
      toast.success('User berhasil ditambahkan')
      setIsAddOpen(false)
      setNewName('')
      setNewPin('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePin = async () => {
    if (!editPin || editPin.length !== 4) {
      toast.error('PIN harus 4 digit')
      return
    }
    setLoading(true)
    try {
      await updateUserPin(selectedUser.id, editPin)
      toast.success('PIN berhasil diperbarui')
      setIsEditOpen(false)
      setEditPin('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus user ${name}?`)) return
    setLoading(true)
    try {
      await deleteUser(id)
      toast.success('User dihapus')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl flex gap-2">
              <UserPlus className="w-4 h-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jabatan / Role</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="pemilik">Pemilik</option>
                  <option value="apoteker">Apoteker</option>
                  <option value="kasir_senior">Kasir Senior</option>
                  <option value="kasir_magang">Kasir Magang</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PIN Baru (4 Digit)</label>
                <Input 
                  type="password" 
                  maxLength={4} 
                  value={newPin} 
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                  placeholder="1234"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button onClick={handleAdd} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">PIN</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 group">
                <td className="px-6 py-4 font-medium text-slate-900">{u.nama_lengkap}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    u.role === 'pemilik' ? 'bg-red-100 text-red-700' :
                    u.role === 'apoteker' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {u.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 font-mono">****</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Dialog open={isEditOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                    setIsEditOpen(open)
                    if (open) setSelectedUser(u)
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-amber-50 hover:text-amber-600">
                        <Key className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ganti PIN untuk {u.nama_lengkap}</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-2">
                        <label className="text-sm font-medium">PIN Baru (4 Digit)</label>
                        <Input 
                          type="password" 
                          maxLength={4} 
                          value={editPin} 
                          onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))} 
                          placeholder="Masukkan 4 digit PIN baru"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
                        <Button onClick={handleUpdatePin} disabled={loading}>
                          Update PIN
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {u.role !== 'pemilik' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(u.id, u.nama_lengkap)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
