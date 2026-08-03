import { PrismaClient, StatusTagihan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Bulan dan tahun seed (sesuai nama sheet Excel: AGUSTUS2026)
const BULAN_SEED = 8;
const TAHUN_SEED = 2026;
const BULAN_LALU = 7;
const TAHUN_BULAN_LALU = 2026;

async function main() {
  console.log("🌱 Seeding database...");

  // Hapus semua data lama (urutan: child dulu)
  await prisma.tagihan.deleteMany();
  await prisma.pelanggan.deleteMany();
  await prisma.paket.deleteMany();
  await prisma.admin.deleteMany();

  // ── Admin ──────────────────────────────────────────────
  const pinHash = await bcrypt.hash("1234", 12);
  await prisma.admin.create({
    data: { nama: "Admin RT/RW Net", pinHash },
  });
  console.log("✅ Admin dibuat  (PIN: 1234)");

  // ── Paket ─────────────────────────────────────────────
  // Dari Excel: harga langsung dalam ribuan (165, 150, 125, 120, 100, 75, dst)
  // Kita simpan dalam Rupiah penuh
  const paketMap: Record<number, string> = {};

  const hargaList = [75, 100, 120, 125, 150, 165, 200, 250];
  for (const harga of hargaList) {
    const p = await prisma.paket.create({
      data: {
        namaPaket: `Paket ${harga}K`,
        harga: harga * 1000,
        aktif: true,
      },
    });
    paketMap[harga] = p.id;
  }
  console.log(`✅ ${hargaList.length} paket dibuat`);

  // ── Pelanggan + Tagihan ────────────────────────────────
  // Data representatif dari Excel AGUSTUS2026
  // Kolom: nomorUrut, nama, secretsPppoe, alamat, harga, tanggalJatuhTempo,
  //        statusBulanIni, nominalBayar, blokArea, ppn, keterangan, kupon
  const rows: {
    no: number;
    nama: string;
    pppoe: string;
    alamat: string;
    harga: number;
    tgl: number;
    status: StatusTagihan;
    nominalBayar: number | null;
    blokArea: string;
    ppn: boolean;
    keterangan: string;
    kupon: boolean;
    // riwayat bulan lalu
    statusLalu: StatusTagihan;
    nominalBayarLalu: number | null;
  }[] = [
    { no: 1,  nama: "Putri Casmad",         pppoe: "",                      alamat: "Rujakbeleng",        harga: 150, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",               ppn: false, keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 150000 },
    { no: 2,  nama: "Juleha",                pppoe: "",                      alamat: "Rujakbeleng",        harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: true,  keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 3,  nama: "Maksum",                pppoe: "",                      alamat: "Rujakbeleng",        harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: true,  keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 4,  nama: "Amin Mustar",           pppoe: "",                      alamat: "Kalimati",           harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp rt darso",  ppn: false, keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 5,  nama: "Arif Fahiru",           pppoe: "",                      alamat: "Kalimati",           harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp rt darso",  ppn: true,  keterangan: "aktif6",         kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 6,  nama: "Andi Slamet",           pppoe: "",                      alamat: "Bogolan",            harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 7,  nama: "Reni",                  pppoe: "RENI@BOGOLAN",          alamat: "Bogolan Tanjakan",   harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 140000, blokArea: "",              ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 8,  nama: "Zahra Lestari",         pppoe: "ZAHRA@BOGOLAN",         alamat: "Bogolan Tanjakan",   harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 9,  nama: "Riyanto",               pppoe: "RIYANTO@BOGOLAN",       alamat: "Bogolan Tanjakan",   harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: false, keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 10, nama: "Kuswati",               pppoe: "",                      alamat: "Bogolan Tengah",     harga: 165, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "odp-tasbun",    ppn: false, keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 11, nama: "Suci Nurfiria",         pppoe: "",                      alamat: "Bogolan",            harga: 165, tgl: 1,  status: "ISOLIR",      nominalBayar: null,  blokArea: "odp-tasbun",    ppn: true,  keterangan: "0ff",            kupon: false, statusLalu: "ISOLIR",      nominalBayarLalu: null   },
    { no: 12, nama: "M Renaldi",             pppoe: "RENALDI@BOGOLAN",       alamat: "Bogolan",            harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",              ppn: true,  keterangan: "juli lunas",     kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 13, nama: "Cahyono",               pppoe: "",                      alamat: "Cangakidul",         harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp-hj mun",   ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 14, nama: "Rismanto",              pppoe: "",                      alamat: "Cangakidul",         harga: 125, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "odp-hj mun",   ppn: true,  keterangan: "",               kupon: false, statusLalu: "BELUM_BAYAR", nominalBayarLalu: null   },
    { no: 15, nama: "Fiki",                  pppoe: "",                      alamat: "Cangakidul",         harga: 165, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "odp-hj mun",   ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 19, nama: "Nurholipah",            pppoe: "",                      alamat: "Parungkudi",         harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 70000, blokArea: "odp dian",     ppn: true,  keterangan: "CDATA",          kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 20, nama: "Reniastu",              pppoe: "RENIATU@PARKUD",        alamat: "Parungkudi",         harga: 150, tgl: 1,  status: "LUNAS",       nominalBayar: 150000, blokArea: "odp dian",    ppn: false, keterangan: "aktif 16 juni",  kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 150000 },
    { no: 23, nama: "ROHMANI",               pppoe: "ROHMANI@JAIDAN",        alamat: "Jaidan",             harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",             ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 24, nama: "Amecca",                pppoe: "",                      alamat: "Jaidan",             harga: 165, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 25, nama: "Kaliri Doyok",          pppoe: "KALIRI@JAIDAN",         alamat: "Jaidan Lor",         harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",             ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 30, nama: "Budi Tentara",          pppoe: "",                      alamat: "Payung",             harga: 165, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 35, nama: "Rusmani",               pppoe: "",                      alamat: "Delempong",          harga: 165, tgl: 1,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "smi",            kupon: false, statusLalu: "BELUM_BAYAR", nominalBayarLalu: null   },
    { no: 41, nama: "Darhadi",               pppoe: "",                      alamat: "Delempong",          harga: 120, tgl: 1,  status: "ISOLIR",      nominalBayar: null,  blokArea: "",             ppn: false, keterangan: "aktif 14feb",    kupon: false, statusLalu: "ISOLIR",      nominalBayarLalu: null   },
    { no: 42, nama: "Syarif",                pppoe: "SYARIF@DELEMPONG",      alamat: "Delempong",          harga: 125, tgl: 1,  status: "ISOLIR",      nominalBayar: null,  blokArea: "odp lestari",  ppn: false, keterangan: "aktif 14 juli",  kupon: false, statusLalu: "BELUM_BAYAR", nominalBayarLalu: null   },
    { no: 43, nama: "Yunita Tohir",          pppoe: "YUNITA@DELEMPUNG",      alamat: "Delempong",          harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp gg sawo", ppn: false, keterangan: "aktif tgl 5 Juli", kupon: false, statusLalu: "BELUM_BAYAR", nominalBayarLalu: null  },
    { no: 48, nama: "Dicky Husna",           pppoe: "DICKY@BOGOLAN",         alamat: "Payung",             harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",            ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 51, nama: "Kasan",                 pppoe: "",                      alamat: "Payung",             harga: 165, tgl: 20, status: "ISOLIR",      nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "tgl 1>>>20",     kupon: true,  statusLalu: "ISOLIR",      nominalBayarLalu: null   },
    { no: 64, nama: "Fitriyah",              pppoe: "FITRIYAH@CANGAK",       alamat: "Cangak",             harga: 165, tgl: 1,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp Heri",    ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 65, nama: "Dirin",                 pppoe: "",                      alamat: "Cangak Lor Dirin",   harga: 250, tgl: 1,  status: "LUNAS",       nominalBayar: 250000, blokArea: "",            ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 250000 },
    { no: 85, nama: "Muayah",                pppoe: "",                      alamat: "Cangak",             harga: 75,  tgl: 1,  status: "LUNAS",       nominalBayar: 100000, blokArea: "",            ppn: false, keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 75000  },
    { no: 102, nama: "Egy Daisah",           pppoe: "",                      alamat: "Payung",             harga: 165, tgl: 1,  status: "ISOLIR",      nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "",               kupon: true,  statusLalu: "ISOLIR",      nominalBayarLalu: null   },
    { no: 110, nama: "WAHIDATUL",            pppoe: "WAHIDATUL@BOGOLAN",     alamat: "Bogolan",            harga: 165, tgl: 2,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",            ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 130, nama: "Budiyanto",            pppoe: "BUDIYANTO@PONTONG",     alamat: "Cangak Pontong",     harga: 165, tgl: 4,  status: "LUNAS",       nominalBayar: 165000, blokArea: "odp gg pontong", ppn: true, keterangan: "",             kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 168, nama: "Siti Anikasari",       pppoe: "SITI-ANIKA@JAIDAN",     alamat: "Jaidan",             harga: 165, tgl: 8,  status: "LUNAS",       nominalBayar: 165000, blokArea: "",            ppn: true,  keterangan: "",               kupon: true,  statusLalu: "LUNAS",       nominalBayarLalu: 165000 },
    { no: 170, nama: "Tati",                 pppoe: "",                      alamat: "Rujakbeleng",        harga: 200, tgl: 8,  status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",             ppn: true,  keterangan: "",               kupon: false, statusLalu: "LUNAS",       nominalBayarLalu: 200000 },
    { no: 484, nama: "Tarisih Gendon",       pppoe: "GENDON@DELEMPONG",      alamat: "Kebandungan",        harga: 165, tgl: 28, status: "BELUM_BAYAR", nominalBayar: null,  blokArea: "",             ppn: false, keterangan: "Aktif 28 Juli",  kupon: false, statusLalu: "BELUM_BAYAR", nominalBayarLalu: null   },
  ];

  let created = 0;
  for (const row of rows) {
    const paketId = paketMap[row.harga];
    if (!paketId) {
      console.warn(`  ⚠ Paket ${row.harga}K tidak ditemukan, skip ${row.nama}`);
      continue;
    }

    const pelanggan = await prisma.pelanggan.create({
      data: {
        nomorUrut:        row.no,
        nama:             row.nama,
        secretsPppoe:     row.pppoe || null,
        alamat:           row.alamat || null,
        paketId,
        tanggalJatuhTempo: row.tgl,
        blokArea:         row.blokArea || null,
        ppn:              row.ppn,
        keterangan:       row.keterangan || null,
        kupon:            row.kupon,
        aktif:            row.status !== "ISOLIR" ? true : true, // isolir tetap aktif di DB
      },
    });

    // Tagihan bulan lalu
    await prisma.tagihan.create({
      data: {
        pelangganId:    pelanggan.id,
        bulan:          BULAN_LALU,
        tahun:          TAHUN_BULAN_LALU,
        nominalTagihan: row.harga * 1000,
        nominalBayar:   row.statusLalu === "LUNAS" ? row.nominalBayarLalu : null,
        status:         row.statusLalu,
        tanggalBayar:   row.statusLalu === "LUNAS"
          ? new Date(TAHUN_BULAN_LALU, BULAN_LALU - 1, row.tgl)
          : null,
      },
    });

    // Tagihan bulan ini
    await prisma.tagihan.create({
      data: {
        pelangganId:    pelanggan.id,
        bulan:          BULAN_SEED,
        tahun:          TAHUN_SEED,
        nominalTagihan: row.harga * 1000,
        nominalBayar:   row.status === "LUNAS" ? row.nominalBayar : null,
        status:         row.status,
        tanggalBayar:   row.status === "LUNAS"
          ? new Date(TAHUN_SEED, BULAN_SEED - 1, row.tgl)
          : null,
        catatan:        row.keterangan || null,
      },
    });

    created++;
  }

  console.log(`✅ ${created} pelanggan dibuat dengan tagihan Juli & Agustus 2026`);
  console.log("");
  console.log("──────────────────────────────────────────");
  console.log("📌 Login PIN      : 1234");
  console.log(`📅 Data bulan     : ${BULAN_LALU}/${TAHUN_BULAN_LALU} & ${BULAN_SEED}/${TAHUN_SEED}`);
  console.log("🌐 Jalankan       : npm run dev");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
