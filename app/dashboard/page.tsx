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
import type { DashboardData, PelangganListItem } from "@/lib/types";

/* ── Skeleton Card ── */
function SkeletonCard({ h = "h-32" }: { h?: string }) {
  return <div className={`rounded-xl bg-white/20 animate-pulse ${h}`} />;
}

/* ── Skeleton Tabel — shimmer transparan seperti SkeletonCard lainnya ── */
function SkeletonTabel({ warna }: { warna: "merah" | "hijau" }) {
  const line = warna === "merah" ? "bg-red-300/40" : "bg-green-300/40";

  return (
    <div className="rounded-xl bg-white/20 animate-pulse p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className={`h-5 ${line} rounded w-36`} />
        <div className={`h-5 ${line} rounded w-16`} />
      </div>
      {/* Kolom header */}
      <div className="flex gap-4 pb-3 mb-2 border-b border-white/10">
        <div className={`h-3 ${line} rounded w-16`} />
        <div className={`h-3 ${line} rounded w-16`} />
        <div className={`h-3 ${line} rounded w-10 ml-auto`} />
      </div>
      {/* 5 baris */}
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
    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1 py-1">
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, -1); onChange(p.bulan, p.tahun); }}
        className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="px-3 font-medium text-gray-700 text-sm min-w-[120px] text-center select-none">
        {formatBulanTahun(bulan, tahun)}
      </span>
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, 1); onChange(p.bulan, p.tahun); }}
        className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Tabel Belum Bayar ── */
