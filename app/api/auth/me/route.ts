import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ isLoggedIn: false });
    }
    return NextResponse.json({
      isLoggedIn: true,
      adminId: session.adminId,
      adminNama: session.adminNama,
    });
  } catch {
    return NextResponse.json({ isLoggedIn: false });
  }
}
