/**
 * Script import data dari SAMPLE_DATA_PELANGGAN.xlsx ke Supabase
 *
 * Jalankan: npx tsx prisma/import-excel.ts
 *
 * Yang dilakukan:
 * - Baca semua baris valid dari sheet AGUSTUS2026
 * - Buat/update paket berdasarkan harga unik
 * - Import semua pelanggan
 * - Buat tagihan Agustus 2026 untuk setiap pelanggan sesuai status di Excel
 * - TIDAK menghapus data admin yang sudah ada
 */

import { PrismaClient, StatusTagihan } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

// ── Konfigurasi ──────────────────────────────────────────────────────────────
const EXCEL_FILE = path.join(process.cwd(), "SAMPLE_DATA_PELANGGAN.xlsx");
const SHEET_NAME = "AGUSTUS2026";
const BULAN_DATA = 8;   // Agustus
const TAHUN_DATA = 2026;

// ── Helper ───────────────────────────────────────────────────────────────────
function parseStatus(raw: string | number): StatusTagihan {
  const s = String(raw).trim().toLowerCase();
  if (s === "lunas")        return "LUNAS";
  if (s === "isolir")       return "ISOLIR";
  return "BELUM_BAYAR"; // default
}

function cleanString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function parseNominalBayar(raw: unknown, status: StatusTagihan): number | null {
  if (status !== "LUNAS") return null;
  const n = Number(raw);
  if (isNaN(n) || n <= 0) return null;
  return n * 1000; // Excel dalam ribuan (165 = Rp 165.000)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📂 Membaca file Excel...");
  const wb = XLSX.readFile(EXCEL_FILE);
  const ws = wb.Sheets[SHEET_NAME];

  if (!ws) {
    throw new Error(`Sheet "${SHEET_NAME}" tidak ditemukan di file Excel`);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  // Ambil baris data (mulai row index 3, skip header)
  const dataRows = rows.slice(3).filter((r: unknown[]) => {
    const no   = r[0];
    const nama = r[1];
    // Baris valid: punya nomor dan nama, bukan "testing"
    return (
      typeof no === "number" &&
      no > 0 &&
      typeof nama === "string" &&
      nama.trim() !== "" &&
      nama.trim().toLowerCase() !== "testing"
    );
  });

  console.log(`✅ Ditemukan ${dataRows.length} baris pelanggan valid`);

  // ── Step 1: Buat semua paket yang dibutuhkan ──────────────────────────────
  console.log("\n📦 Menyiapkan paket...");

  const hargaUnik = new Set<number>();
  dataRows.forEach((r: unknown[]) => {
    const h = Number(r[4]);
    if (!isNaN(h) && h > 0) hargaUnik.add(h);
  });

  const paketMap = new Map<number, string>(); // harga (ribuan) → paketId

  for (const harga of hargaUnik) {
    const namaPaket = `Paket ${harga}K`;
    const hargaRupiah = harga * 1000;

    const paket = await prisma.paket.upsert({
      where: { id: `paket-${harga}k` },
      create: {
        id:        `paket-${harga}k`,
        namaPaket,
        harga:     hargaRupiah,
        aktif:     true,
      },
      update: {
        namaPaket,
        harga: hargaRupiah,
        aktif: true,
      },
    });
    paketMap.set(harga, paket.id);
  }

  console.log(`✅ ${paketMap.size} paket siap: ${[...hargaUnik].sort((a,b)=>a-b).map(h => `${h}K`).join(", ")}`);

  // ── Step 2: Import pelanggan ──────────────────────────────────────────────
  console.log("\n👥 Mengimport pelanggan...");

  let sukses = 0;
  let gagal  = 0;
  let tagihanDibuat = 0;
  const errors: string[] = [];

  for (const r of dataRows) {
    const nomorUrut   = Number(r[0]);
    const nama        = String(r[1]).trim();
    const secretsPppoe = cleanString(r[2]);
    const alamat      = cleanString(r[3]);
    const hargaRaw    = Number(r[4]);
    const tglJatuhTempo = Number(r[5]);
    const statusRaw   = String(r[6]);
    const lunasRaw    = r[7];
    const catatanRaw  = cleanString(r[8]); // kolom ke-9 (index 8) = keterangan/catatan baris
    const blokArea    = cleanString(r[9]);
    const ppnRaw      = r[10];
    const keterangan  = cleanString(r[11]);
    const kuponRaw    = r[12];

    // Validasi harga
    if (isNaN(hargaRaw) || hargaRaw <= 0) {
      errors.push(`Row ${nomorUrut} (${nama}): harga tidak valid (${r[4]})`);
      gagal++;
      continue;
    }

    const paketId = paketMap.get(hargaRaw);
    if (!paketId) {
      errors.push(`Row ${nomorUrut} (${nama}): paket ${hargaRaw}K tidak ditemukan`);
      gagal++;
      continue;
    }

    // Validasi tanggal jatuh tempo
    const tanggalJatuhTempo = isNaN(tglJatuhTempo) || tglJatuhTempo < 1 || tglJatuhTempo > 31
      ? 1
      : tglJatuhTempo;

    const status = parseStatus(statusRaw);
    const ppn    = String(ppnRaw).trim().toLowerCase() === "y";
    const kupon  = ["y", "b"].includes(String(kuponRaw).trim().toLowerCase());
    const nominalBayar = parseNominalBayar(lunasRaw, status);

    try {
      // Gunakan nomorUrut sebagai ID deterministik agar upsert bisa dilakukan
      const pelangganId = `import-${nomorUrut}`;

      await prisma.pelanggan.upsert({
        where:  { id: pelangganId },
        create: {
          id:                pelangganId,
          nomorUrut,
          nama,
          secretsPppoe,
          alamat,
          paketId,
          tanggalJatuhTempo,
          blokArea,
          ppn,
          keterangan,
          kupon,
          aktif: true,
        },
        update: {
          nomorUrut,
          nama,
          secretsPppoe,
          alamat,
          paketId,
          tanggalJatuhTempo,
          blokArea,
          ppn,
          keterangan,
          kupon,
          aktif: true,
        },
      });

      // Buat/update tagihan bulan ini (Agustus 2026)
      await prisma.tagihan.upsert({
        where: {
          pelangganId_bulan_tahun: {
            pelangganId,
            bulan: BULAN_DATA,
            tahun: TAHUN_DATA,
          },
        },
        create: {
          pelangganId,
          bulan:          BULAN_DATA,
          tahun:          TAHUN_DATA,
          nominalTagihan: hargaRaw * 1000,
          nominalBayar,
          status,
          tanggalBayar:   status === "LUNAS" ? new Date() : null,
          catatan:        catatanRaw,
        },
        update: {
          nominalTagihan: hargaRaw * 1000,
          nominalBayar,
          status,
          tanggalBayar:   status === "LUNAS" ? new Date() : null,
          catatan:        catatanRaw,
        },
      });

      sukses++;
      tagihanDibuat++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Row ${nomorUrut} (${nama}): ${msg}`);
      gagal++;
    }
  }

  // ── Laporan ───────────────────────────────────────────────────────────────
  console.log("\n──────────────────────────────────────────────────");
  console.log(`✅ Pelanggan berhasil diimport : ${sukses}`);
  console.log(`📋 Tagihan dibuat              : ${tagihanDibuat} (${BULAN_DATA}/${TAHUN_DATA})`);
  if (gagal > 0) {
    console.log(`❌ Gagal                       : ${gagal}`);
    errors.slice(0, 10).forEach(e => console.log(`   • ${e}`));
    if (errors.length > 10) console.log(`   ... dan ${errors.length - 10} error lainnya`);
  }
  console.log("──────────────────────────────────────────────────");
  console.log("\n🎉 Import selesai!");
}

main()
  .catch((e) => {
    console.error("\n💥 Import gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
