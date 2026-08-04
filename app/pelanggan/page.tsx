"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, X, Wifi, Users, CheckCircle2, Clock, WifiOff,
  ChevronLeft, ChevronRight, Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import {
  formatRupiah, formatBulanTahun, getBulanTahunSekarang,
  geserBulan, parsePeriodeQuery,
} from "@/lib/utils";
import type { PelangganListItem, StatusTagihan } from "@/lib/types";

type FilterType = "semua" | "belum_bayar" | "lunas" | "isolir";

const FILTER_OPTIONS: { label: string; value: FilterType; icon: React.ReactNode }[] = [
  { label: "Semua",       value: "semua",       icon: <Users className="w-3.5 h-3.5" /> },
  { label: "Belum Bayar", value: "belum_bayar", icon: <Clock className="w-3.5 h-3.5" /> },
  { label: "Lunas",       value: "lunas",       icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { label: "Isolir",      value: "isolir",      icon: <WifiOff className="w-3.5 h-3.5" /> },
];

function statusVariant(s: StatusTagihan): "lunas" | "belumBayar" | "isolir" | "default" {
  if (s === "LUNAS")       return "lunas";
  if (s === "ISOLIR")      return "isolir";
  if (s === "BELUM_BAYAR") return "belumBayar";
  return "default";
}
function statusLabel(s: StatusTagihan) {
  if (s === "LUNAS")       return "Lunas";
  if (s === "ISOLIR")      return "Isolir";
  return "Belum Bayar";
}

// ── Periode Chip ─────────────────────────────────────────────────────────────
function PeriodeChip({
  bulan, tahun, onChange,
}: {
  bulan: number; tahun: number; onChange: (b: number, t: number) => void;
}) {
  const now = getBulanTahunSekarang();
  // Batasi maks 1 bulan ke depan dari sekarang
  const nextMonth = geserBulan(now.bulan, now.tahun, 1);
  const isMaxFuture = tahun > nextMonth.tahun ||
    (tahun === nextMonth.tahun && bulan >= nextMonth.bulan);

  return (
    <div className="flex items-center gap-1 bg-slate-200 rounded-xl px-1.5 py-1 shrink-0">
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, -1); onChange(p.bulan, p.tahun); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-300 active:bg-slate-400 transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs font-semibold text-slate-700 min-w-[100px] text-center select-none">
        {formatBulanTahun(bulan, tahun)}
      </span>
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, 1); onChange(p.bulan, p.tahun); }}
        disabled={isMaxFuture}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-300 active:bg-slate-400 transition-colors disabled:opacity-30"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PelangganCard({
  pelanggan, active, onClick,
}: {
  pelanggan: PelangganListItem; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl p-4 flex items-start gap-3 transition-all text-left
        ${active
          ? "bg-brand-50 border-2 border-brand-300 shadow-card"
          : "bg-white shadow-card hover:shadow-card-md border-2 border-transparent active:scale-[0.98]"
        }`}
    >
      {/* Nomor urut */}
      {pelanggan.nomorUrut && (
        <span className="text-xs font-bold text-slate-400 w-7 shrink-0 pt-0.5 text-right">
          {pelanggan.nomorUrut}.
        </span>
      )}

      <div className="flex-1 min-w-0">
        {/* Baris 1: Nama + Badge */}
        <div className="flex items-center gap-2 justify-between">
          <p className={`font-semibold truncate text-sm ${active ? "text-brand-800" : "text-slate-800"}`}>
            {pelanggan.nama}
          </p>
          <Badge variant={statusVariant(pelanggan.statusBulanIni)} className="shrink-0 text-xs">
            {statusLabel(pelanggan.statusBulanIni)}
          </Badge>
        </div>

        {/* Baris 2: Alamat */}
        {pelanggan.alamat && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{pelanggan.alamat}</p>
        )}

        {/* Baris 3: Paket + Blok Area */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Wifi className="w-3 h-3" />
            {pelanggan.paket.namaPaket} · {formatRupiah(pelanggan.paket.harga)}
          </span>
          {pelanggan.blokArea && (
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2 truncate">
              {pelanggan.blokArea}
            </span>
          )}
          {pelanggan.statusBulanIni === "LUNAS" && pelanggan.nominalBayarBulanIni !== null && (
            <span className="text-xs font-semibold text-success-600 ml-auto">
              Bayar: {formatRupiah(pelanggan.nominalBayarBulanIni)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
      <div className="w-7 h-4 bg-slate-200 rounded shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-5 bg-slate-200 rounded-full w-20" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="h-3 bg-slate-200 rounded w-40" />
      </div>
    </div>
  );
}

function PelangganListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [periode, setPeriode] = useState(() =>
    parsePeriodeQuery(searchParams.get("bulan"), searchParams.get("tahun"))
  );
  const [list, setList] = useState<PelangganListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) ?? "semua"
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [tanggalBayar, setTanggalBayar] = useState(""); // "" = semua, "1"-"31" = filter tanggal
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({
        bulan: String(periode.bulan),
        tahun: String(periode.tahun),
        filter,
        page: String(targetPage),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(tanggalBayar    ? { tanggalBayar }            : {}),
      });
      const res = await fetch(`/api/pelanggan?${p}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setList(json.data ?? []);
      setPagination(json.pagination ?? { total: 0, totalPages: 1 });
    } catch {
      setError("Gagal memuat data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [periode, filter, debouncedSearch, tanggalBayar, page, LIMIT]);

  useEffect(() => { fetchList(page); }, [fetchList, page]);

  // Reset ke halaman 1 saat filter/search/periode/tanggal berubah
  useEffect(() => { setPage(1); }, [periode, filter, debouncedSearch, tanggalBayar]);

  const handlePeriodeChange = (b: number, t: number) => {
    setPeriode({ bulan: b, tahun: t });
    router.replace(`/pelanggan?bulan=${b}&tahun=${t}&filter=${filter}`, { scroll: false });
  };

  const now = getBulanTahunSekarang();
  const isSekarang = periode.bulan === now.bulan && periode.tahun === now.tahun;

  const headerRight = (
    <div className="flex items-center gap-2">
      {/* Periode chip — desktop only di header, mobile pakai sub-bar di dalam list */}
      <div className="hidden lg:block">
        <PeriodeChip bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
      </div>
      <button
        onClick={() => router.push("/pelanggan/tambah")}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 lg:bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Tambah</span>
      </button>
    </div>
  );

  return (
    <AppShell
      pageTitle="Data Pelanggan"
      pageSubtitle={formatBulanTahun(periode.bulan, periode.tahun)}
      headerRight={headerRight}
    >
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        {/* List panel — full width di semua ukuran */}
        <div className="flex flex-col w-full lg:h-[calc(100vh-73px)] lg:overflow-hidden">

          {/* Mobile: periode chip — tampil di dalam list, bukan di header */}
          <div className="lg:hidden flex items-center justify-between px-3 pt-3 pb-1">
            <PeriodeChip bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
            {!isSekarang && (
              <button
                onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
                className="text-xs text-brand-600 font-semibold underline"
              >
                Bulan ini
              </button>
            )}
          </div>

          {/* Banner bulan lampau — desktop only */}
          {!isSekarang && (
            <div className="hidden lg:flex mx-3 mt-3 bg-warning-50 border border-warning-200 rounded-xl px-3 py-2 items-center justify-between text-xs">
              <span className="text-warning-700 font-semibold">
                📅 Data {formatBulanTahun(periode.bulan, periode.tahun)}
              </span>
              <button
                onClick={() => handlePeriodeChange(now.bulan, now.tahun)}
                className="text-warning-700 underline font-semibold ml-2"
              >
                Bulan ini
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Cari nama pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 bg-white rounded-xl border border-slate-200 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tanggal bayar */}
          <div className="px-3 pb-2">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  placeholder="Filter tanggal bayar (1–31)..."
                  value={tanggalBayar}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Hanya izinkan 1-31
                    if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                      setTanggalBayar(val);
                    }
                  }}
                  className="w-full h-11 bg-white rounded-xl border border-slate-200 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-shadow"
                />
                {tanggalBayar && (
                  <button
                    onClick={() => setTanggalBayar("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
            {tanggalBayar && (
              <p className="text-xs text-brand-600 font-medium mt-1 px-1">
                Menampilkan pelanggan yang bayar tanggal {tanggalBayar}
              </p>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 px-3 pb-2 overflow-x-auto scrollbar-none">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex-shrink-0 h-9 px-3 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5
                  ${filter === opt.value
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Jumlah hasil */}
          {!loading && (
            <p className="text-xs text-slate-400 font-medium px-4 pb-1">
              {pagination.total} pelanggan
              {filter !== "semua" && ` · ${FILTER_OPTIONS.find(o => o.value === filter)?.label}`}
              {pagination.totalPages > 1 && ` · hal. ${page}/${pagination.totalPages}`}
            </p>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-4 scrollbar-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 py-2">
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
                : list.length === 0
                  ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">
                        {search ? "Tidak ada pelanggan yang cocok" : "Tidak ada data untuk filter ini"}
                      </p>
                      {!search && filter === "semua" && (
                        <button
                          onClick={() => router.push("/pelanggan/tambah")}
                          className="mt-4 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700"
                        >
                          + Tambah Pelanggan
                        </button>
                      )}
                    </div>
                  )
                  : list.map((p) => (
                    <PelangganCard
                      key={p.id}
                      pelanggan={p}
                      onClick={() => router.push(`/pelanggan/${p.id}?bulan=${periode.bulan}&tahun=${periode.tahun}`)}
                    />
                  ))
              }
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 text-danger-700 text-sm text-center mx-1">
                {error}
                <button onClick={() => fetchList(page)} className="ml-2 underline font-medium">Coba lagi</button>
              </div>
            )}

            {/* Pagination controls */}
            {!loading && pagination.totalPages > 1 && (
              <div className="px-1 pt-2 pb-2">
                <div className="flex items-center justify-between bg-white rounded-2xl shadow-card px-4 py-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">{page} / {pagination.totalPages}</p>
                    <p className="text-xs text-slate-400">{pagination.total} pelanggan</p>
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile FAB */}
          <div className="lg:hidden fixed bottom-6 right-4 z-20">
            <button
              onClick={() => router.push("/pelanggan/tambah")}
              className="flex items-center gap-2 bg-brand-600 text-white px-5 py-3.5 rounded-2xl shadow-card-md text-sm font-semibold active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" /> Tambah
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function PelangganPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    }>
      <PelangganListContent />
    </Suspense>
  );
}
