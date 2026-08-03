import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/paket
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const paket = await prisma.paket.findMany({
      where: { aktif: true },
      orderBy: { harga: "asc" },
    });
    return NextResponse.json({ data: paket });
  } catch (error) {
    console.error("[GET /api/paket]", error);
    return NextResponse.json({ error: "Gagal memuat paket" }, { status: 500 });
  }
}

// POST /api/paket — tambah paket baru
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const { namaPaket, harga } = await req.json();
    if (!namaPaket?.trim()) return NextResponse.json({ error: "Nama paket wajib diisi" }, { status: 400 });
    const h = parseInt(harga, 10);
    if (!h || h <= 0)        return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });

    const paket = await prisma.paket.create({
      data: { namaPaket: namaPaket.trim(), harga: h, aktif: true },
    });
    return NextResponse.json({ data: paket }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/paket]", error);
    return NextResponse.json({ error: "Gagal menambah paket" }, { status: 500 });
  }
}
