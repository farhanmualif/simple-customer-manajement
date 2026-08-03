# WiFi RT/RW Net — Sistem Pencatatan Pembayaran

Aplikasi web mobile-first untuk admin mencatat status pembayaran WiFi pelanggan bulanan.

---

## Asumsi yang Diambil

- **Single admin** — satu PIN untuk satu pengelola RT/RW Net
- **PIN default: `1234`** — ganti setelah setup pertama (via seed ulang atau edit database langsung)
- **Bulan berjalan** = bulan kalender saat ini
- **Jatuh tempo** = tanggal tertentu tiap bulan (bukan periode tertentu)
- **Multi-tenant tidak diimplementasikan** di versi ini

---

## Setup Development

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi database
Salin `.env.example` menjadi `.env` lalu isi:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SESSION_SECRET="string-acak-minimal-32-karakter"
```

### 3. Push schema ke database
```bash
npx prisma db push
```

### 4. Isi data awal (seed)
```bash
npm run db:seed
```

Seed akan membuat:
- 1 admin dengan **PIN: 1234**
- 3 paket (10/20/50 Mbps)
- 8 pelanggan contoh (3 sudah bayar bulan ini, 5 belum)

### 5. Jalankan development server
```bash
npm run dev
```

Buka `http://localhost:3000` → otomatis redirect ke `/login`.

---

## Struktur Halaman

```
/ → redirect ke /login atau /menu
/login          Masukkan PIN 4 digit (keypad besar, touch-friendly)
/menu           Menu utama: Dashboard | Data Pelanggan
/dashboard      Ringkasan pemasukan bulan ini (balance card style)
/pelanggan      List pelanggan + search + filter status
/pelanggan/[id] Detail pelanggan + riwayat + tombol tandai bayar
/pelanggan/tambah  Form tambah pelanggan baru
```

---

## Deploy ke VPS (Dokploy)

```bash
# Build production
npm run build

# Jalankan server
npm start
```

Pastikan environment variables `DATABASE_URL` dan `SESSION_SECRET` sudah diset di VPS.

---

## Database Commands

```bash
npm run db:generate   # Generate Prisma client setelah ubah schema
npm run db:push       # Push schema ke database (development)
npm run db:seed       # Isi data awal
npm run db:studio     # Buka Prisma Studio (GUI database)
```
