"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Wifi,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Data Pelanggan",
    href: "/pelanggan",
    icon: <Users className="w-5 h-5" />,
  },
];

/* ─────────────────────────────────────────────
   Desktop Sidebar
───────────────────────────────────────────── */
function Sidebar({
  onLogout,
  loggingOut,
}: {
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden lg:flex flex-col sidebar-width bg-brand-800 min-h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-brand-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Wifi className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">WiFi RT/RW Net</p>
            <p className="text-brand-300 text-xs">Pencatatan Pembayaran</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/15 text-white"
                  : "text-brand-300 hover:bg-white/8 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  active ? "text-white" : "text-brand-400"
                )}
              >
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-300" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-brand-700/60 pt-4">
        <button
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-brand-400 hover:bg-white/8 hover:text-white transition-all disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────
   Mobile Drawer (overlay)
───────────────────────────────────────────── */
function MobileDrawer({
  open,
  onClose,
  onLogout,
  loggingOut,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-brand-800 flex flex-col lg:hidden animate-fade-in">
        <div className="px-5 py-6 border-b border-brand-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">WiFi RT/RW Net</p>
              <p className="text-brand-300 text-xs">Pencatatan Pembayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-white/15 text-white"
                    : "text-brand-300 active:bg-white/8 active:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-8 border-t border-brand-700/60 pt-4">
          <button
            onClick={() => { onLogout(); onClose(); }}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-medium text-brand-400 active:bg-white/8 active:text-white transition-all disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   AppShell — wraps all authenticated pages
───────────────────────────────────────────── */
export function AppShell({
  children,
  pageTitle,
  pageSubtitle,
  headerRight,
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
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar onLogout={handleLogout} loggingOut={loggingOut} />

      {/* Mobile Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Mobile Header: hamburger | title | ONE action slot ── */}
        <header className="lg:hidden bg-brand-700 sticky top-0 z-30 shadow-sm">
          {/* Row 1: nav controls */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            {/* Title — truncates instead of pushing right slot off screen */}
            <div className="flex-1 min-w-0 px-1">
              <p className="font-bold text-white text-base leading-tight truncate">{pageTitle}</p>
              {pageSubtitle && (
                <p className="text-brand-200 text-xs truncate">{pageSubtitle}</p>
              )}
            </div>

            {/* Right slot — wrapped to prevent overflow */}
            {headerRight && (
              <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] overflow-hidden">
                {headerRight}
              </div>
            )}
          </div>
        </header>

        {/* ── Desktop Header ── */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 px-8 py-5 items-center gap-4 sticky top-0 z-30 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800">{pageTitle}</h1>
            {pageSubtitle && <p className="text-sm text-slate-500">{pageSubtitle}</p>}
          </div>
          <div className="flex-1" />
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
