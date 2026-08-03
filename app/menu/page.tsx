"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function MenuPage() {
  const router = useRouter();

  return (
    <AppShell pageTitle="Menu Utama" pageSubtitle="Pilih halaman yang ingin dibuka">
      <div className="p-4 lg:p-8">
        {/* Desktop: heading section */}
        <div className="hidden lg:block mb-8">
          <p className="text-slate-500">Selamat datang. Pilih menu di bawah atau gunakan sidebar kiri.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Dashboard Card */}
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white rounded-2xl p-6 shadow-card flex items-center gap-5 hover:shadow-card-md active:scale-[0.98] transition-all text-left group border border-transparent hover:border-brand-100"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-200 transition-colors">
              <LayoutDashboard className="w-7 h-7 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-800">Dashboard</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Lihat ringkasan pemasukan bulan ini
              </p>
            </div>
            <span className="text-slate-300 text-2xl font-light group-hover:text-brand-400 transition-colors">›</span>
          </button>

          {/* Data Pelanggan Card */}
          <button
            onClick={() => router.push("/pelanggan")}
            className="bg-white rounded-2xl p-6 shadow-card flex items-center gap-5 hover:shadow-card-md active:scale-[0.98] transition-all text-left group border border-transparent hover:border-success-100"
          >
            <div className="w-14 h-14 rounded-2xl bg-success-100 flex items-center justify-center flex-shrink-0 group-hover:bg-success-200 transition-colors">
              <Users className="w-7 h-7 text-success-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-800">Data Pelanggan</p>
              <p className="text-sm text-slate-500 mt-0.5">
                Cari pelanggan &amp; tandai sudah bayar
              </p>
            </div>
            <span className="text-slate-300 text-2xl font-light group-hover:text-success-400 transition-colors">›</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
