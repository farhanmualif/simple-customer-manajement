import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parsePeriodeQuery } from "@/lib/utils";

// GET /api/pelanggan?bulan=8&tahun=2026&search=&filter=semua&page=1&limit=20&tanggalBayar=YYYY-MM-DD&jatuhTempo=10
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { bulan, tahun } = parsePeriodeQuery(
      searchParams.get("bulan"),
      searchParams.get("tahun")
    );
    const search       = searchParams.get("search") ?? "";
    const filter       = searchParams.get("filter") ?? "semua";
    const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit        = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const tanggalBayar = searchParams.get("tanggalBayar"); // YYYY-MM-DD atau null
    const jatuhTempo   = searchParams.get("jatuhTempo");   // "1"-"28" atau null

    // jatuhTempo bisa langsung di DB-level WHERE (field tanggalJatuhTempo)
    const where = {
      aktif: true,
      ...(search      ? { nama: { contains: search, mode: "insensitive" as const } } : {}),
      ...(jatuhTempo  ? { tanggalJatuhTempo: parseInt(jatuhTempo, 10) } : {}),
    };

    const needsStatusFilter  = filter !== "semua";
    const needsTanggalFilter = tanggalBayar !== null && tanggalBayar !== "";
    const needsMemoryFilter  = needsStatusFilter || needsTanggalFilter;

    let pelangganList;
    let totalCount: number;

    if (needsMemoryFilter) {
      // Ambil semua yang match search, filter di memory
      pelangganList = await prisma.pelanggan.findMany({
        where,
        include: {
          paket: true,
          tagihan: { where: { bulan, tahun } },
        },
        orderBy: [{ nomorUrut: "asc" }, { nama: "asc" }],
      });

      let mapped = pelangganList.map((p) => mapPelanggan(p, bulan, tahun));

      // Filter status
      if (needsStatusFilter) {
        mapped =
          filter === "lunas"       ? mapped.filter((p) => p.statusBulanIni === "LUNAS") :
          filter === "belum_bayar" ? mapped.filter((p) => p.statusBulanIni === "BELUM_BAYAR") :
          filter === "isolir"      ? mapped.filter((p) => p.statusBulanIni === "ISOLIR") :
          mapped;
      }

      // Filter tanggal bayar — cari pelanggan yang bayar pada tanggal tertentu
      if (needsTanggalFilter) {
        // tanggalBayar bisa berupa "YYYY-MM-DD" (dari date picker) atau angka "1"-"31"
        let tgl: number;
        if (tanggalBayar!.includes("-")) {
          // Format YYYY-MM-DD — ambil hari saja
          tgl = new Date(tanggalBayar!).getDate();
        } else {
          tgl = parseInt(tanggalBayar!, 10);
        }
        mapped = mapped.filter((p) => {
          if (!p.tanggalBayarBulanIni) return false;
          const d = new Date(p.tanggalBayarBulanIni);
          return d.getDate() === tgl;
        });
      }

      totalCount = mapped.length;
      const paginated = mapped.slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        data: paginated, bulan, tahun,
        pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
      });
    }

    // Tanpa filter status: DB-level pagination langsung
    [pelangganList, totalCount] = await Promise.all([
      prisma.pelanggan.findMany({
        where,
        include: {
          paket: true,
          tagihan: { where: { bulan, tahun } },
        },
        orderBy: [{ nomorUrut: "asc" }, { nama: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pelanggan.count({ where }),
    ]);

    const data = pelangganList.map((p) => mapPelanggan(p, bulan, tahun));

    return NextResponse.json({
      data, bulan, tahun,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
    });
  } catch (error) {
    console.error("[GET /api/pelanggan]", error);
    return NextResponse.json({ error: "Gagal memuat daftar pelanggan" }, { status: 500 });
  }
}

// Helper mapping
function mapPelanggan(
  p: { id: string; nomorUrut: number | null; nama: string; noWhatsapp: string | null; secretsPppoe: string | null; alamat: string | null; blokArea: string | null; paket: { id: string; namaPaket: string; harga: number; aktif: boolean }; tanggalJatuhTempo: number; ppn: boolean; keterangan: string | null; kupon: boolean; aktif: boolean; tagihan: { id: string; status: string; nominalBayar: number | null; tanggalBayar: Date | null }[] },
  bulan: number, tahun: number
) {
  const tagihan = p.tagihan[0] ?? null;
  const status = (tagihan?.status ?? "BELUM_BAYAR") as "LUNAS" | "BELUM_BAYAR" | "ISOLIR";
  return {
    id: p.id,
    nomorUrut: p.nomorUrut,
    nama: p.nama,
    noWhatsapp: p.noWhatsapp,
    secretsPppoe: p.secretsPppoe,
    alamat: p.alamat,
    blokArea: p.blokArea,
    paket: { id: p.paket.id, namaPaket: p.paket.namaPaket, harga: p.paket.harga, aktif: p.paket.aktif },
    tanggalJatuhTempo: p.tanggalJatuhTempo,
    ppn: p.ppn,
    keterangan: p.keterangan,
    kupon: p.kupon,
    aktif: p.aktif,
    statusBulanIni: status,
    nominalBayarBulanIni: tagihan?.nominalBayar ?? null,
    tanggalBayarBulanIni: tagihan?.tanggalBayar?.toISOString() ?? null,
    tagihanBulanIniId: tagihan?.id ?? null,
  };
}

// POST /api/pelanggan — tambah pelanggan baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await req.json();
    const {
      nama, secretsPppoe, alamat, paketId,
      tanggalJatuhTempo, blokArea, ppn, keterangan, kupon, noWhatsapp,
    } = body;

    if (!nama?.trim()) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    if (!paketId)       return NextResponse.json({ error: "Paket wajib dipilih" }, { status: 400 });
    const tgl = parseInt(tanggalJatuhTempo, 10);
    if (!tgl || tgl < 1 || tgl > 31)
      return NextResponse.json({ error: "Tanggal jatuh tempo tidak valid (1-31)" }, { status: 400 });

    const paket = await prisma.paket.findUnique({ where: { id: paketId } });
    if (!paket) return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 400 });

    // Nomor urut otomatis: max + 1
    const maxNo = await prisma.pelanggan.aggregate({ _max: { nomorUrut: true } });
    const nomorUrut = (maxNo._max.nomorUrut ?? 0) + 1;

    const pelanggan = await prisma.pelanggan.create({
      data: {
        nomorUrut,
        nama: nama.trim(),
        noWhatsapp: noWhatsapp?.trim() || null,
        secretsPppoe: secretsPppoe?.trim() || null,
        alamat: alamat?.trim() || null,
        paketId,
        tanggalJatuhTempo: tgl,
        blokArea: blokArea?.trim() || null,
        ppn: Boolean(ppn),
        keterangan: keterangan?.trim() || null,
        kupon: Boolean(kupon),
        aktif: true,
      },
      include: { paket: true },
    });

    return NextResponse.json({ data: pelanggan }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pelanggan]", error);
    return NextResponse.json({ error: "Gagal menambah pelanggan" }, { status: 500 });
  }
}
