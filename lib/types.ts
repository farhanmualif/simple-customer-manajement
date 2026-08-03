// Tipe-tipe data untuk response API

export interface PaketData {
  id: string;
  namaPaket: string;
  harga: number;       // dalam Rupiah penuh
  aktif: boolean;
}

// Item di list pelanggan — ringkas
export interface PelangganListItem {
  id: string;
  nomorUrut: number | null;
  nama: string;
  noWhatsapp: string | null;
  secretsPppoe: string | null;
  alamat: string | null;
  blokArea: string | null;
  paket: PaketData;
  tanggalJatuhTempo: number;
  ppn: boolean;
  keterangan: string | null;
  kupon: boolean;
  aktif: boolean;
  // status untuk bulan/tahun yang sedang dilihat
  statusBulanIni: StatusTagihan;
  nominalBayarBulanIni: number | null;
  tanggalBayarBulanIni: string | null;
  tagihanBulanIniId: string | null;
}

// Detail pelanggan — lengkap dengan riwayat
export interface PelangganDetail extends PelangganListItem {
  riwayatTagihan: TagihanItem[];
}

// Satu baris tagihan
export interface TagihanItem {
  id: string;
  bulan: number;
  tahun: number;
  nominalTagihan: number;
  nominalBayar: number | null;
  status: StatusTagihan;
  tanggalBayar: string | null;
  catatan: string | null;
}

export type StatusTagihan = "LUNAS" | "BELUM_BAYAR" | "ISOLIR";

// Dashboard
export interface DashboardData {
  bulan: number;
  tahun: number;
  totalPerkiraanPemasukan: number;
  totalSudahMasuk: number;
  totalBelumMasuk: number;
  jumlahLunas: number;
  jumlahBelumBayar: number;
  jumlahIsolir: number;
  totalPelangganAktif: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Untuk query params bulan/tahun
export interface PeriodeQuery {
  bulan: number;
  tahun: number;
}
