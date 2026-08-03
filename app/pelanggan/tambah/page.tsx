"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import { formatRupiah } from "@/lib/utils";
import type { PaketData } from "@/lib/types";

interface FormErrors {
  nama?: string; noWhatsapp?: string; paketId?: string;
  tanggalJatuhTempo?: string; alamat?: string;
}

export default function TambahPelangganPage() {
  const router = useRouter();
  const [paketList, setPaketList] = useState<PaketData[]>([]);
  const [loadingPaket, setLoadingPaket] = useState(true);

  // Field-field sesuai kolom Excel
  const [nama, setNama] = useState("");
  const [secretsPppoe, setSecretsPppoe] = useState("");
  const [alamat, setAlamat] = useState("");
  const [paketId, setPaketId] = useState("");
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState("");
  const [blokArea, setBlokArea] = useState("");
  const [ppn, setPpn] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [kupon, setKupon] = useState(false);
  const [noWhatsapp, setNoWhatsapp] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    fetch("/api/paket").then(r => r.json()).then(j => setPaketList(j.data ?? [])).finally(() => setLoadingPaket(false));
  }, []);

  const validate = (): boolean => {
    const err: FormErrors = {};
    if (!nama.trim())       err.nama = "Nama wajib diisi";
    if (!paketId)           err.paketId = "Pilih paket terlebih dahulu";
    const tgl = parseInt(tanggalJatuhTempo, 10);
    if (!tanggalJatuhTempo)               err.tanggalJatuhTempo = "Wajib diisi";
    else if (isNaN(tgl) || tgl < 1 || tgl > 31) err.tanggalJatuhTempo = "Masukkan angka 1–31";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSimpan = async () => {
    if (!validate()) return;
    setSaving(true); setGlobalError("");
    try {
      const res = await fetch("/api/pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          secretsPppoe: secretsPppoe.trim() || null,
          alamat: alamat.trim() || null,
          paketId,
          tanggalJatuhTempo: parseInt(tanggalJatuhTempo, 10),
          blokArea: blokArea.trim() || null,
          ppn,
          keterangan: keterangan.trim() || null,
          kupon,
          noWhatsapp: noWhatsapp.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setGlobalError(json.error ?? "Gagal menyimpan."); return; }
      router.replace("/pelanggan");
    } catch { setGlobalError("Tidak bisa terhubung. Coba lagi."); }
    finally { setSaving(false); }
  };

  const selectedPaket = paketList.find((p) => p.id === paketId);

  const backButton = (
    <button onClick={() => router.back()} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 lg:bg-slate-100 text-white lg:text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
      <ArrowLeft className="w-4 h-4" /><span className="hidden lg:inline">Kembali</span>
    </button>
  );

  return (
    <AppShell pageTitle="Tambah Pelanggan" pageSubtitle="Isi data pelanggan baru" headerRight={backButton}>
      <div className="p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {globalError && (
            <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 text-danger-700 text-sm font-medium mb-5">{globalError}</div>
          )}

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Data Pelanggan Baru</p>
                <p className="text-xs text-slate-400">Sesuai format data WiFi RT/RW</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* WAJIB */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wajib Diisi</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nama */}
                <div className="space-y-1.5">
                  <Label htmlFor="nama">Nama Pelanggan</Label>
                  <Input id="nama" placeholder="Budi Santoso" value={nama}
                    onChange={(e) => { setNama(e.target.value); setErrors(p => ({...p, nama: undefined})); }}
                    className={errors.nama ? "border-danger-500" : ""} />
                  {errors.nama && <p className="text-danger-600 text-xs">{errors.nama}</p>}
                </div>

                {/* Paket */}
                <div className="space-y-1.5">
                  <Label>Paket Internet</Label>
                  {loadingPaket ? <div className="h-12 bg-slate-100 rounded-xl animate-pulse" /> : (
                    <Select value={paketId} onValueChange={(v) => { setPaketId(v); setErrors(p => ({...p, paketId: undefined})); }}>
                      <SelectTrigger className={errors.paketId ? "border-danger-500" : ""}>
                        <SelectValue placeholder="Pilih paket..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paketList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.namaPaket} · {formatRupiah(p.harga)}/bln</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.paketId && <p className="text-danger-600 text-xs">{errors.paketId}</p>}
                  {selectedPaket && (
                    <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 flex justify-between text-sm">
                      <span className="text-brand-700">Tagihan/bulan</span>
                      <span className="font-bold text-brand-700">{formatRupiah(selectedPaket.harga)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Alamat */}
                <div className="space-y-1.5">
                  <Label htmlFor="alamat">Alamat / Wilayah</Label>
                  <Input id="alamat" placeholder="misal: Bogolan Tanjakan" value={alamat}
                    onChange={(e) => setAlamat(e.target.value)} />
                </div>

                {/* Tanggal jatuh tempo */}
                <div className="space-y-1.5">
                  <Label htmlFor="tgl">Tanggal Jatuh Tempo <span className="text-slate-400 font-normal text-xs">(1–31)</span></Label>
                  <Input id="tgl" type="number" inputMode="numeric" placeholder="misal: 1" min={1} max={31}
                    value={tanggalJatuhTempo}
                    onChange={(e) => { setTanggalJatuhTempo(e.target.value); setErrors(p => ({...p, tanggalJatuhTempo: undefined})); }}
                    className={errors.tanggalJatuhTempo ? "border-danger-500" : ""} />
                  {errors.tanggalJatuhTempo && <p className="text-danger-600 text-xs">{errors.tanggalJatuhTempo}</p>}
                  <p className="text-xs text-slate-400">Tagihan jatuh tempo setiap tanggal ini tiap bulan.</p>
                </div>
              </div>

              {/* OPSIONAL */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Opsional</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* No WA */}
                  <div className="space-y-1.5">
                    <Label htmlFor="wa">No. WhatsApp</Label>
                    <Input id="wa" type="tel" inputMode="numeric" placeholder="08123456789" value={noWhatsapp}
                      onChange={(e) => setNoWhatsapp(e.target.value)} />
                  </div>

                  {/* Secrets PPPoE */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pppoe">Secrets PPPoE</Label>
                    <Input id="pppoe" placeholder="misal: BUDI@BOGOLAN" value={secretsPppoe}
                      onChange={(e) => setSecretsPppoe(e.target.value)} className="font-mono" />
                  </div>

                  {/* Blok Area / ODP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="blok">Blok Area / ODP</Label>
                    <Input id="blok" placeholder="misal: odp rt darso" value={blokArea}
                      onChange={(e) => setBlokArea(e.target.value)} />
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="ket">Keterangan</Label>
                    <Input id="ket" placeholder="misal: aktif 14 juli, cdata, tplink" value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)} />
                  </div>
                </div>

                {/* Toggle PPN & Kupon */}
                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={ppn} onChange={(e) => setPpn(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600" />
                    <span className="text-sm font-medium text-slate-700">Kena PPN</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={kupon} onChange={(e) => setKupon(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600" />
                    <span className="text-sm font-medium text-slate-700">Ada Kupon</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button type="button" onClick={() => router.back()}
                className="sm:w-auto h-12 px-8 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-white disabled:opacity-50" disabled={saving}>
                Batal
              </button>
              <button type="button" onClick={handleSimpan} disabled={saving}
                className="sm:w-auto h-12 px-8 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-card disabled:opacity-60 flex items-center justify-center gap-2">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyimpan...</>
                  : <><CheckCircle2 className="w-4 h-4" />Simpan Pelanggan</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
