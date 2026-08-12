"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, X, Wifi, Users, CheckCircle2, Clock, WifiOff,
  ChevronLeft, ChevronRight, Calendar, Filter,
  UserPlus,
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

// ── Helpers warna per status ──────────────────────────────────────────────────
function statusCardStyle(s: StatusTagihan): {
  cardBg: string;
  border: string;
  strip: string;
  avatarBg: string;
  avatarText: string;
} {
  if (s === "LUNAS") return {
    cardBg:     "rgba(34, 163, 70, 0.15)",
    border:     "rgba(34, 163, 70, 0.30)",
    strip:      "#22A346",
    avatarBg:   "rgba(34, 163, 70, 0.25)",
    avatarText: "#6ee89b",
  };
  if (s === "BELUM_BAYAR") return {
    cardBg:     "rgba(227, 51, 51, 0.15)",
    border:     "rgba(227, 51, 51, 0.30)",
    strip:      "#E33333",
    avatarBg:   "rgba(227, 51, 51, 0.25)",
    avatarText: "#f88",
  };
  // ISOLIR
  return {
    cardBg:     "rgba(251, 130, 50, 0.57)",
    border:     "rgba(251, 144, 50, 0.84)",
    strip:      "#ff7701",
    avatarBg:   "rgba(251, 144, 50, 0.77)",
    avatarText: "#ffffff",
  };
}

