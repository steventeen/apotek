import Dexie, { type Table } from 'dexie';

export interface LocalObat {
  id: string;
  kode_plu: string;
  nama: string;
  harga_jual: number;
  stok: number;
  min_stok: number;
  satuan: string;
  kategori_id: number;
  last_synced_at: number;
}

export interface OfflineTransaksi {
  id?: number; // Primary key for Dexie (Auto-increment)
  temp_id: string; // Temporary ID for client-side tracking
  no_invoice: string;
  data: any; // Full transaction payload
  created_at: number;
  status: 'pending' | 'synced' | 'failed';
}

export interface OfflineOpname {
  id?: number;
  obat_id: string;
  fisik: number;
  created_at: number;
}

export class ApotekDexie extends Dexie {
  obat!: Table<LocalObat>;
  transactions!: Table<OfflineTransaksi>;
  opname!: Table<OfflineOpname>;

  constructor() {
    super('ApotekUlebiDB');
    this.version(1).stores({
      obat: 'id, kode_plu, nama',
      transactions: '++id, temp_id, status',
      opname: '++id, obat_id'
    });
  }
}

export const db = new ApotekDexie();
