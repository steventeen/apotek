import { createClient } from './supabase/client';
import { db } from './offline-db';
import { toast } from 'sonner';

export const SyncManager = {
  // 1. Full Cache Sync (Fetch everyone from server to local)
  async syncMasterData() {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('obat')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        await db.obat.clear();
        await db.obat.bulkAdd(data.map(item => ({
          ...item,
          last_synced_at: Date.now()
        })));
        console.log('Master data synced to local DB');
      }
    } catch (err) {
      console.error('Failed to sync master data:', err);
    }
  },

  // 2. Upload Pending Transactions
  async uploadPendingTransactions() {
    const supabase = createClient();
    const pending = await db.transactions
      .where('status')
      .equals('pending')
      .toArray();

    if (pending.length === 0) return;

    toast.info(`Menyinkronkan ${pending.length} transaksi offline...`);

    for (const tx of pending) {
      try {
        const { data: mainTx, error: txError } = await supabase
          .from('transaksi')
          .insert([tx.data.main])
          .select()
          .single();

        if (txError) throw txError;

        const details = tx.data.details.map((d: any) => ({
          ...d,
          transaksi_id: mainTx.id
        }));

        const { error: dtError } = await supabase
          .from('detail_transaksi')
          .insert(details);

        if (dtError) throw dtError;

        // Mark as synced
        await db.transactions.update(tx.id!, { status: 'synced' });
        
        // Clean up: delete synced older than 7 days if you want
        // await db.transactions.delete(tx.id!); 
      } catch (err) {
        console.error(`Failed to sync transaction ${tx.no_invoice}:`, err);
        await db.transactions.update(tx.id!, { status: 'failed' });
      }
    }

    toast.success('Sinkronisasi transaksi offline selesai');
  },

  // 3. Resolve Stock Conflicts (Server Stock + Offline Delta)
  // This is handled by Supabase triggers on the server side (handle_deduct_stock)
  // When we push an offline transaction, the trigger deducts from the server's current stock.
  // So the "Server Data + Offline Delta" requirement is naturally handled by the DB design.
  
  // 4. Sync Background Process
  async startSync() {
    if (navigator.onLine) {
      await this.uploadPendingTransactions();
      await this.syncMasterData();
    }
  }
};
