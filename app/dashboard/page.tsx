"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
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
import type { DashboardData, PelangganListItem } from "@/lib/types";

/* ── Shared style ── */
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "1rem",
};

/* ── Skeleton Card ── */
function SkeletonCard({ h = "h-32" }: { h?: string }) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${h}`}
      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
    />
  );
}

/* ── Skeleton Tabel ── */
function SkeletonTabel({ warna }: { warna: "merah" | "hijau" }) {
  const line = warna === "merah" ? "bg-yellow-100/20" : "bg-green-400/20";
  return (
    <div className="rounded-2xl animate-pulse p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <div className="flex justify-between items-center mb-5">
        <div className={`h-5 ${line} rounded w-36`} />
        <div className={`h-5 ${line} rounded w-16`} />
      </div>
      <div className="flex gap-4 pb-3 mb-2 border-b border-white/10">
        <div className={`h-3 ${line} rounded w-16`} />
        <div className={`h-3 ${line} rounded w-16`} />
        <div className={`h-3 ${line} rounded w-10 ml-auto`} />
      </div>
      {[45, 38, 52, 42, 48].map((w, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0">
          <div className={`h-3.5 ${line} rounded`} style={{ width: `${w}%` }} />
          <div className={`h-3.5 ${line} rounded w-20`} />
          <div className={`h-3.5 ${line} rounded w-10 ml-auto`} />
        </div>
      ))}
    </div>
  );
}

/* ── Periode Nav: sesuai referensi (bg-gray-50 border) ── */
function PeriodeNav({
  bulan, tahun, onChange,
}: {
  bulan: number; tahun: number; onChange: (b: number, t: number) => void;
}) {
  return (
    <div className="flex items-center bg-white/10 border border-white/20 rounded-lg px-1 py-1">
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, -1); onChange(p.bulan, p.tahun); }}
        className="p-2 text-white/70 hover:text-white rounded transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="px-3 font-medium text-white text-sm min-w-[120px] text-center select-none">
        {formatBulanTahun(bulan, tahun)}
      </span>
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, 1); onChange(p.bulan, p.tahun); }}
        className="p-2 text-white/70 hover:text-white rounded transition-colors"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Tabel Belum Bayar ≥ 3 Hari ── */
function TabelBelumBayar({ bulan, tahun, refreshKey, isLoading }: { bulan: number; tahun: number; refreshKey: number; isLoading: boolean }) {
  const router = useRouter();
  const [list, setList] = useState<PelangganListItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=belum_bayar_3hari&limit=5&page=1`);
        const json = await res.json();
        setList(json.data ?? []);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    fetch_();
  }, [bulan, tahun, refreshKey]);

  if (isLoading || fetching) return <SkeletonTabel warna="merah" />;

  return (
  <div className="rounded-2xl overflow-hidden" style={glassCard}>
    <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-white/10">
      <div>
        <h3 className="text-base font-bold text-white">Menunggak ≥ 3 Hari</h3>
        <p className="text-xs text-blue-200/50 mt-0.5">Belum bayar sejak jatuh tempo</p>
      </div>
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
        style={{ background: "rgba(251,144,50,0.2)", color: "#FFB870" }}
      >
        {list.length} pelanggan
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs font-semibold text-blue-200/40 uppercase tracking-wider border-b border-white/8">
            <th className="px-6 py-3">Nama</th>
            <th className="px-6 py-3">Tagihan</th>
            <th className="px-6 py-3">Jatuh Tempo</th>
            <th className="px-6 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-blue-200/40 text-sm">
                Tidak ada yang menunggak ≥ 3 hari 🎉
              </td>
            </tr>
          ) : list.map((p) => (
            <tr
              key={p.id}
              className="border-b border-white/5 last:border-0 transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,144,50,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td className="px-6 py-3 font-medium text-white text-sm">{p.nama}</td>
              <td className="px-6 py-3 text-blue-100/70 text-sm">{formatRupiah(p.paket.harga)}</td>
              <td className="px-6 py-3 text-sm">
                <span className="font-semibold" style={{ color: "#FFB870" }}>Tgl {p.tanggalJatuhTempo}</span>
              </td>
              <td className="px-6 py-3 text-right">
                <button
                  onClick={() => router.push(`/pelanggan/${p.id}?bulan=${bulan}&tahun=${tahun}`)}
                  className="text-sm font-semibold text-blue-300 hover:text-white transition-colors"
                >
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-6 py-3 border-t border-white/10">
      <button
        onClick={() => router.push(`/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=belum_bayar`)}
        className="w-full text-center text-sm font-semibold text-blue-300 hover:text-white transition-colors py-1"
      >
        Lihat semua belum bayar →
      </button>
    </div>
  </div>
);
}

