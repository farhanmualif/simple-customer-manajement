"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Phone, Wifi, Calendar, CheckCircle2, Clock,
  MessageCircle, WifiOff, Router, MapPin, Tag, Edit,
  ChevronLeft, ChevronRight, Users, Save, Search, X, Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import {
  formatRupiah, formatBulanTahun, formatTanggal,
  getBulanTahunSekarang, getNamaBulan, parsePeriodeQuery, geserBulan,
} from "@/lib/utils";
import type { PelangganDetail, PelangganListItem, StatusTagihan, PaketData } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
function statusVariant(s: StatusTagihan): "lunas" | "belumBayar" | "isolir" | "default" {
  if (s === "LUNAS")  return "lunas";
  if (s === "ISOLIR") return "isolir";
  return "belumBayar";
}
function statusLabel(s: StatusTagihan) {
  if (s === "LUNAS")  return "Lunas";
  if (s === "ISOLIR") return "Isolir";
  return "Belum Bayar";
}
function StatusIcon({ s }: { s: StatusTagihan }) {
  if (s === "LUNAS")  return <CheckCircle2 className="w-4 h-4 text-success-600" />;
  if (s === "ISOLIR") return <WifiOff className="w-4 h-4 text-slate-500" />;
  return <Clock className="w-4 h-4 text-danger-600" />;
}

