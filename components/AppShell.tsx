"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, LogOut, Wifi, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem { label: string; href: string; icon: React.ReactNode; }

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Data Pelanggan", href: "/pelanggan",  icon: <Users className="w-5 h-5" /> },
];

/* ── Nav items + Logout — dipakai oleh sidebar desktop & drawer mobile ── */
function NavContent({
  onLogout, loggingOut, onNavClick,
}: {
  onLogout: () => void; loggingOut: boolean; onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <>
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="px-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); onNavClick?.(); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative",
                active
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {active && (
                <span className="absolute right-4 w-2 h-2 rounded-full bg-blue-300" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-blue-200 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
        </button>
      </div>
    </>
  );
}

/* ── Desktop Sidebar ── */
function Sidebar({ onLogout, loggingOut }: { onLogout: () => void; loggingOut: boolean }) {
  return (
    <aside className="hidden lg:flex flex-col sidebar-width sidebar-glass min-h-screen sticky top-0 shrink-0">
      {/* Brand — hanya di desktop */}
      <div className="p-6 flex items-center gap-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Wifi className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">WiFi RT/RW Net</h1>
          <p className="text-xs text-blue-200">Pencatatan Pembayaran</p>
        </div>
      </div>

      <NavContent onLogout={onLogout} loggingOut={loggingOut} />
    </aside>
  );
}

/* ── Mobile Drawer ── */
function MobileDrawer({
  open, onClose, onLogout, loggingOut,
}: {
  open: boolean; onClose: () => void; onLogout: () => void; loggingOut: boolean;
}) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer — background solid agar tidak tembus */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden animate-fade-in"
        style={{ background: "linear-gradient(180deg, #0B1120 0%, #11244C 60%, #1a3a7a 100%)" }}
      >
        {/* Header drawer: brand + tombol X */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">WiFi RT/RW Net</p>
              <p className="text-blue-300 text-xs">Pencatatan Pembayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <NavContent onLogout={onLogout} loggingOut={loggingOut} onNavClick={onClose} />
      </div>
    </>
  );
}

/* ── AppShell ── */
export function AppShell({
  children, pageTitle, pageSubtitle, headerRight,
}: {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  headerRight?: React.ReactNode;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} loggingOut={loggingOut} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-white/20 shadow-sm px-4 lg:px-8 py-4 lg:py-5 flex items-center gap-3 sticky top-0 z-30">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 active:bg-gray-200 transition-colors"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{pageTitle}</h2>
            {pageSubtitle && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{pageSubtitle}</p>
            )}
          </div>

          {/* Right slot */}
          {headerRight && (
            <div className="flex items-center gap-2 shrink-0">{headerRight}</div>
          )}

          {/* Desktop logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="hidden lg:flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