/* ── Tabel Bayar Hari Ini ── */
function TabelSudahBayar({ bulan, tahun, refreshKey, isLoading }: { bulan: number; tahun: number; refreshKey: number; isLoading: boolean }) {
  const router = useRouter();
  const [list, setList] = useState<PelangganListItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=bayar_hari_ini&limit=5&page=1`);
        const json = await res.json();
        setList(json.data ?? []);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    fetch_();
  }, [bulan, tahun, refreshKey]);

  if (isLoading || fetching) return <SkeletonTabel warna="hijau" />;

  return (
    <div className="rounded-2xl overflow-hidden" style={glassCard}>
      <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white">Bayar Hari Ini</h3>
          <p className="text-xs text-blue-200/50 mt-0.5">Pembayaran masuk hari ini</p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: "rgba(34,163,70,0.2)", color: "#6ee89b" }}
        >
          {list.length} pelanggan
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-blue-200/40 uppercase tracking-wider border-b border-white/8">
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Dibayar</th>
              <th className="px-6 py-3">Jam</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-blue-200/40 text-sm">
                  Belum ada pembayaran hari ini
                </td>
              </tr>
            ) : list.map((p) => {
              // jam bayar dari tanggalBayarBulanIni (ISO string)
              const jamBayar = p.tanggalBayarBulanIni
                ? new Date(p.tanggalBayarBulanIni).toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
                  })
                : "—";
              return (
                <tr
                  key={p.id}
                  className="border-b border-white/5 last:border-0 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,163,70,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-6 py-3 font-medium text-white text-sm">{p.nama}</td>
                  <td className="px-6 py-3 text-sm font-semibold" style={{ color: "#6ee89b" }}>
                    {p.nominalBayarBulanIni !== null ? formatRupiah(p.nominalBayarBulanIni) : formatRupiah(p.paket.harga)}
                  </td>
                  <td className="px-6 py-3 text-sm text-blue-100/60">{jamBayar}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => router.push(`/pelanggan/${p.id}?bulan=${bulan}&tahun=${tahun}`)}
                      className="text-sm font-semibold text-blue-300 hover:text-white transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-white/10">
        <button
          onClick={() => router.push(`/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=lunas`)}
          className="w-full text-center text-sm font-semibold text-blue-300 hover:text-white transition-colors py-1"
        >
          Lihat semua yang lunas →
        </button>
      </div>
    </div>
  );
}

/* ── Dashboard Content ── */
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
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (b: number, t: number) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/dashboard?bulan=${b}&tahun=${t}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
      setRefreshKey((k) => k + 1); // trigger re-fetch di kedua tabel
    } catch { setError("Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(periode.bulan, periode.tahun); }, [fetchData, periode]);

  const handlePeriodeChange = (b: number, t: number) => {
    setPeriode({ bulan: b, tahun: t });
    router.replace(`/dashboard?bulan=${b}&tahun=${t}`, { scroll: false });
  };

  const totalPelanggan = data?.totalPelangganAktif ?? 0;
  const progressPersen = totalPelanggan > 0
    ? Math.round(((data?.jumlahLunas ?? 0) / totalPelanggan) * 100)
    : 0;
  const isSekarang = periode.bulan === now.bulan && periode.tahun === now.tahun;

  /* Header right: hanya refresh di mobile, periode nav + refresh di desktop */
  const headerRight = (
    <div className="flex items-center gap-3">
      {/* PeriodeNav — desktop only di header */}
      <div className="hidden lg:flex">
        <PeriodeNav bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
      </div>
      <button
        onClick={() => fetchData(periode.bulan, periode.tahun)}
        disabled={loading}
        className="p-2.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
        aria-label="Perbarui"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );

  return (
    <AppShell
      pageTitle="Dashboard"
      pageSubtitle={formatBulanTahun(periode.bulan, periode.tahun)}
      headerRight={headerRight}
    >
      {/* Dashboard content area */}
      <div className="p-4 lg:p-8 flex-1 overflow-y-auto space-y-6">

        {/* Mobile: sub-bar periode nav — warna navy matching topbar */}
        <div
          className="lg:hidden -mx-4 -mt-4 px-4 py-3 flex items-center justify-between border-b border-white/10"
          style={{ background: "linear-gradient(135deg, #0B1120 0%, #11244C 60%, #1a3a7a 100%)" }}
        >
          <PeriodeNav bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
          {!isSekarang && (
            <button
              onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
              className="text-xs text-blue-200 font-semibold underline ml-2 shrink-0"
            >
              Bulan ini
            </button>
          )}
        </div>

        {/* Banner bulan lampau */}
        {!isSekarang && (
          <div
            className="px-5 py-3 rounded-2xl flex items-center justify-between"
            style={glassCard}
          >
            <p className="text-sm font-semibold text-blue-100/80">
              📅 Melihat data historis — {formatBulanTahun(periode.bulan, periode.tahun)}
            </p>
            <button
              onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
              className="text-sm text-blue-300 font-semibold hover:text-white transition-colors ml-4 shrink-0"
            >
              Bulan ini
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="px-5 py-4 rounded-2xl text-sm font-medium flex items-center justify-between"
            style={{ background: "rgba(227,51,51,0.15)", border: "1px solid rgba(227,51,51,0.3)", color: "#f88" }}
          >
            <span>{error}</span>
            <button onClick={() => fetchData(periode.bulan, periode.tahun)} className="underline ml-4">Coba lagi</button>
          </div>
        )}

        {/* ── Row 1: 3 metric cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">

          {/* Perkiraan Pemasukan — brand gradient tetap */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #254395 0%, #3354B4 100%)",
              boxShadow: "0 8px 25px -5px rgba(37,67,149,0.5)",
            }}>
              <div className="flex items-center gap-2 text-blue-200 mb-3 font-medium text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Perkiraan Pemasukan</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {formatRupiah(data?.totalPerkiraanPemasukan ?? 0)}
              </div>
              <div className="text-blue-200/70 text-sm">
                {data?.totalPelangganAktif ?? 0} pelanggan · {formatBulanTahun(periode.bulan, periode.tahun)}
              </div>
              {/* decorative circle */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            </div>
          )}

          {/* Sudah Masuk */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #1F8A44 0%, #22A346 100%)",
              boxShadow: "0 8px 25px -5px rgba(34,163,70,0.5)",
            }}>
              <div className="flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wider text-green-100">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sudah Masuk</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {formatRupiah(data?.totalSudahMasuk ?? 0)}
              </div>
              <div className="text-sm font-medium text-green-100">
                {data?.jumlahLunas ?? 0} pelanggan lunas
              </div>
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            </div>
          )}

          {/* Belum Masuk */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #D97B1F 0%, #FB9032 100%)",
              boxShadow: "0 8px 25px -5px rgba(251,144,50,0.5)",
            }}>
              <div className="flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wider text-orange-100">
                <Clock className="w-4 h-4" />
                <span>Belum Masuk</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {formatRupiah(data?.totalBelumMasuk ?? 0)}
              </div>
              <div className="text-sm font-medium text-orange-100">
                {data?.jumlahBelumBayar ?? 0} belum bayar · {data?.jumlahIsolir ?? 0} isolir
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* ── Row 2: Status Pembayaran + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* Status Pembayaran */}
          {loading ? <SkeletonCard h="h-64" /> : (
            <div className="p-5 lg:p-6 lg:col-span-2 rounded-2xl" style={glassCard}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(37,99,235,0.25)" }}
                  >
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-white">Status Pembayaran</h3>
                    <p className="text-xs lg:text-sm text-blue-200/60">
                      {formatBulanTahun(data!.bulan, data!.tahun)} · {data!.totalPelangganAktif} aktif
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:text-right sm:block">
                  <div className="text-2xl lg:text-3xl font-bold text-white">{progressPersen}%</div>
                  <div className="text-xs text-blue-200/50">sudah lunas</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full rounded-full h-2.5 mb-5 overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progressPersen}%`, background: "linear-gradient(90deg, #3b82f6, #22c55e)" }}
                />
              </div>

              {/* 3 tiles */}
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=lunas`)}
                  className="rounded-xl p-3 lg:p-4 text-center transition-all active:scale-95"
                  style={{ background: "rgba(34,163,70,0.15)", border: "1px solid rgba(34,163,70,0.25)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,163,70,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,163,70,0.15)")}
                >
                  <div className="text-2xl lg:text-4xl font-bold mb-1" style={{ color: "#6ee89b" }}>{data!.jumlahLunas}</div>
                  <div className="flex justify-center items-center gap-1 text-xs lg:text-sm font-medium" style={{ color: "#6ee89b" }}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Lunas
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=belum_bayar`)}
                  className="rounded-xl p-3 lg:p-4 text-center transition-all active:scale-95"
                  style={{ background: "rgba(251,144,50,0.12)", border: "1px solid rgba(251,144,50,0.20)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,144,50,0.22)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(251,144,50,0.12)")}
                >
                  <div className="text-2xl lg:text-4xl font-bold mb-1" style={{ color: "#FFB870" }}>{data!.jumlahBelumBayar}</div>
                  <div className="flex justify-center items-center gap-1 text-xs lg:text-sm font-medium leading-tight" style={{ color: "#FFB870" }}>
                    <Clock className="w-3 h-3 shrink-0" /><span>Belum Bayar</span>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=isolir`)}
                  className="rounded-xl p-3 lg:p-4 text-center transition-all active:scale-95"
                  style={{ background: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.25)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(107,114,128,0.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(107,114,128,0.15)")}
                >
                  <div className="text-2xl lg:text-4xl font-bold text-white/80 mb-1">{data!.jumlahIsolir}</div>
                  <div className="flex justify-center items-center gap-1 text-blue-200/60 text-xs lg:text-sm font-medium">
                    <WifiOff className="w-3 h-3 shrink-0" /> Isolir
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <><SkeletonCard h="h-32" /><SkeletonCard h="h-32" /></>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=belum_bayar`)}
                  className="rounded-2xl p-5 flex flex-col justify-between text-left transition-all active:scale-[0.98] hover:border-orange-300/30"
                  style={{ ...glassCard, background: "rgba(251,144,50,0.08)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251,144,50,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(251,144,50,0.08)")}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(251,144,50,0.20)" }}
                  >
                    <Clock className="w-5 h-5" style={{ color: "#FFB870" }} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      {(data!.jumlahBelumBayar + data!.jumlahIsolir)} perlu tindakan
                    </h4>
                    <p className="text-sm text-blue-200/50">Belum bayar + isolir →</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}`)}
                  className="rounded-2xl p-5 flex flex-col justify-between text-left transition-all active:scale-[0.98]"
                  style={glassCard}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(37,99,235,0.25)" }}
                  >
                    <Users className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Semua Pelanggan</h4>
                    <p className="text-sm text-blue-200/50">Lihat &amp; kelola data →</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Row 3: 2 tabel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TabelBelumBayar bulan={periode.bulan} tahun={periode.tahun} refreshKey={refreshKey} isLoading={loading} />
          <TabelSudahBayar bulan={periode.bulan} tahun={periode.tahun} refreshKey={refreshKey} isLoading={loading} />
        </div>

      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
