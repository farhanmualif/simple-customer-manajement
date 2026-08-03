"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp, CheckCircle2, Clock, Users, RefreshCw,
  ChevronLeft, ChevronRight, WifiOff,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  formatRupiah, formatBulanTahun, getBulanTahunSekarang,
  geserBulan, parsePeriodeQuery,
} from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

function SkeletonBalanceCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`rounded-2xl bg-slate-200 animate-pulse ${tall ? "h-40" : "h-28"}`} />
  );
}

function PeriodeNav({
  bulan, tahun, onChange,
}: {
  bulan: number; tahun: number; onChange: (b: number, t: number) => void;
}) {
  const now = getBulanTahunSekarang();
  const isSekarang = bulan === now.bulan && tahun === now.tahun;

  return (
    <div className="flex items-center gap-2 bg-white/15 lg:bg-slate-100 rounded-xl px-2 py-1">
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, -1); onChange(p.bulan, p.tahun); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white lg:text-slate-600 hover:bg-white/20 lg:hover:bg-slate-200 transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm font-semibold text-white lg:text-slate-700 min-w-[120px] text-center">
        {formatBulanTahun(bulan, tahun)}
      </span>

      <button
        onClick={() => { const p = geserBulan(bulan, tahun, 1); onChange(p.bulan, p.tahun); }}
        disabled={isSekarang}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white lg:text-slate-600 hover:bg-white/20 lg:hover:bg-slate-200 transition-colors disabled:opacity-30"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isSekarang && (
        <button
          onClick={() => onChange(now.bulan, now.tahun)}
          className="text-xs text-white/70 lg:text-brand-600 hover:underline ml-1 hidden sm:inline"
        >
          Bulan ini
        </button>
      )}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = getBulanTahunSekarang();

  const [periode, setPeriode] = useState(() =>
    parsePeriodeQuery(searchParams.get("bulan"), searchParams.get("tahun"))
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (b: number, t: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard?bulan=${b}&tahun=${t}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Gagal memuat data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(periode.bulan, periode.tahun);
  }, [fetchData, periode]);

  const handlePeriodeChange = (b: number, t: number) => {
    setPeriode({ bulan: b, tahun: t });
    router.replace(`/dashboard?bulan=${b}&tahun=${t}`, { scroll: false });
  };

  const totalPelanggan = data?.totalPelangganAktif ?? 0;
  const progressPersen = totalPelanggan > 0
    ? Math.round(((data?.jumlahLunas ?? 0) / totalPelanggan) * 100)
    : 0;

  const isSekarang = periode.bulan === now.bulan && periode.tahun === now.tahun;

  const headerRight = (
    <div className="flex items-center gap-2">
      {/* PeriodeNav — desktop only di header */}
      <div className="hidden lg:block">
        <PeriodeNav bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
      </div>
      <button
        onClick={() => fetchData(periode.bulan, periode.tahun)}
        disabled={loading}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15 lg:bg-slate-100 text-white lg:text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
        aria-label="Perbarui"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  return (
    <AppShell
      pageTitle="Dashboard"
      pageSubtitle={formatBulanTahun(periode.bulan, periode.tahun)}
      headerRight={headerRight}
    >
      {/* Mobile: sub-bar periode nav */}
      <div className="lg:hidden bg-brand-700 px-3 pb-3 flex items-center justify-between">
        <PeriodeNav bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
        {!isSekarang && (
          <button
            onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
            className="text-xs text-brand-200 underline font-semibold"
          >
            Bulan ini
          </button>
        )}
      </div>

      {/* Banner bulan lampau — desktop only */}
      {!isSekarang && (
        <div className="hidden lg:flex mx-4 lg:mx-8 mt-4 bg-warning-50 border border-warning-200 rounded-2xl px-4 py-3 items-center gap-3">
          <span className="text-warning-600 text-lg">📅</span>
          <div>
            <p className="text-sm font-semibold text-warning-700">
              Melihat data {formatBulanTahun(periode.bulan, periode.tahun)}
            </p>
            <p className="text-xs text-warning-600">
              Ini adalah data historis, bukan bulan berjalan.{" "}
              <button
                onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
                className="underline font-semibold"
              >
                Kembali ke bulan ini
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 space-y-5">
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 text-danger-700 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchData(periode.bulan, periode.tahun)} className="underline ml-4 font-semibold">
              Coba lagi
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonBalanceCard tall />
              <SkeletonBalanceCard />
              <SkeletonBalanceCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SkeletonBalanceCard tall />
              <SkeletonBalanceCard />
            </div>
          </div>
        ) : data ? (
          <>
            {/* ── Row 1: 3 balance cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total perkiraan */}
              <div className="balance-card shadow-card-md">
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-4 -bottom-10 w-24 h-24 rounded-full bg-white/8 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-brand-200" />
                    <p className="text-brand-200 text-xs font-semibold uppercase tracking-wider">
                      Perkiraan Pemasukan
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatRupiah(data.totalPerkiraanPemasukan)}
                  </p>
                  <p className="text-brand-200 text-sm mt-2">
                    {data.totalPelangganAktif} pelanggan aktif ·{" "}
                    {formatBulanTahun(data.bulan, data.tahun)}
                  </p>
                </div>
              </div>

              {/* Sudah masuk */}
              <div className="bg-success-600 rounded-2xl p-5 shadow-card relative overflow-hidden">
                <div className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-success-100" />
                    <p className="text-success-100 text-xs font-semibold uppercase tracking-wider">Sudah Masuk</p>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {formatRupiah(data.totalSudahMasuk)}
                  </p>
                  <p className="text-success-100 text-sm mt-2">
                    dari {data.jumlahLunas} pelanggan lunas
                  </p>
                </div>
              </div>

              {/* Belum masuk */}
              <div className="bg-danger-600 rounded-2xl p-5 shadow-card relative overflow-hidden">
                <div className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-danger-100" />
                    <p className="text-danger-100 text-xs font-semibold uppercase tracking-wider">Belum Masuk</p>
                  </div>
                  <p className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {formatRupiah(data.totalBelumMasuk)}
                  </p>
                  <p className="text-danger-100 text-sm mt-2">
                    {data.jumlahBelumBayar} belum bayar · {data.jumlahIsolir} isolir
                  </p>
                </div>
              </div>
            </div>

            {/* ── Row 2: Progress + Quick actions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Progress card */}
              <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-card lg:col-span-2">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-base">Status Pembayaran Pelanggan</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {formatBulanTahun(data.bulan, data.tahun)} · {data.totalPelangganAktif} pelanggan aktif
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold text-brand-600">{progressPersen}%</p>
                    <p className="text-xs text-slate-400">sudah lunas</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
                    style={{ width: `${progressPersen}%` }}
                  />
                </div>

                {/* 3 status tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => router.push(`/pelanggan?bulan=${data.bulan}&tahun=${data.tahun}&filter=lunas`)}
                    className="bg-success-50 rounded-xl p-3 lg:p-4 text-center hover:bg-success-100 transition-colors"
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-success-600">{data.jumlahLunas}</p>
                    <p className="text-xs text-success-700 font-semibold mt-1 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Lunas
                    </p>
                  </button>

                  <button
                    onClick={() => router.push(`/pelanggan?bulan=${data.bulan}&tahun=${data.tahun}&filter=belum_bayar`)}
                    className="bg-danger-50 rounded-xl p-3 lg:p-4 text-center hover:bg-danger-100 transition-colors"
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-danger-600">{data.jumlahBelumBayar}</p>
                    <p className="text-xs text-danger-700 font-semibold mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Belum Bayar
                    </p>
                  </button>

                  <button
                    onClick={() => router.push(`/pelanggan?bulan=${data.bulan}&tahun=${data.tahun}&filter=isolir`)}
                    className="bg-slate-100 rounded-xl p-3 lg:p-4 text-center hover:bg-slate-200 transition-colors"
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-slate-600">{data.jumlahIsolir}</p>
                    <p className="text-xs text-slate-600 font-semibold mt-1 flex items-center justify-center gap-1">
                      <WifiOff className="w-3 h-3" /> Isolir
                    </p>
                  </button>
                </div>
              </div>

              {/* Quick action cards */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data.bulan}&tahun=${data.tahun}&filter=belum_bayar`)}
                  className="flex-1 bg-white border-2 border-danger-200 rounded-2xl p-4 flex flex-col justify-between hover:border-danger-400 hover:shadow-card-md active:bg-danger-50 transition-all text-left shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{data.jumlahBelumBayar + data.jumlahIsolir} perlu tindakan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Belum bayar + isolir →</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data.bulan}&tahun=${data.tahun}`)}
                  className="bg-white border-2 border-brand-100 rounded-2xl p-4 flex flex-col justify-between hover:border-brand-300 hover:shadow-card-md transition-all text-left shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Semua Pelanggan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Lihat &amp; kelola data →</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