// ── Card Pelanggan ────────────────────────────────────────────────────────────
function PelangganCard({ pelanggan, onClick }: {
  pelanggan: PelangganListItem; onClick: () => void;
}) {
  const cs = statusCardStyle(pelanggan.statusBulanIni);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden flex items-stretch transition-all text-left active:scale-[0.98]"
      style={{
        background:    cs.cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border:        `1px solid ${cs.border}`,
        boxShadow:     "0 4px 16px -2px rgba(0,0,0,0.25)",
      }}
    >
      {/* strip warna kiri */}
      <div className="w-1 shrink-0" style={{ background: cs.strip }} />

      <div className="flex items-start gap-3 p-4 flex-1 min-w-0">
        {/* avatar inisial */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: cs.avatarBg, color: cs.avatarText }}
        >
          {pelanggan.nama.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <p className="font-semibold truncate text-sm text-white">{pelanggan.nama}</p>
            <Badge variant={statusVariant(pelanggan.statusBulanIni)} className="shrink-0 text-xs">
              {statusLabel(pelanggan.statusBulanIni)}
            </Badge>
          </div>
          {pelanggan.alamat && (
            <p className="text-xs text-blue-100/80 mt-0.5 truncate">{pelanggan.alamat}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-blue-100/75">
              <Wifi className="w-3 h-3" />
              {pelanggan.paket.namaPaket} · {formatRupiah(pelanggan.paket.harga)}
            </span>
            {pelanggan.tanggalJatuhTempo && (
              <span className="text-xs text-blue-100/75 border-l border-white/15 pl-2">
                Jatuh tempo tgl {pelanggan.tanggalJatuhTempo}
              </span>
            )}
            {pelanggan.statusBulanIni === "LUNAS" && pelanggan.nominalBayarBulanIni !== null && (
              <span className="text-xs font-semibold ml-auto" style={{ color: "#6ee89b" }}>
                Bayar: {formatRupiah(pelanggan.nominalBayarBulanIni)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex items-stretch animate-pulse"
      style={{
        background:    "rgba(255,255,255,0.07)",
        border:        "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="w-1 shrink-0 bg-white/20" />
      <div className="flex items-start gap-3 p-4 flex-1">
        <div className="w-9 h-9 bg-white/15 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between gap-2">
            <div className="h-4 bg-white/15 rounded w-36" />
            <div className="h-5 bg-white/15 rounded-full w-20" />
          </div>
          <div className="h-3 bg-white/10 rounded w-24" />
          <div className="h-3 bg-white/10 rounded w-40" />
        </div>
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
    // ── Notif hapus berhasil ──
  const [toast, setToast] = useState<{ type: "deleted" | "added"; nama: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
  const deletedNama = searchParams.get("deleted");
  const addedNama   = searchParams.get("added");
  const nama = deletedNama ?? addedNama;
  const type: "deleted" | "added" | null = deletedNama ? "deleted" : addedNama ? "added" : null;

  if (nama && type) {
    setToast({ type, nama });
    router.replace(`/pelanggan?bulan=${periode.bulan}&tahun=${periode.tahun}&filter=${filter}`, { scroll: false });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }
  return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


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

      {/* Toast: hapus/tambah berhasil */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2"
            style={
              toast.type === "added"
                ? { background: "#254395", border: "1px solid rgba(59,130,246,0.5)" }
                : { background: "#1F6B37", border: "1px solid rgba(34,163,70,0.5)" }
            }
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              {toast.type === "added"
                ? <UserPlus className="w-4 h-4 text-white" />
                : <CheckCircle2 className="w-4 h-4 text-white" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {toast.type === "added" ? "Pelanggan ditambahkan" : "Pelanggan dihapus"}
              </p>
              <p className="text-xs text-blue-100/80 truncate">
                {toast.nama} {toast.type === "added" ? "berhasil ditambahkan ke daftar" : "berhasil dihapus dari daftar"}
              </p>
            </div>
            <button onClick={() => setToast(null)} className="shrink-0">
              <X className="w-4 h-4 text-white/70 hover:text-white" />
            </button>
          </div>
        </div>
      )}
      
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
        <div className="px-3 pt-3 pb-2 space-y-3 lg:space-y-0 lg:flex lg:items-start lg:gap-3 lg:pt-4 lg:pb-3 lg:border-b lg:border-white/10">

          {/* Search */}
          <div className="lg:flex-1">
            <label className="block text-xs font-semibold text-blue-200/70 mb-1.5 px-0.5">
              Cari Pelanggan
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/60 pointer-events-none z-10" />
              <input
                type="search"
                placeholder="Nama pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/15 pl-10 pr-10 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <X className="w-4 h-4 text-blue-200/50" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tanggal bayar */}
          <div className="lg:w-52">
            <label className="block text-xs font-semibold text-blue-200/70 mb-1.5 px-0.5">
              Tanggal Bayar
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/60 pointer-events-none z-10" />
              <input
                type="date"
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/15 pl-10 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow appearance-none"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", colorScheme: "dark" }}
              />
             {!tanggalBayar && (
                <span className="lg:hidden absolute left-10 top-1/2 -translate-y-1/2 text-sm text-blue-200/40 pointer-events-none">
                  mm/dd/yyyy
                </span>
              )}
              {tanggalBayar && (
                <button onClick={() => setTanggalBayar("")} className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  <X className="w-4 h-4 text-blue-200/50" />
                </button>
              )}
            </div>
          </div>

          {/* Filter jatuh tempo */}
          <div className="lg:w-52">
            <label className="block text-xs font-semibold text-blue-200/70 mb-1.5 px-0.5">
              Jatuh Tempo
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/60 pointer-events-none z-10" />
              <select
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(e.target.value)}
                className="w-full h-11 rounded-xl border border-white/15 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow appearance-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  color: jatuhTempo ? "#ffffff" : "rgba(147,197,253,0.4)",
                  colorScheme: "dark",
                }}
              >
                <option value="">Semua tanggal</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((tgl) => (
                  <option key={tgl} value={String(tgl)} style={{ background: "#11244C", color: "#ffffff" }}>Tgl {tgl}</option>
                ))}
              </select>
              {jatuhTempo && (
                <button onClick={() => setJatuhTempo("")} className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  <X className="w-4 h-4 text-blue-200/50" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Status chips + info ── */}
        <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`h-9 px-3 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === opt.value
                  ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-400/40"
                  : "text-blue-200/70 border border-white/15 hover:bg-white/10 hover:text-white"
              }`}
              style={filter !== opt.value ? { background: "rgba(255,255,255,0.07)" } : {}}
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
            <span className="text-xs text-blue-200/60 font-medium ml-auto">
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
              <div
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-blue-200 hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{page} / {pagination.totalPages}</p>
                  <p className="text-xs text-blue-200/50">{pagination.total} pelanggan</p>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-blue-200 hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all"
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
