"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, X, Wifi, Users, CheckCircle2, Clock, WifiOff,
  ChevronLeft, ChevronRight, Calendar, Filter,
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
  if (s === "LUNAS")  return "Lunas";
  if (s === "ISOLIR") return "Isolir";
  return "Belum Bayar";
}

// ── Periode Chip ──────────────────────────────────────────────────────────────
function PeriodeChip({ bulan, tahun, onChange }: {
  bulan: number; tahun: number; onChange: (b: number, t: number) => void;
}) {
  const now       = getBulanTahunSekarang();
  const nextMonth = geserBulan(now.bulan, now.tahun, 1);
  const isMaxFuture = tahun > nextMonth.tahun ||
    (tahun === nextMonth.tahun && bulan >= nextMonth.bulan);

  return (
    <div className="flex items-center gap-1 bg-white/15 rounded-xl px-1.5 py-1 shrink-0">
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, -1); onChange(p.bulan, p.tahun); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-colors"
        aria-label="Bulan sebelumnya"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs font-semibold text-white min-w-[100px] text-center select-none">
        {formatBulanTahun(bulan, tahun)}
      </span>
      <button
        onClick={() => { const p = geserBulan(bulan, tahun, 1); onChange(p.bulan, p.tahun); }}
        disabled={isMaxFuture}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-30"
        aria-label="Bulan berikutnya"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Card Pelanggan ────────────────────────────────────────────────────────────
function PelangganCard({ pelanggan, onClick }: {
  pelanggan: PelangganListItem; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 flex items-start gap-3 transition-all text-left active:scale-[0.98]"
      style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(8px)" }}
    >
      {pelanggan.nomorUrut && (
        <span className="text-xs font-bold text-slate-400 w-7 shrink-0 pt-0.5 text-right">
          {pelanggan.nomorUrut}.
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <p className="font-semibold truncate text-sm text-slate-800">{pelanggan.nama}</p>
          <Badge variant={statusVariant(pelanggan.statusBulanIni)} className="shrink-0 text-xs">
            {statusLabel(pelanggan.statusBulanIni)}
          </Badge>
        </div>
        {pelanggan.alamat && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{pelanggan.alamat}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Wifi className="w-3 h-3" />
            {pelanggan.paket.namaPaket} · {formatRupiah(pelanggan.paket.harga)}
          </span>
          {pelanggan.tanggalJatuhTempo && (
            <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
              Jatuh tempo tgl {pelanggan.tanggalJatuhTempo}
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
    <div className="rounded-2xl p-4 flex gap-3 animate-pulse" style={{ background: "rgba(255,255,255,0.25)" }}>
      <div className="w-7 h-4 bg-white/40 rounded shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <div className="h-4 bg-white/40 rounded w-36" />
          <div className="h-5 bg-white/40 rounded-full w-20" />
        </div>
        <div className="h-3 bg-white/30 rounded w-24" />
        <div className="h-3 bg-white/30 rounded w-40" />
      </div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
function PelangganListContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [periode, setPeriode] = useState(() =>
    parsePeriodeQuery(searchParams.get("bulan"), searchParams.get("tahun"))
  );
  const [list, setList]             = useState<PelangganListItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<FilterType>(
    (searchParams.get("filter") as FilterType) ?? "semua"
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [tanggalBayar, setTanggalBayar]     = useState(""); // YYYY-MM-DD
  const [jatuhTempo, setJatuhTempo]         = useState(""); // "1"-"31"
  const LIMIT = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(async (targetPage = page) => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams({
        bulan: String(periode.bulan),
        tahun: String(periode.tahun),
        filter,
        page: String(targetPage),
        limit: String(LIMIT),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(tanggalBayar    ? { tanggalBayar }            : {}),
        ...(jatuhTempo      ? { jatuhTempo }              : {}),
      });
      const res  = await fetch(`/api/pelanggan?${p}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setList(json.data ?? []);
      setPagination(json.pagination ?? { total: 0, totalPages: 1 });
    } catch {
      setError("Gagal memuat data. Coba lagi.");
    } finally { setLoading(false); }
  }, [periode, filter, debouncedSearch, tanggalBayar, jatuhTempo, page, LIMIT]);

  useEffect(() => { fetchList(page); }, [fetchList, page]);
  useEffect(() => { setPage(1); }, [periode, filter, debouncedSearch, tanggalBayar, jatuhTempo]);

  const handlePeriodeChange = (b: number, t: number) => {
    setPeriode({ bulan: b, tahun: t });
    router.replace(`/pelanggan?bulan=${b}&tahun=${t}&filter=${filter}`, { scroll: false });
  };

  const now        = getBulanTahunSekarang();
  const isSekarang = periode.bulan === now.bulan && periode.tahun === now.tahun;

  // Hitung badge filter aktif
  const activeFilters = [
    filter !== "semua",
    tanggalBayar !== "",
    jatuhTempo   !== "",
  ].filter(Boolean).length;

  const headerRight = (
    <div className="flex items-center gap-2">
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
      <div className="flex flex-col h-full min-h-[calc(100vh-73px)]">

        {/* ── Mobile: periode chip ── */}
        <div className="lg:hidden flex items-center justify-between px-3 pt-3 pb-1">
          <PeriodeChip bulan={periode.bulan} tahun={periode.tahun} onChange={handlePeriodeChange} />
          {!isSekarang && (
            <button onClick={() => handlePeriodeChange(now.bulan, now.tahun)} className="text-xs text-white/80 font-semibold underline">
              Bulan ini
            </button>
          )}
        </div>

        {/* ── Filter bar — 1 baris horizontal di desktop, kolom di mobile ── */}
        <div className="px-3 pt-3 pb-2 space-y-2 lg:space-y-0 lg:flex lg:items-center lg:gap-3 lg:pt-4 lg:pb-3 lg:border-b lg:border-white/10">

          {/* Search */}
          <div className="relative lg:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Cari nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/30 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-shadow"
              style={{ background: "rgba(255,255,255,0.9)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Filter tanggal bayar */}
          <div className="relative lg:w-52">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="date"
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/30 pl-10 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-300 transition-shadow appearance-none"
              style={{ background: "rgba(255,255,255,0.9)" }}
            />
            {!tanggalBayar && (
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                Tgl bayar...
              </span>
            )}
            {tanggalBayar && (
              <button onClick={() => setTanggalBayar("")} className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Filter jatuh tempo */}
          <div className="relative lg:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/30 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 transition-shadow appearance-none"
              style={{ background: "rgba(255,255,255,0.9)", color: jatuhTempo ? "#1e293b" : "#94a3b8" }}
            >
              <option value="">Jatuh tempo...</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((tgl) => (
                <option key={tgl} value={String(tgl)} style={{ color: "#1e293b" }}>Tgl {tgl}</option>
              ))}
            </select>
            {jatuhTempo && (
              <button onClick={() => setJatuhTempo("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* ── Status chips + info ── */}
        <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`h-9 px-3 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filter === opt.value ? "bg-brand-600 text-white shadow-sm" : "text-slate-700 border border-white/30 hover:bg-white/60"
              }`}
              style={filter !== opt.value ? { background: "rgba(255,255,255,0.75)" } : {}}
            >
              {opt.icon} {opt.label}
            </button>
          ))}

          {/* Badge filter aktif */}
          {tanggalBayar && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-600 text-white font-medium px-2.5 py-1.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {new Date(tanggalBayar).getDate()} {new Date(tanggalBayar).toLocaleDateString("id-ID", { month: "short" })}
              <button onClick={() => setTanggalBayar("")} className="ml-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}
          {jatuhTempo && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-600 text-white font-medium px-2.5 py-1.5 rounded-full">
              <Filter className="w-3 h-3" />
              Jatuh tgl {jatuhTempo}
              <button onClick={() => setJatuhTempo("")} className="ml-0.5"><X className="w-3 h-3" /></button>
            </span>
          )}

          {/* Jumlah hasil */}
          {!loading && (
            <span className="text-xs text-white/70 font-medium ml-auto">
              {pagination.total} pelanggan
              {pagination.totalPages > 1 && ` · hal. ${page}/${pagination.totalPages}`}
            </span>
          )}
        </div>

        {/* ── Grid card pelanggan ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-24 lg:pb-6 scrollbar-none">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 py-1">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
              : list.length === 0
                ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                      <Users className="w-8 h-8 text-white/60" />
                    </div>
                    <p className="text-white/80 font-medium text-sm">
                      {search ? "Tidak ada pelanggan yang cocok" : "Tidak ada data untuk filter ini"}
                    </p>
                    {!search && filter === "semua" && !tanggalBayar && !jatuhTempo && (
                      <button
                        onClick={() => router.push("/pelanggan/tambah")}
                        className="mt-4 px-5 py-2.5 bg-white text-brand-700 rounded-xl text-sm font-semibold hover:bg-white/90"
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
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 text-danger-700 text-sm text-center mx-1 mb-2">
              {error}
              <button onClick={() => fetchList(page)} className="ml-2 underline font-medium">Coba lagi</button>
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="px-1 pt-2 pb-2">
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.82)" }}>
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
    </AppShell>
  );
}
export default function PelangganPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PelangganListContent />
    </Suspense>
  );
}
