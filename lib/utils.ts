import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah
 * Contoh: 165000 → "Rp 165.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Nama bulan Bahasa Indonesia */
export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function getNamaBulan(bulan: number): string {
  return NAMA_BULAN[(bulan - 1)] ?? "";
}

/** "Agustus 2026" */
export function formatBulanTahun(bulan: number, tahun: number): string {
  return `${getNamaBulan(bulan)} ${tahun}`;
}

/** "10 Agustus 2026" */
export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "10 Agustus" — tanpa tahun */
export function formatTanggalPendek(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
  }).format(d);
}

/** Bulan dan tahun saat ini */
export function getBulanTahunSekarang(): { bulan: number; tahun: number } {
  const now = new Date();
  return { bulan: now.getMonth() + 1, tahun: now.getFullYear() };
}

/** Pindah bulan: +1 atau -1 */
export function geserBulan(bulan: number, tahun: number, delta: number) {
  const d = new Date(tahun, bulan - 1 + delta, 1);
  return { bulan: d.getMonth() + 1, tahun: d.getFullYear() };
}

/** Parse bulan/tahun dari query string, fallback ke sekarang */
export function parsePeriodeQuery(
  bulanStr: string | null,
  tahunStr: string | null
): { bulan: number; tahun: number } {
  const now = getBulanTahunSekarang();
  const bulan = bulanStr ? parseInt(bulanStr, 10) : now.bulan;
  const tahun = tahunStr ? parseInt(tahunStr, 10) : now.tahun;
  if (isNaN(bulan) || bulan < 1 || bulan > 12) return now;
  if (isNaN(tahun) || tahun < 2020 || tahun > 2100) return now;
  return { bulan, tahun };
}

/** Label status yang ramah pengguna */
export function labelStatus(status: string): string {
  switch (status) {
    case "LUNAS":       return "Lunas";
    case "BELUM_BAYAR": return "Belum Bayar";
    case "ISOLIR":      return "Isolir";
    default:            return status;
  }
}
