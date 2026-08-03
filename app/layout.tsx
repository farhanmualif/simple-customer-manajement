import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WiFi RT/RW Net",
  description: "Sistem pencatatan pembayaran WiFi RT/RW Net",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WiFi RT/RW",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4338ca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans bg-slate-100">
        {children}
      </body>
    </html>
  );
}
