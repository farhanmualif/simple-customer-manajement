import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body as { pin: string };

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN harus 4 angka" },
        { status: 400 }
      );
    }

    // Ambil admin (single admin)
    const admin = await prisma.admin.findFirst();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin belum dikonfigurasi. Jalankan seed terlebih dahulu." },
        { status: 500 }
      );
    }

    const pinBenar = await bcrypt.compare(pin, admin.pinHash);

    if (!pinBenar) {
      return NextResponse.json(
        { error: "PIN salah. Coba lagi." },
        { status: 401 }
      );
    }

    // Buat session
    const session = await getSession();
    session.adminId = admin.id;
    session.adminNama = admin.nama;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, nama: admin.nama });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Coba lagi." },
      { status: 500 }
    );
  }
}
