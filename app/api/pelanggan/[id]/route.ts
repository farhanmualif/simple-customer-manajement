import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parsePeriodeQuery } from "@/lib/utils";
import type { PelangganDetail } from "@/lib/types";

// GET /api/pelanggan/[id]?bulan=8&tahun=2026
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const { bulan, tahun } = parsePeriodeQuery(
      searchParams.get("bulan"),
      searchParams.get("tahun")
    );

    const pelanggan = await prisma.pelanggan.findUnique({
      where: { id },
      include: {
        paket: true,
        tagihan: {
          orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
          take: 24, // riwayat 24 bulan
        },
      },
    });

    if (!pelanggan) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    const tagihanBulanIni = pelanggan.tagihan.find(
      (t) => t.bulan === bulan && t.tahun === tahun
    );
    const status = (tagihanBulanIni?.status ?? "BELUM_BAYAR") as "LUNAS" | "BELUM_BAYAR" | "ISOLIR";

    const data: PelangganDetail = {
      id: pelanggan.id,
      nomorUrut: pelanggan.nomorUrut,
      nama: pelanggan.nama,
      noWhatsapp: pelanggan.noWhatsapp,
      secretsPppoe: pelanggan.secretsPppoe,
      alamat: pelanggan.alamat,
      blokArea: pelanggan.blokArea,
      paket: { id: pelanggan.paket.id, namaPaket: pelanggan.paket.namaPaket, harga: pelanggan.paket.harga, aktif: pelanggan.paket.aktif },
      tanggalJatuhTempo: pelanggan.tanggalJatuhTempo,
      ppn: pelanggan.ppn,
      keterangan: pelanggan.keterangan,
      kupon: pelanggan.kupon,
      aktif: pelanggan.aktif,
      statusBulanIni: status,
      nominalBayarBulanIni: tagihanBulanIni?.nominalBayar ?? null,
      tanggalBayarBulanIni: tagihanBulanIni?.tanggalBayar?.toISOString() ?? null,
      tagihanBulanIniId: tagihanBulanIni?.id ?? null,
      riwayatTagihan: pelanggan.tagihan.map((t) => ({
        id: t.id,
        bulan: t.bulan,
        tahun: t.tahun,
        nominalTagihan: t.nominalTagihan,
        nominalBayar: t.nominalBayar,
        status: t.status as "LUNAS" | "BELUM_BAYAR" | "ISOLIR",
        tanggalBayar: t.tanggalBayar?.toISOString() ?? null,
        catatan: t.catatan,
      })),
    };

    return NextResponse.json({ data, bulan, tahun });
  } catch (error) {
    console.error("[GET /api/pelanggan/[id]]", error);
    return NextResponse.json({ error: "Gagal memuat detail pelanggan" }, { status: 500 });
  }
}

// PATCH /api/pelanggan/[id] — update data pelanggan
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const {
      nama, secretsPppoe, alamat, paketId,
      tanggalJatuhTempo, blokArea, ppn, keterangan, kupon, aktif,
    } = body;

    const pelanggan = await prisma.pelanggan.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama: nama.trim() }),
        ...(secretsPppoe !== undefined && { secretsPppoe: secretsPppoe?.trim() || null }),
        ...(alamat !== undefined && { alamat: alamat?.trim() || null }),
        ...(paketId !== undefined && { paketId }),
        ...(tanggalJatuhTempo !== undefined && { tanggalJatuhTempo: parseInt(tanggalJatuhTempo, 10) }),
        ...(blokArea !== undefined && { blokArea: blokArea?.trim() || null }),
        ...(ppn !== undefined && { ppn: Boolean(ppn) }),
        ...(keterangan !== undefined && { keterangan: keterangan?.trim() || null }),
        ...(kupon !== undefined && { kupon: Boolean(kupon) }),
        ...(aktif !== undefined && { aktif: Boolean(aktif) }),
      },
      include: { paket: true },
    });

    return NextResponse.json({ data: pelanggan });
  } catch (error) {
    console.error("[PATCH /api/pelanggan/[id]]", error);
    return NextResponse.json({ error: "Gagal mengupdate pelanggan" }, { status: 500 });
  }
}

// DELETE /api/pelanggan/[id] — hapus pelanggan beserta riwayat tagihannya
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.pelanggan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Hapus riwayat tagihan dulu, baru pelanggannya — dibungkus transaction
    // biar konsisten kalau salah satu gagal (rollback semua).
    await prisma.$transaction([
      prisma.tagihan.deleteMany({ where: { pelangganId: id } }),
      prisma.pelanggan.delete({ where: { id } }),
    ]);

    return NextResponse.json({ data: { id }, message: "Pelanggan berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE /api/pelanggan/[id]]", error);
    return NextResponse.json({ error: "Gagal menghapus pelanggan" }, { status: 500 });
  }
}