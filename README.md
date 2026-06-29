# Login Edu

Sistem Management Bimbingan Belajar (Bimbel) - "Login Aja Dulu!"
Dibangun dengan Next.js App Router, Supabase, Tailwind CSS v4, dan terintegrasi dengan Cloudflare Turnstile serta Upstash Redis.

## Setup Environment

Salin `.env.local.example` ke `.env.local` dan isi nilainya:

```bash
cp .env.local.example .env.local
```

Variabel yang dibutuhkan:
- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (dari Supabase Dashboard)
- `SUPABASE_SERVICE_ROLE_KEY` (untuk operasi Admin, bypass RLS)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` (dari Cloudflare Turnstile)
- `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` (opsional, untuk Rate Limiting. Jika tidak ada akan fallback ke in-memory)

## Database Setup

1. Buka Supabase SQL Editor
2. Jalankan isi dari file `supabase/migrations/001_initial_schema.sql`
3. Ini akan membuat semua tabel, index, RLS policies, dan trigger yang dibutuhkan.

## Menjalankan Aplikasi Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

- Halaman Admin: `http://localhost:3000/geheime-verwaltung/login`
- Halaman Siswa: `http://localhost:3000/login`

## Mode Produksi (Build)

Setiap kali melakukan perubahan, pastikan TypeScript lolos kompilasi:
```bash
npm run build
```

## Fitur Utama

- **Authentication & Security**: Email/password auth, perlindungan bot dengan Turnstile, dan rate limiter.
- **Fokus Mode**: UI fullscreen untuk ujian/tryout dengan fitur anti-copy dasar dan timer.
- **Auto-Save**: Jawaban tersimpan otomatis ke database setiap beberapa detik.
- **Grading & Export**: Panel penilaian admin yang lengkap dengan kemampuan ekspor data ke format Excel (.xlsx).
- **JSON Question Engine**: Sistem parsing soal dinamis berbasis JSON yang mendukung Pilihan Ganda, Menjodohkan, Essay, Isian Singkat, dan Listening Audio.

## Keterbatasan Audio Listening (Google Drive)
Sistem secara otomatis mengubah link sharing Google Drive biasa menjadi direct-download link agar bisa diputar di tag `<audio>`.
Namun, Google Drive memiliki batas bandwidth yang ketat. Jika file audio diakses oleh ratusan siswa bersamaan saat Tryout Akbar, Google dapat memblokir akses file secara sementara (HTTP 403/Too Many Requests).
Sangat disarankan untuk menghosting file audio di CDN (seperti AWS S3, Cloudflare R2, atau Supabase Storage) untuk menghindari limit tersebut pada skala besar.

## Checklist H-1 Tryout Akbar

- [ ] Pastikan plan Supabase mencukupi (Pro tier disarankan jika > 100 concurrent users).
- [ ] Verifikasi `token` program sudah di-generate dan masa aktifnya benar.
- [ ] Soal JSON sudah divalidasi dan diuji coba dengan satu akun dummy.
- [ ] Redis (Upstash) dikonfigurasi untuk mencegah serangan DDOS dan bypass Rate Limit.
- [ ] Cache Vercel dikosongkan (jika ada pembaruan besar pada menit-menit terakhir).
