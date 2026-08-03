import Link from "next/link";
import { Wifi } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-brand-100 flex items-center justify-center mb-6">
        <Wifi className="w-10 h-10 text-brand-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 text-sm mb-8">
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link
        href="/menu"
        className="px-8 py-3.5 bg-brand-600 text-white rounded-xl font-semibold text-sm active:bg-brand-700 transition-colors"
      >
        Kembali ke Menu
      </Link>
    </div>
  );
}