// ── Cari Pelanggan Dropdown ──────────────────────────────────────────────────
function CariPelangganDropdown({
  currentId, bulan, tahun, onNavigate,
}: {
  currentId: string; bulan: number; tahun: number; onNavigate: () => void;
}) {
  const router = useRouter();
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<PelangganListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const wrapperRef                  = useRef<HTMLDivElement>(null);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ search: query, limit: "7", bulan: String(bulan), tahun: String(tahun) });
        const res = await fetch(`/api/pelanggan?${p}`);
        const json = await res.json();
        const filtered = (json.data ?? []).filter((p: PelangganListItem) => p.id !== currentId);
        setResults(filtered);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  }, [query, bulan, tahun, currentId]);

  const handleSelect = (pelanggan: PelangganListItem) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onNavigate();
    router.push(`/pelanggan/${pelanggan.id}?bulan=${bulan}&tahun=${tahun}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200/60 pointer-events-none" />
        <input
          type="search"
          placeholder="Cari pelanggan lain..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && (setOpen(false), setQuery(""))}
          className="w-full h-11 rounded-xl border border-white/15 pl-10 pr-10 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-blue-200/50" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-2xl overflow-hidden"
          style={{
            background: "rgba(17,36,76,0.97)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)",
          }}
        >
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-blue-200/50">Tidak ada hasil</div>
          ) : (
            <div className="py-1.5 max-h-72 overflow-y-auto scrollbar-none">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    p.statusBulanIni === "LUNAS"  ? "bg-green-500/20 text-green-300" :
                    p.statusBulanIni === "ISOLIR" ? "bg-slate-500/20 text-slate-300" :
                                                    "bg-red-500/20 text-red-300"
                  }`}>
                    {p.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{p.nama}</p>
                    <p className="text-xs text-blue-200/60 truncate">{p.alamat ?? p.paket.namaPaket}</p>
                  </div>
                  <Badge variant={statusVariant(p.statusBulanIni)} className="text-xs shrink-0">
                    {statusLabel(p.statusBulanIni)}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Edit Pelanggan Form (inline di card info) ─────────────────────────────────
interface EditFormState {
  nama: string;
  noWhatsapp: string;
  alamat: string;
  paketId: string;
  tanggalJatuhTempo: string;
  secretsPppoe: string;
  blokArea: string;
  keterangan: string;
  ppn: boolean;
  kupon: boolean;
}

function EditPelangganCard({
  data, onSaved, onCancel,
}: {
  data: PelangganDetail; onSaved: () => void; onCancel: () => void;
}) {
  const [paketList, setPaketList]   = useState<PaketData[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState("");
  const [form, setForm]             = useState<EditFormState>({
    nama:               data.nama,
    noWhatsapp:         data.noWhatsapp ?? "",
    alamat:             data.alamat ?? "",
    paketId:            data.paket.id,
    tanggalJatuhTempo:  String(data.tanggalJatuhTempo),
    secretsPppoe:       data.secretsPppoe ?? "",
    blokArea:           data.blokArea ?? "",
    keterangan:         data.keterangan ?? "",
    ppn:                data.ppn,
    kupon:              data.kupon,
  });

  useEffect(() => {
    fetch("/api/paket")
      .then((r) => r.json())
      .then((j) => setPaketList(j.data ?? []))
      .finally(() => setLoadingPaket(false));
  }, []);

  const set = (key: keyof EditFormState, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSimpan = async () => {
    if (!form.nama.trim()) { setErr("Nama wajib diisi."); return; }
    const tgl = parseInt(form.tanggalJatuhTempo, 10);
    if (!tgl || tgl < 1 || tgl > 31) { setErr("Tanggal jatuh tempo harus antara 1–31."); return; }
    if (!form.paketId) { setErr("Pilih paket terlebih dahulu."); return; }

    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/pelanggan/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama:              form.nama.trim(),
          noWhatsapp:        form.noWhatsapp.trim() || null,
          alamat:            form.alamat.trim() || null,
          paketId:           form.paketId,
          tanggalJatuhTempo: tgl,
          secretsPppoe:      form.secretsPppoe.trim() || null,
          blokArea:          form.blokArea.trim() || null,
          keterangan:        form.keterangan.trim() || null,
          ppn:               form.ppn,
          kupon:             form.kupon,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Gagal"); }
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={glassCard}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,0.25)" }}>
          <Pencil className="w-5 h-5 text-blue-300" />
        </div>
        <div>
          <p className="font-bold text-white">Edit Pelanggan</p>
          <p className="text-xs text-blue-200/60">Ubah data pelanggan</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Nama */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Nama Pelanggan</label>
          <input
            id="edit-nama"
            value={form.nama}
            onChange={(e) => { set("nama", e.target.value); setErr(""); }}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* No WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">No. WhatsApp</label>
          <input
            id="edit-wa"
            type="tel"
            inputMode="numeric"
            placeholder="08123456789"
            value={form.noWhatsapp}
            onChange={(e) => set("noWhatsapp", e.target.value)}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* Alamat */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Alamat / Wilayah</label>
          <input
            id="edit-alamat"
            placeholder="misal: Bogolan Tanjakan"
            value={form.alamat}
            onChange={(e) => set("alamat", e.target.value)}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* Paket */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Paket Internet</label>
          {loadingPaket ? (
            <div className="h-11 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
          ) : (
            <Select value={form.paketId} onValueChange={(v) => set("paketId", v)}>
              <SelectTrigger className="border-white/15 text-white bg-white/[0.08] focus:ring-brand-400/50">
                <SelectValue placeholder="Pilih paket..." />
              </SelectTrigger>
              <SelectContent>
                {paketList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.namaPaket} · {formatRupiah(p.harga)}/bln
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tanggal Jatuh Tempo */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">
            Tanggal Jatuh Tempo <span className="text-blue-200/40 font-normal text-xs">(1–31)</span>
          </label>
          <input
            id="edit-tgl"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={form.tanggalJatuhTempo}
            onChange={(e) => { set("tanggalJatuhTempo", e.target.value); setErr(""); }}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)", colorScheme: "dark" }}
          />
        </div>

        {/* Secrets PPPoE */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Secrets PPPoE</label>
          <input
            id="edit-pppoe"
            placeholder="misal: BUDI@BOGOLAN"
            value={form.secretsPppoe}
            onChange={(e) => set("secretsPppoe", e.target.value)}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white font-mono placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* Blok Area */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Blok Area / ODP</label>
          <input
            id="edit-blok"
            placeholder="misal: odp rt darso"
            value={form.blokArea}
            onChange={(e) => set("blokArea", e.target.value)}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* Keterangan */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Keterangan</label>
          <input
            id="edit-ket"
            placeholder="misal: aktif 14 juli, cdata, tplink"
            value={form.keterangan}
            onChange={(e) => set("keterangan", e.target.value)}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>

        {/* PPN & Kupon */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.ppn}
              onChange={(e) => set("ppn", e.target.checked)}
              className="w-4 h-4 rounded accent-brand-400"
            />
            <span className="text-sm font-medium text-blue-100/80">Kena PPN</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.kupon}
              onChange={(e) => set("kupon", e.target.checked)}
              className="w-4 h-4 rounded accent-brand-400"
            />
            <span className="text-sm font-medium text-blue-100/80">Ada Kupon</span>
          </label>
        </div>

        {err && (
          <p className="text-sm font-medium rounded-xl px-4 py-2.5" style={{ background: "rgba(227,51,51,0.15)", color: "#f88", border: "1px solid rgba(227,51,51,0.3)" }}>{err}</p>
        )}

        {/* Tombol aksi */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 h-11 rounded-xl border border-white/20 text-blue-200 font-semibold text-sm hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSimpan}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              : <><Save className="w-4 h-4" /> Simpan</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline Tagihan Form ───────────────────────────────────────────────────────
function TagihanForm({
  pelangganId, bulan, tahun, hargaPaket,
  currentStatus, currentNominal, currentCatatan,
  onSaved,
}: {
  pelangganId: string; bulan: number; tahun: number; hargaPaket: number;
  currentStatus: StatusTagihan; currentNominal: number | null; currentCatatan: string | null;
  onSaved: () => void;
}) {
  const now = getBulanTahunSekarang();
  const [periodeTagihan, setPeriodeTagihan] = useState({ bulan, tahun });
  const isBulanDepan =
    periodeTagihan.tahun > now.tahun ||
    (periodeTagihan.tahun === now.tahun && periodeTagihan.bulan > now.bulan);

  const [status, setStatus]   = useState<StatusTagihan>(currentStatus);
  const [nominal, setNominal] = useState(String(currentNominal ?? hargaPaket));
  const [catatan, setCatatan] = useState(currentCatatan ?? "");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [ok, setOk]           = useState(false);

  useEffect(() => {
    setPeriodeTagihan({ bulan, tahun });
    setStatus(currentStatus);
    setNominal(String(currentNominal ?? hargaPaket));
    setCatatan(currentCatatan ?? "");
    setErr(""); setOk(false);
  }, [currentStatus, currentNominal, currentCatatan, hargaPaket, bulan, tahun]);

  const handleSimpan = async () => {
    if (status === "LUNAS") {
      const n = parseInt(nominal, 10);
      if (!n || n <= 0) { setErr("Isi nominal pembayaran."); return; }
    }
    setSaving(true); setErr(""); setOk(false);
    try {
      const n = status === "LUNAS" ? parseInt(nominal, 10) : null;
      const res = await fetch("/api/pembayaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pelangganId,
          bulan: periodeTagihan.bulan,
          tahun: periodeTagihan.tahun,
          status, nominalBayar: n, catatan,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "Gagal"); }
      setOk(true);
      setTimeout(() => setOk(false), 3000);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally { setSaving(false); }
  };

  const changed =
    periodeTagihan.bulan !== bulan || periodeTagihan.tahun !== tahun ||
    status !== currentStatus ||
    (status === "LUNAS" && parseInt(nominal, 10) !== (currentNominal ?? hargaPaket)) ||
    catatan !== (currentCatatan ?? "");

  return (
    <div className="rounded-2xl overflow-hidden" style={glassCard}>
      <div className="px-5 pt-5 pb-3 border-b border-white/10">
        <p className="font-bold text-white">Update Tagihan</p>
        <p className="text-xs text-blue-200/60 mt-0.5">Pilih bulan &amp; status pembayaran</p>
      </div>
      <div className="p-5 space-y-4">
        {/* Pilih bulan tagihan */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Bulan Tagihan</label>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => { const p = geserBulan(periodeTagihan.bulan, periodeTagihan.tahun, -1); setPeriodeTagihan(p); setOk(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-200 hover:bg-white/15 active:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-semibold text-white text-sm">
              {formatBulanTahun(periodeTagihan.bulan, periodeTagihan.tahun)}
            </span>
            <button
              onClick={() => { const p = geserBulan(periodeTagihan.bulan, periodeTagihan.tahun, 1); setPeriodeTagihan(p); setOk(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-200 hover:bg-white/15 active:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {isBulanDepan && (
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: "#fcd34d" }}>
              📅 Tagihan bulan depan ({formatBulanTahun(periodeTagihan.bulan, periodeTagihan.tahun)})
            </p>
          )}
        </div>
        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as StatusTagihan); setErr(""); setOk(false); }}
            className="w-full h-12 rounded-xl px-4 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-colors appearance-none cursor-pointer border border-white/15"
            style={{
              background: "rgba(255,255,255,0.08)",
              colorScheme: "dark",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
          >
            <option value="LUNAS" style={{ background: "#11244C" }}>✅  Lunas</option>
            <option value="BELUM_BAYAR" style={{ background: "#11244C" }}>⏳  Belum Bayar</option>
            <option value="ISOLIR" style={{ background: "#11244C" }}>🔴  Isolir</option>
          </select>
        </div>
        {/* Nominal */}
        {status === "LUNAS" && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-blue-100/80">Nominal Bayar</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/70 font-semibold text-sm pointer-events-none">Rp</span>
              <input
                type="number"
                inputMode="numeric"
                className="w-full h-11 rounded-xl border border-white/15 pl-10 pr-4 text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
                style={{ background: "rgba(255,255,255,0.08)", colorScheme: "dark" }}
                value={nominal}
                onChange={(e) => { setNominal(e.target.value.replace(/\D/g, "")); setErr(""); }}
                placeholder={String(hargaPaket)}
              />
            </div>
            {parseInt(nominal, 10) !== hargaPaket && parseInt(nominal, 10) > 0 && (
              <p className="text-xs font-medium" style={{ color: "#fcd34d" }}>⚠ Berbeda dari harga paket ({formatRupiah(hargaPaket)})</p>
            )}
          </div>
        )}
        {/* Catatan */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-blue-100/80">
            Catatan <span className="font-normal text-blue-200/40 text-xs">(opsional)</span>
          </label>
          <input
            type="text"
            placeholder="misal: diskon, cicilan, keterangan"
            value={catatan}
            onChange={(e) => { setCatatan(e.target.value); setOk(false); }}
            className="w-full h-11 rounded-xl border border-white/15 px-4 text-sm text-white placeholder:text-blue-200/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        </div>
        {err && (
          <p className="text-sm font-medium rounded-xl px-4 py-2.5" style={{ background: "rgba(227,51,51,0.15)", color: "#f88", border: "1px solid rgba(227,51,51,0.3)" }}>{err}</p>
        )}
        {ok && (
          <p className="text-sm font-medium rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(34,163,70,0.15)", color: "#6ee89b", border: "1px solid rgba(34,163,70,0.3)" }}>
            <CheckCircle2 className="w-4 h-4" /> Tersimpan!
          </p>
        )}
        <button
          onClick={handleSimpan}
          disabled={saving || (!changed && !ok)}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]"
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
            : <><Save className="w-4 h-4" /> Simpan</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Info Pelanggan Card (mode tampil) ─────────────────────────────────────────
// shared glass card style for detail page
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.12)",
};
const iconBox = "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/10";

function InfoPelangganCard({
  data, currentStatus, onEdit,
}: {
  data: PelangganDetail; currentStatus: StatusTagihan; onEdit: () => void;
}) {
  const openWhatsApp = () => {
    const no = data.noWhatsapp?.replace(/\D/g, "").replace(/^0/, "62") ?? "";
    if (no) window.open(`https://wa.me/${no}`, "_blank");
  };

  const avatarStyle: React.CSSProperties =
    currentStatus === "LUNAS"
      ? { background: "rgba(34,163,70,0.25)", color: "#6ee89b" }
      : currentStatus === "ISOLIR"
      ? { background: "rgba(107,114,128,0.25)", color: "#cbd5e1" }
      : { background: "rgba(227,51,51,0.25)", color: "#f88" };

  return (
    <div className="rounded-2xl overflow-hidden" style={glassCard}>
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={avatarStyle}
        >
          {data.nama.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg leading-tight truncate">{data.nama}</p>
          {data.nomorUrut && <p className="text-xs text-blue-200/60">No. {data.nomorUrut}</p>}
        </div>
        <button
          onClick={onEdit}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-200/70 hover:bg-white/15 hover:text-white transition-colors shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}
          title="Edit pelanggan"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {data.noWhatsapp && (
          <div className="flex items-center gap-3">
            <div className={iconBox}><Phone className="w-4 h-4 text-blue-200/70" /></div>
            <div className="flex-1">
              <p className="text-xs text-blue-200/50">No. WhatsApp</p>
              <p className="font-semibold text-white text-sm">{data.noWhatsapp}</p>
            </div>
            <button
              onClick={openWhatsApp}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-green-500/20 transition-colors"
              style={{ background: "rgba(34,163,70,0.15)" }}
            >
              <MessageCircle className="w-4 h-4 text-green-400" />
            </button>
          </div>
        )}
        {data.alamat && (
          <div className="flex items-center gap-3">
            <div className={iconBox}><MapPin className="w-4 h-4 text-blue-200/70" /></div>
            <div>
              <p className="text-xs text-blue-200/50">Alamat</p>
              <p className="font-semibold text-white text-sm">{data.alamat}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className={iconBox}><Wifi className="w-4 h-4 text-blue-200/70" /></div>
          <div>
            <p className="text-xs text-blue-200/50">Paket</p>
            <p className="font-semibold text-white text-sm">
              {data.paket.namaPaket}{" "}
              <span className="text-blue-300">· {formatRupiah(data.paket.harga)}/bln</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={iconBox}><Calendar className="w-4 h-4 text-blue-200/70" /></div>
          <div>
            <p className="text-xs text-blue-200/50">Jatuh Tempo</p>
            <p className="font-semibold text-white text-sm">Tanggal {data.tanggalJatuhTempo} tiap bulan</p>
          </div>
        </div>
        {data.secretsPppoe && (
          <div className="flex items-center gap-3">
            <div className={iconBox}><Router className="w-4 h-4 text-blue-200/70" /></div>
            <div>
              <p className="text-xs text-blue-200/50">Secrets PPPoE</p>
              <p className="font-semibold text-white text-sm font-mono">{data.secretsPppoe}</p>
            </div>
          </div>
        )}
        {data.blokArea && (
          <div className="flex items-center gap-3">
            <div className={iconBox}><Tag className="w-4 h-4 text-blue-200/70" /></div>
            <div>
              <p className="text-xs text-blue-200/50">Blok Area / ODP</p>
              <p className="font-semibold text-white text-sm">{data.blokArea}</p>
            </div>
          </div>
        )}
        {data.keterangan && (
          <div className="flex items-center gap-3">
            <div className={iconBox}><Edit className="w-4 h-4 text-blue-200/70" /></div>
            <div>
              <p className="text-xs text-blue-200/50">Keterangan</p>
              <p className="font-semibold text-white text-sm">{data.keterangan}</p>
            </div>
          </div>
        )}
        {(data.ppn || data.kupon) && (
          <div className="flex gap-2 pt-1">
            {data.ppn   && <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.2)", color: "#fcd34d" }}>PPN</span>}
            {data.kupon && <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(37,99,235,0.25)", color: "#93c5fd" }}>Kupon</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail page inner ────────────────────────────────────────────────────────
function DetailContent({ id }: { id: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [periode, setPeriode] = useState(() =>
    parsePeriodeQuery(searchParams.get("bulan"), searchParams.get("tahun"))
  );

  const [data, setData]       = useState<PelangganDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editOk, setEditOk]       = useState(false);

  const fetchData = useCallback(async (b: number, t: number) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/pelanggan/${id}?bulan=${b}&tahun=${t}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
    } catch { setError("Gagal memuat data pelanggan."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(periode.bulan, periode.tahun); }, [fetchData, periode]);

  const handlePeriodeChange = (b: number, t: number) => {
    setPeriode({ bulan: b, tahun: t });
    router.replace(`/pelanggan/${id}?bulan=${b}&tahun=${t}`, { scroll: false });
  };

  const handleEditSaved = async () => {
    setIsEditing(false);
    setEditOk(true);
    await fetchData(periode.bulan, periode.tahun);
    setTimeout(() => setEditOk(false), 3000);
  };

  const now = getBulanTahunSekarang();
  const isSekarang      = periode.bulan === now.bulan && periode.tahun === now.tahun;
  const currentStatus   = data?.statusBulanIni ?? "BELUM_BAYAR";

  const periodeNav = (
    <div className="flex items-center gap-1 bg-white/15 lg:bg-slate-100 rounded-xl px-2 py-1">
      <button
        onClick={() => { const p = geserBulan(periode.bulan, periode.tahun, -1); handlePeriodeChange(p.bulan, p.tahun); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white lg:text-slate-600 hover:bg-white/20 lg:hover:bg-slate-200 active:bg-white/30"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold text-white lg:text-slate-700 min-w-[110px] text-center">
        {formatBulanTahun(periode.bulan, periode.tahun)}
      </span>
      <button
        onClick={() => { const p = geserBulan(periode.bulan, periode.tahun, 1); handlePeriodeChange(p.bulan, p.tahun); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white lg:text-slate-600 hover:bg-white/20 lg:hover:bg-slate-200 active:bg-white/30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-2">
        {periodeNav}
        {data && <Badge variant={statusVariant(currentStatus)}>{statusLabel(currentStatus)}</Badge>}
      </div>
      <button
        onClick={() => router.push("/pelanggan")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 lg:bg-slate-100 text-white lg:text-slate-600 text-sm font-medium hover:bg-slate-200 active:bg-white/30 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /><span className="hidden lg:inline">Kembali</span>
      </button>
    </div>
  );

  if (loading) return (
    <AppShell pageTitle="Detail Pelanggan" headerRight={headerRight}>
      <div className="p-4 lg:p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-28 animate-pulse"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          />
        ))}
      </div>
    </AppShell>
  );

  if (error || !data) return (
    <AppShell pageTitle="Detail Pelanggan" headerRight={headerRight}>
      <div className="flex flex-col items-center justify-center min-h-64 p-8 text-center">
        <Users className="w-12 h-12 text-blue-200/30 mb-4" />
        <p className="text-blue-200/60 mb-4">{error || "Data tidak ditemukan."}</p>
        <button onClick={() => router.push("/pelanggan")} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors">
          Kembali ke Daftar
        </button>
      </div>
    </AppShell>
  );

  const currentCatatan = data.riwayatTagihan.find(
    (t) => t.bulan === periode.bulan && t.tahun === periode.tahun
  )?.catatan ?? null;

  return (
    <AppShell
      pageTitle={data.nama}
      pageSubtitle={formatBulanTahun(periode.bulan, periode.tahun)}
      headerRight={headerRight}
    >
      {/* Mobile: sub-bar periode nav + badge status */}
      <div
        className="lg:hidden px-3 py-2.5 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, #0B1120 0%, #11244C 60%, #1a3a7a 100%)" }}
      >
        {periodeNav}
        <div className="flex-1" />
        {data && (
          <Badge variant={statusVariant(currentStatus)} className="shrink-0 whitespace-nowrap">
            {statusLabel(currentStatus)}
          </Badge>
        )}
        {!isSekarang && <span className="text-xs text-blue-300 shrink-0">📅</span>}
      </div>

      <div className="p-4 lg:p-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Kiri: Search + Info + Form Tagihan ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Search cari pelanggan lain */}
            <CariPelangganDropdown
              currentId={id}
              bulan={periode.bulan}
              tahun={periode.tahun}
              onNavigate={() => setIsEditing(false)}
            />

            {/* Feedback edit berhasil */}
            {editOk && (
              <div
                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(34,163,70,0.15)", color: "#6ee89b", border: "1px solid rgba(34,163,70,0.3)" }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Data pelanggan berhasil diperbarui
              </div>
            )}

            {/* Info card — mode tampil atau edit */}
            {isEditing ? (
              <EditPelangganCard
                data={data}
                onSaved={handleEditSaved}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <InfoPelangganCard
                data={data}
                currentStatus={currentStatus}
                onEdit={() => setIsEditing(true)}
              />
            )}

            {/* Form Tagihan */}
            <TagihanForm
              pelangganId={data.id}
              bulan={periode.bulan}
              tahun={periode.tahun}
              hargaPaket={data.paket.harga}
              currentStatus={currentStatus}
              currentNominal={data.nominalBayarBulanIni}
              currentCatatan={currentCatatan}
              onSaved={() => fetchData(periode.bulan, periode.tahun)}
            />
          </div>

          {/* ── Kanan: Riwayat Tagihan ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden" style={glassCard}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/10">
                <p className="font-bold text-white">Riwayat Tagihan</p>
                <span className="text-xs text-blue-200/50">{data.riwayatTagihan.length} bulan</span>
              </div>

              {data.riwayatTagihan.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-8 h-8 text-blue-200/30 mx-auto mb-2" />
                  <p className="text-blue-200/50 text-sm">Belum ada riwayat tagihan</p>
                </div>
              ) : (
                <div>
                  <div className="hidden lg:grid grid-cols-5 gap-3 px-5 py-3 border-b border-white/10 text-xs font-semibold text-blue-200/50 uppercase tracking-wide">
                    <span>Periode</span><span>Tagihan</span><span>Dibayar</span><span>Tgl Bayar</span><span>Status</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {data.riwayatTagihan.map((t) => {
                      const isCurrent = t.bulan === periode.bulan && t.tahun === periode.tahun;
                      return (
                        <div
                          key={t.id}
                          className="px-5 py-3.5 transition-colors"
                          style={isCurrent ? { background: "rgba(37,99,235,0.15)" } : {}}
                        >
                          {/* Mobile */}
                          <div className="flex items-center gap-3 lg:hidden">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={
                                t.status === "LUNAS"
                                  ? { background: "rgba(34,163,70,0.2)" }
                                  : t.status === "ISOLIR"
                                  ? { background: "rgba(107,114,128,0.2)" }
                                  : { background: "rgba(227,51,51,0.2)" }
                              }
                            >
                              <StatusIcon s={t.status} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white text-sm">{getNamaBulan(t.bulan)} {t.tahun}</p>
                                {isCurrent && <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}>ini</span>}
                              </div>
                              {t.status === "LUNAS" && t.tanggalBayar && <p className="text-xs text-blue-200/50">{formatTanggal(t.tanggalBayar)}</p>}
                              {t.catatan && <p className="text-xs mt-0.5" style={{ color: "#fcd34d" }}>{t.catatan}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              {t.status === "LUNAS" && t.nominalBayar ? (
                                <>
                                  <p className="font-bold text-sm" style={{ color: "#6ee89b" }}>{formatRupiah(t.nominalBayar)}</p>
                                  {t.nominalBayar !== t.nominalTagihan && <p className="text-xs text-blue-200/40 line-through">{formatRupiah(t.nominalTagihan)}</p>}
                                </>
                              ) : <Badge variant={statusVariant(t.status)} className="text-xs">{statusLabel(t.status)}</Badge>}
                            </div>
                          </div>
                          {/* Desktop */}
                          <div className="hidden lg:grid grid-cols-5 gap-3 items-center">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white text-sm">{getNamaBulan(t.bulan)} {t.tahun}</p>
                              {isCurrent && <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}>ini</span>}
                            </div>
                            <p className="text-sm text-blue-100/70">{formatRupiah(t.nominalTagihan)}</p>
                            <div>
                              {t.status === "LUNAS" && t.nominalBayar
                                ? <p className="text-sm font-bold" style={{ color: t.nominalBayar < t.nominalTagihan ? "#fcd34d" : "#6ee89b" }}>{formatRupiah(t.nominalBayar)}</p>
                                : <span className="text-blue-200/30">—</span>}
                            </div>
                            <div>
                              {t.status === "LUNAS" && t.tanggalBayar
                                ? <p className="text-sm text-blue-100/70">{formatTanggal(t.tanggalBayar)}</p>
                                : <span className="text-blue-200/30">—</span>}
                            </div>
                            <div>
                              <Badge variant={statusVariant(t.status)} className="text-xs">{statusLabel(t.status)}</Badge>
                              {t.catatan && <p className="text-xs mt-1" style={{ color: "#fcd34d" }}>{t.catatan}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DetailPelangganPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    }>
      <DetailContent id={id} />
    </Suspense>
  );
}
