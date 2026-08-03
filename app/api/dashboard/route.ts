import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getBulanTahunSekarang, parsePeriodeQuery } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

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

    // Ambil semua pelanggan aktif + tagihan bulan tsb
    const pelangganAktif = await prisma.pelanggan.findMany({
      where: { aktif: true },
      include: {
        paket: true,
        tagihan: { where: { bulan, tahun } },
      },
    });

    let totalPerkiraanPemasukan = 0;
    let totalSudahMasuk = 0;
    let jumlahLunas = 0;
    let jumlahBelumBayar = 0;
    let jumlahIsolir = 0;

    for (const p of pelangganAktif) {
      totalPerkiraanPemasukan += p.paket.harga;

      const tagihan = p.tagihan[0]; // max 1 per bulan per pelanggan
      if (!tagihan) {
        // Belum ada record tagihan bulan ini → hitung sebagai belum bayar
        jumlahBelumBayar++;
      } else if (tagihan.status === "LUNAS") {
        totalSudahMasuk += tagihan.nominalBayar ?? 0;
        jumlahLunas++;
      } else if (tagihan.status === "ISOLIR") {
        jumlahIsolir++;
      } else {
        jumlahBelumBayar++;
      }
    }

    const data: DashboardData = {
      bulan,
      tahun,
      totalPerkiraanPemasukan,
      totalSudahMasuk,
      totalBelumMasuk: Math.max(0, totalPerkiraanPemasukan - totalSudahMasuk),
      jumlahLunas,
      jumlahBelumBayar,
      jumlahIsolir,
      totalPelangganAktif: pelangganAktif.length,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
  }
}
