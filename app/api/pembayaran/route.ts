import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parsePeriodeQuery } from "@/lib/utils";

/**
 * POST /api/pembayaran
 * Body: { pelangganId, bulan, tahun, status, nominalBayar, catatan }
 *
 * Digunakan untuk:
 * - Tandai LUNAS   → status="LUNAS",       nominalBayar=angka
 * - Tandai ISOLIR  → status="ISOLIR",       nominalBayar=null
 * - Tandai BELUM   → status="BELUM_BAYAR",  nominalBayar=null (reset)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await req.json();
    const {
      pelangganId,
      status,
      nominalBayar,
      catatan,
    } = body as {
      pelangganId: string;
      status: "LUNAS" | "BELUM_BAYAR" | "ISOLIR";
      nominalBayar?: number;
      catatan?: string;
    };

    const bulanStr = body.bulan ? String(body.bulan) : null;
    const tahunStr = body.tahun ? String(body.tahun) : null;
    const { bulan, tahun } = parsePeriodeQuery(bulanStr, tahunStr);

    if (!pelangganId)
      return NextResponse.json({ error: "ID pelanggan wajib diisi" }, { status: 400 });
    if (!["LUNAS", "BELUM_BAYAR", "ISOLIR"].includes(status))
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    if (status === "LUNAS" && (!nominalBayar || nominalBayar <= 0))
      return NextResponse.json({ error: "Nominal harus diisi untuk status Lunas" }, { status: 400 });

    // Pastikan pelanggan ada
    const pelanggan = await prisma.pelanggan.findUnique({
      where: { id: pelangganId },
      include: { paket: true },
    });
    if (!pelanggan)
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });

    const tagihan = await prisma.tagihan.upsert({
      where: { pelangganId_bulan_tahun: { pelangganId, bulan, tahun } },
      create: {
        pelangganId,
        bulan,
        tahun,
        nominalTagihan: pelanggan.paket.harga,
        nominalBayar:   status === "LUNAS" ? (nominalBayar ?? pelanggan.paket.harga) : null,
        status,
        tanggalBayar:   status === "LUNAS" ? new Date() : null,
        catatan:        catatan?.trim() || null,
      },
      update: {
        nominalBayar:   status === "LUNAS" ? (nominalBayar ?? pelanggan.paket.harga) : null,
        status,
        tanggalBayar:   status === "LUNAS" ? new Date() : null,
        catatan:        catatan?.trim() || null,
      },
    });

    return NextResponse.json({ data: tagihan }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/pembayaran]", error);
    return NextResponse.json({ error: "Gagal menyimpan data tagihan" }, { status: 500 });
  }
}