function TabelBelumBayar({ bulan, tahun, refreshKey, isLoading }: { bulan: number; tahun: number; refreshKey: number; isLoading: boolean }) {
  const router = useRouter();
  const [list, setList] = useState<PelangganListItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=belum_bayar&limit=5&page=1`);
        const json = await res.json();
        setList(json.data ?? []);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    fetch_();
  }, [bulan, tahun, refreshKey]);

  if (isLoading || fetching) return <SkeletonTabel warna="merah" />;

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Daftar Belum Bayar</h3>
        <span className="text-xs font-medium text-accent-red bg-accent-red-light px-2 py-1 rounded">
          Terbaru
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-3">Nama</th>
              <th className="pb-3">Tagihan</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">
                  Semua pelanggan sudah bayar 🎉
                </td>
              </tr>
            ) : list.map((p) => (
              <tr key={p.id} className="text-sm hover:bg-accent-red-light/20 transition-colors">
                <td className="py-3 font-medium text-gray-700">{p.nama}</td>
                <td className="py-3 text-gray-600">{formatRupiah(p.paket.harga)}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => router.push(`/pelanggan/${p.id}?bulan=${bulan}&tahun=${tahun}`)}
                    className="text-brand font-medium hover:underline text-sm"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tabel Sudah Bayar ── */
function TabelSudahBayar({ bulan, tahun, refreshKey, isLoading }: { bulan: number; tahun: number; refreshKey: number; isLoading: boolean }) {
  const router = useRouter();
  const [list, setList] = useState<PelangganListItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/pelanggan?bulan=${bulan}&tahun=${tahun}&filter=lunas&limit=5&page=1`);
        const json = await res.json();
        setList(json.data ?? []);
      } catch { /* silent */ }
      finally { setFetching(false); }
    };
    fetch_();
  }, [bulan, tahun, refreshKey]);

  if (isLoading || fetching) return <SkeletonTabel warna="hijau" />;

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Daftar Sudah Bayar</h3>
        <span className="text-xs font-medium text-accent-green bg-accent-green-light px-2 py-1 rounded">
          Terverifikasi
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="pb-3">Nama</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">
                  Belum ada yang lunas bulan ini
                </td>
              </tr>
            ) : list.map((p) => (
              <tr key={p.id} className="text-sm hover:bg-accent-green-light/30 transition-colors">
                <td className="py-3 font-medium text-gray-700">{p.nama}</td>
                <td className="py-3">
                  <span className="text-accent-green font-medium">Lunas</span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => router.push(`/pelanggan/${p.id}?bulan=${bulan}&tahun=${tahun}`)}
                    className="text-brand font-medium hover:underline text-sm"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

  /* Header right: periode nav + refresh — persis referensi */
  const headerRight = (
    <div className="flex items-center gap-3">
      <PeriodeNav bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
      <button
        onClick={() => fetchData(periode.bulan, periode.tahun)}
        disabled={loading}
        className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
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
      {/* Dashboard content area — padding sesuai referensi */}
      <div className="p-4 lg:p-8 flex-1 overflow-y-auto space-y-6">

        {/* Banner bulan lampau */}
        {!isSekarang && (
          <div className="glass-card px-5 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              📅 Melihat data historis — {formatBulanTahun(periode.bulan, periode.tahun)}
            </p>
            <button
              onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
              className="text-sm text-brand font-semibold hover:underline ml-4"
            >
              Bulan ini
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card px-5 py-4 text-red-600 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchData(periode.bulan, periode.tahun)} className="underline ml-4">Coba lagi</button>
          </div>
        )}

        {/* ── Row 1: 3 metric cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Perkiraan Pemasukan — brand gradient */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="balance-card shadow-card-xl">
              <div className="flex items-center gap-2 text-blue-200 mb-2 font-medium text-sm">
                <TrendingUp className="w-4 h-4" />
                <span className="uppercase tracking-wide">Perkiraan Pemasukan</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                {formatRupiah(data?.totalPerkiraanPemasukan ?? 0)}
              </div>
              <div className="text-blue-100 text-sm">
                {data?.totalPelangganAktif ?? 0} pelanggan · {formatBulanTahun(periode.bulan, periode.tahun)}
              </div>
            </div>
          )}

          {/* Sudah Masuk — glass card dengan accent green corner */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="glass-card p-6 relative overflow-hidden accent-corner-green">
              <div className="flex items-center gap-2 text-gray-500 mb-2 font-medium text-sm">
                <div className="w-6 h-6 rounded bg-accent-green-light text-accent-green flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="uppercase tracking-wide">Sudah Masuk</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {formatRupiah(data?.totalSudahMasuk ?? 0)}
              </div>
              <div className="text-accent-green font-medium text-sm">
                {data?.jumlahLunas ?? 0} pelanggan lunas
              </div>
            </div>
          )}

          {/* Belum Masuk — glass card dengan accent red corner */}
          {loading ? <SkeletonCard h="h-36" /> : (
            <div className="glass-card p-6 relative overflow-hidden accent-corner-red">
              <div className="flex items-center gap-2 text-gray-500 mb-2 font-medium text-sm">
                <div className="w-6 h-6 rounded bg-accent-red-light text-accent-red flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="uppercase tracking-wide">Belum Masuk</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {formatRupiah(data?.totalBelumMasuk ?? 0)}
              </div>
              <div className="text-accent-red font-medium text-sm">
                {data?.jumlahBelumBayar ?? 0} belum bayar · {data?.jumlahIsolir ?? 0} isolir
              </div>
            </div>
          )}
        </div>

        {/* ── Row 2: Status Pembayaran + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status Pembayaran — lg:col-span-2 */}
          {loading ? <SkeletonCard h="h-64" /> : (
            <div className="glass-card p-6 lg:col-span-2">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-blue-light text-accent-blue flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Status Pembayaran</h3>
                    <p className="text-sm text-gray-500">
                      {formatBulanTahun(data!.bulan, data!.tahun)} · {data!.totalPelangganAktif} aktif
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand">{progressPersen}%</div>
                  <div className="text-sm text-gray-400">sudah lunas</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{ width: `${progressPersen}%`, background: "#254395" }}
                />
              </div>

              {/* 3 tiles */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=lunas`)}
                  className="bg-accent-green-light/50 border border-accent-green-light rounded-xl p-4 text-center hover:bg-accent-green-light transition-colors"
                >
                  <div className="text-4xl font-bold text-accent-green-text mb-1">{data!.jumlahLunas}</div>
                  <div className="flex justify-center items-center gap-1 text-accent-green-text text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Lunas
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=belum_bayar`)}
                  className="bg-accent-red-light/50 border border-accent-red-light rounded-xl p-4 text-center hover:bg-accent-red-light transition-colors"
                >
                  <div className="text-4xl font-bold text-accent-red-text mb-1">{data!.jumlahBelumBayar}</div>
                  <div className="flex justify-center items-center gap-1 text-accent-red-text text-sm font-medium">
                    <Clock className="w-4 h-4" /> Belum Bayar
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=isolir`)}
                  className="bg-accent-gray-light border border-gray-200 rounded-xl p-4 text-center hover:bg-gray-200 transition-colors"
                >
                  <div className="text-4xl font-bold text-gray-700 mb-1">{data!.jumlahIsolir}</div>
                  <div className="flex justify-center items-center gap-1 text-gray-500 text-sm font-medium">
                    <WifiOff className="w-4 h-4" /> Isolir
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col gap-6">
            {loading ? (
              <><SkeletonCard h="h-28" /><SkeletonCard h="h-28" /></>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}&filter=belum_bayar`)}
                  className="glass-card p-6 flex flex-col justify-between hover:shadow-card-xl transition-shadow cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded bg-accent-red-light text-accent-red flex items-center justify-center mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                      {(data!.jumlahBelumBayar + data!.jumlahIsolir)} perlu tindakan
                    </h4>
                    <p className="text-sm text-gray-400">Belum bayar + isolir →</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push(`/pelanggan?bulan=${data!.bulan}&tahun=${data!.tahun}`)}
                  className="glass-card p-6 flex flex-col justify-between hover:shadow-card-xl transition-shadow cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded bg-accent-blue-light text-accent-blue flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">Semua Pelanggan</h4>
                    <p className="text-sm text-gray-400">Lihat &amp; kelola data →</p>
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
