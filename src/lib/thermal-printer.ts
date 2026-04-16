/**
 * Utilitas Printer Thermal Bluetooth (Web Bluetooth API)
 * Mendukung perintah ESC/POS standar.
 */

export class ThermalPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // UUID standar untuk printer thermal Bluetooth
  private static SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
  private static CHARACTERISTIC_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

  // Perintah ESC/POS
  private static ESC_POS = {
    INIT: new Uint8Array([0x1b, 0x40]),
    ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
    ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),
    BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
    DOUBLE_HEIGHT_ON: new Uint8Array([0x1b, 0x21, 0x10]),
    DOUBLE_HEIGHT_OFF: new Uint8Array([0x1b, 0x21, 0x00]),
    FEED_AND_CUT: new Uint8Array([0x1d, 0x56, 0x41, 0x03]),
    NEW_LINE: new Uint8Array([0x0a]),
  };

  /**
   * Meminta akses dan menghubungkan ke printer Bluetooth
   */
  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Browser tidak mendukung Web Bluetooth API');
      }

      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [ThermalPrinterService.SERVICE_UUID] }],
        optionalServices: [ThermalPrinterService.SERVICE_UUID],
      });

      const server = await this.device.gatt?.connect();
      const service = await server?.getPrimaryService(ThermalPrinterService.SERVICE_UUID);
      this.characteristic = (await service?.getCharacteristic(ThermalPrinterService.CHARACTERISTIC_UUID)) || null;

      console.log('Terhubung ke printer:', this.device.name);
      return true;
    } catch (error) {
      console.error('Koneksi printer gagal:', error);
      return false;
    }
  }

  /**
   * Mengirim data ke printer
   */
  private async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) throw new Error('Printer tidak terhubung');
    
    // Chunking data (biasanya MTU Bluetooth sekitar 20-50 byte)
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
    }
  }

  /**
   * Mencetak data pesanan
   */
  async printReceipt(config: {
    toko: { nama: string; alamat: string; no_hp: string };
    transaksi: { id: string; kasir: string; tanggal: string };
    items: { nama: string; qty: number; harga: number; subtotal: number }[];
    total: number;
    bayar: number;
    kembali: number;
  }) {
    if (!this.characteristic) await this.connect();

    const encoder = new TextEncoder();
    const sendText = (text: string) => this.write(encoder.encode(text));

    // Reset Printer
    await this.write(ThermalPrinterService.ESC_POS.INIT);

    // Header Toko (Center & Bold)
    await this.write(ThermalPrinterService.ESC_POS.ALIGN_CENTER);
    await this.write(ThermalPrinterService.ESC_POS.BOLD_ON);
    await sendText(`${config.toko.nama.toUpperCase()}\n`);
    await this.write(ThermalPrinterService.ESC_POS.BOLD_OFF);
    await sendText(`${config.toko.alamat}\n`);
    await sendText(`HP: ${config.toko.no_hp}\n`);
    await sendText('--------------------------------\n');

    // Info Transaksi (Left)
    await this.write(ThermalPrinterService.ESC_POS.ALIGN_LEFT);
    await sendText(`Inv  : ${config.transaksi.id}\n`);
    await sendText(`Tgl  : ${config.transaksi.tanggal}\n`);
    await sendText(`Ksr  : ${config.transaksi.kasir}\n`);
    await sendText('--------------------------------\n');

    // Daftar Item
    for (const item of config.items) {
      await sendText(`${item.nama.substring(0, 32)}\n`);
      const details = `${item.qty} x ${item.harga.toLocaleString('id-ID')}`.padEnd(20);
      const subtotal = item.subtotal.toLocaleString('id-ID').padStart(12);
      await sendText(details + subtotal + '\n');
    }
    await sendText('--------------------------------\n');

    // Total & Pembayaran
    const labelTotal = 'TOTAL:'.padEnd(15);
    const valTotal = config.total.toLocaleString('id-ID').padStart(17);
    await this.write(ThermalPrinterService.ESC_POS.BOLD_ON);
    await sendText(labelTotal + valTotal + '\n');
    await this.write(ThermalPrinterService.ESC_POS.BOLD_OFF);

    await sendText('BAYAR:'.padEnd(15) + config.bayar.toLocaleString('id-ID').padStart(17) + '\n');
    await sendText('KEMBALI:'.padEnd(15) + config.kembali.toLocaleString('id-ID').padStart(17) + '\n');
    await sendText('--------------------------------\n');

    // Footer
    await this.write(ThermalPrinterService.ESC_POS.ALIGN_CENTER);
    await sendText('Terima Kasih Atas Kunjungan Anda\n');
    await sendText('Semoga Lekas Sembuh\n\n\n\n');
    
    // Potong Kertas (jika didukung)
    await this.write(ThermalPrinterService.ESC_POS.FEED_AND_CUT);
  }

  /**
   * Memutus koneksi
   */
  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }
}

export const printerService = new ThermalPrinterService();
