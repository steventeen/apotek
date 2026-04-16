import Dexie, { Table } from 'dexie'

export interface LocalProduct {
  id: string
  kode_plu: string
  nama: string
  harga_jual: number
  stok: number
  satuan: string
}

export interface PendingTransaction {
  id?: number
  no_invoice: string
  items: any[]
  total: number
  bayar: number
  kembali: number
  metode: string
  created_at: string
  synced: number // 0: no, 1: yes
}

export class ApotekDatabase extends Dexie {
  products!: Table<LocalProduct>
  transactions!: Table<PendingTransaction>

  constructor() {
    super('ApotekUlebiDB')
    this.version(1).stores({
      products: 'id, kode_plu, nama',
      transactions: '++id, no_invoice, synced'
    })
  }
}

export const db = new ApotekDatabase()
