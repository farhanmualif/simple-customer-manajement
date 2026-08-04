"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wifi, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleLogin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = async (pinValue: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "PIN salah. Coba lagi.");
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        router.replace("/pelanggan");
      }
    } catch {
      setError("Tidak bisa terhubung. Coba lagi.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = useCallback(
    (val: string) => {
      if (loading) return;
      setError("");
      if (val === "del") {
        setPin((p) => p.slice(0, -1));
      } else if (pin.length < PIN_LENGTH) {
        setPin((p) => p + val);
      }
    },
    [pin, loading]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) handleKey(e.key);
      if (e.key === "Backspace") handleKey("del");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-24 h-24 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Wifi className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">WiFi RT/RW Net</h1>
          <p className="text-brand-200 text-lg leading-relaxed">
            Sistem pencatatan pembayaran WiFi bulanan yang mudah dan cepat untuk admin RT/RW.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Catat Pembayaran", desc: "Tandai lunas dengan 2 ketukan" },
              { label: "Pantau Status",    desc: "Lihat siapa yang belum bayar" },
              { label: "Ringkasan",        desc: "Total pemasukan bulan ini" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-brand-300 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — PIN entry */}
      <div className="flex-1 lg:max-w-md flex flex-col bg-gradient-to-b from-brand-800 via-brand-700 to-brand-600 lg:bg-white">
        <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 lg:pt-0 lg:pb-0 lg:bg-white lg:px-12">
          {/* Mobile logo */}
          <div className="lg:hidden w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mb-6 shadow-lg">
            <Wifi className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl font-bold text-white lg:text-slate-800 mb-1 lg:mb-2">
            <span className="lg:hidden">WiFi RT/RW Net</span>
            <span className="hidden lg:inline">Masuk ke Sistem</span>
          </h2>
          <p className="text-brand-200 lg:text-slate-500 text-sm mb-10 lg:mb-12">
            Masukkan PIN 4 digit untuk melanjutkan
          </p>

          {/* PIN dots */}
          <div className={cn("flex gap-4 mb-4 transition-all", shake && "animate-shake")}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-150",
                  i < pin.length
                    ? "bg-brand-600 border-brand-600 scale-110"
                    : "bg-transparent border-white/40 lg:border-slate-300"
                )}
              />
            ))}
          </div>

          {/* Error */}
          <div className="h-6 flex items-center mb-6">
            {error && (
              <p className="text-red-300 lg:text-danger-600 text-sm font-medium animate-fade-in">
                {error}
              </p>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="w-full max-w-xs">
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {keys.map((key, idx) => {
                if (key === "") return <div key={idx} />;
                if (key === "del") {
                  return (
                    <button
                      key={idx}
                      onPointerDown={() => handleKey("del")}
                      disabled={loading || pin.length === 0}
                      aria-label="Hapus"
                      className={cn(
                        "h-16 w-full rounded-2xl flex items-center justify-center transition-all",
                        "bg-white/10 lg:bg-slate-100 text-white lg:text-slate-600",
                        "active:bg-white/25 lg:hover:bg-slate-200",
                        "disabled:opacity-30 touch-manipulation select-none"
                      )}
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    onPointerDown={() => handleKey(key)}
                    disabled={loading || pin.length >= PIN_LENGTH}
                    aria-label={key}
                    className={cn(
                      "h-16 w-full rounded-2xl flex items-center justify-center text-2xl font-semibold transition-all duration-100",
                      "bg-white/10 lg:bg-slate-100 text-white lg:text-slate-800",
                      "active:bg-white/30 active:scale-95 lg:hover:bg-slate-200",
                      "disabled:opacity-30 touch-manipulation select-none"
                    )}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {loading && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/70 lg:bg-brand-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
