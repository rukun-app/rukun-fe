# Rukun Frontend

Vue 3, TypeScript, PrimeVue 4, Tailwind 4, TanStack Vue Query, dan Orval.

## Menjalankan lokal

Gunakan Node 24 (lihat `.nvmrc`) dan pnpm 12.6.0.

```sh
nvm use
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Buka `http://localhost:5173`. Vite meneruskan `/api` ke
`API_PROXY_TARGET` (default backend lokal `https://rukun.p85.test:8443`).
`secure: false` hanya digunakan oleh proxy development untuk sertifikat lokal.
Deployment production membutuhkan reverse proxy HTTPS `/api` ke Laravel.

Jika port 5173 sudah dipakai, gunakan URL yang dicetak Vite. Aplikasi yang berjalan
di port berbeda tidak memakai token localStorage yang sama.

## Validasi

```sh
pnpm api:check
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build-only
pnpm exec playwright install chromium
pnpm test:e2e
```

OpenAPI backend disimpan dalam `openapi/rukun.json`; generated client di
`src/api/generated` tidak diedit manual. Setelah mengganti snapshot kontrak,
jalankan `pnpm api:generate` dan commit keduanya. Backend contract tidak boleh
berisi credential atau token nyata.

## Status

Perbaikan foundation/auth dan implementasi awal FE-3 tersedia. Context scoped
RT/RW/Household/Vendor belum diekspos backend. Saat ini menu management/system
hanya berasal dari permission global yang benar-benar dikirim server.

Detail temuan, batas pengujian, dan gate tiap fase ada di
[Audit frontend](docs/frontend-audit.md) serta [Rencana frontend](plan-fe.md).

## Batas pengerjaan per fase

Setelah satu fase/tahap diserahkan, pengembangan berhenti agar Anda dapat menguji.
Fase berikutnya dilanjutkan setelah instruksi Anda. Plan dan README diperbarui
bersama implementasi serta hasil unit test. **Penyerahan saat ini: perbaikan
fondasi/login dan FE-3 tahap 1; FE-3 belum selesai seluruhnya. FE-4 belum dimulai.**

## Checklist pengujian manual saat ini

Gunakan akun development yang mempunyai permission global terkait. Akun scoped
RT/RW/Household/Vendor belum dapat diuji penuh karena backend belum mengekspor
context dan capability efektif. Tidak ada akun atau password baru yang dibuat
oleh pekerjaan frontend ini.

1. Buka `http://localhost:5173`; form login harus tampil tanpa redirect berulang.
2. Login dengan email atau nomor HP. Jika akun wajib mengganti password, halaman
   ganti password harus muncul sebelum halaman bisnis.
3. Jika tersedia lebih dari satu pilihan akses, pilih **Pengelolaan lingkungan**.
4. Buka **Wilayah** (`/manage/areas`): lihat daftar dan buat RW/RT jika berwenang.
   Untuk RT, masukkan UUID RW induk yang ditampilkan di daftar.
5. Buka **Kartu Keluarga** (`/manage/households`): tambah KK memakai UUID RT;
   buka detail, ubah alamat/blok/nomor/hunian, dan simpan. UUID masih dimasukkan
   manual pada tahap awal ini.
6. Dari detail KK, pilih **Lihat anggota keluarga**, lalu **Tambah warga**.
   Nama wajib diisi; nomor HP/tanggal lahir opsional. Coba ubah data warga dan
   pastikan perubahan tersimpan setelah reload.
7. Coba filter UUID RT, halaman berikut/sebelumnya, input kosong, dan respons
   validasi dari backend. Error harus tampil; NIK/KK tidak diambil otomatis.
8. Coba akun hanya-baca: tombol tambah/simpan harus dibatasi; direct URL tambah
   harus menampilkan halaman akses tidak tersedia.
9. Coba **Keluar**, buka kembali URL protected, dan tes tampilan di layar ponsel.
10. Pada halaman lupa password, uji email. Pemulihan lewat SMS tidak tersedia;
    akun yang hanya memakai nomor HP diarahkan menghubungi pengurus.

Yang **belum tersedia** pada tahap FE-3 ini: dashboard warga, profil/inbox,
mutasi keanggotaan, import/export UI, pengelolaan scoped assignment,
reveal/edit NIK/KK, serta edit/hapus wilayah. Menu finansial/layanan belum
ditampilkan sebagai fitur siap pakai.

Tes browser memakai fixture API, sehingga tidak menulis data ke database nyata.
Pengujian manual CRUD di atas memang menulis data development.

## Hasil verifikasi — 30 September 2026

| Pemeriksaan                                 | Hasil             |
| ------------------------------------------- | ----------------- |
| Install dari lockfile                       | Lulus             |
| Unit test (Vitest 4, 6 file)                | **20/20 lulus**   |
| Browser E2E (Chromium)                      | **15/15 lulus**   |
| TypeScript source Vue dan konfigurasi Node  | Lulus             |
| ESLint dan Prettier                         | Lulus             |
| Production build + service worker           | Lulus             |
| OpenAPI generated-client drift              | Lulus             |
| Health backend melalui `localhost:5173/api` | HTTP 200, healthy |

Unit test mencakup session, environment, permission presentation, pembersihan
cache saat logout/context berubah, error normalization, transport generated API,
dan idempotency retry. E2E mencakup login email/HP, redirect, forced password
change, sesi kedaluwarsa, outage/retry, reset email, akses terbatas, CRUD KK,
cursor pagination, validasi server, dan layout mobile.

E2E memakai fixture kontrak, **belum merupakan validasi login/CRUD dengan akun
nyata atau multi-scope backend**. CI remote dan uji manual pengguna masih pending.

## Peta kode

- `src/app`: bootstrap, router, layout, config, dan provider Query.
- `src/auth`: API authentication, session abstraction, hydration, dan halaman auth.
- `src/contexts`: presentation context dan capability helper; backend tetap
  menjadi security boundary.
- `src/api/generated`: client/types dari OpenAPI; mutator Axios menjaga response
  envelope backend, mengirim bearer token dan request ID, serta membatasi timeout.
- `src/features/community`: FE-3 tahap 1 dan query dengan key context.
- `src/design-system`: komponen reusable di atas PrimeVue/Aura.
- `src/i18n`: locale Indonesia; migrasi seluruh copy halaman ke translation key
  masih perlu dilengkapi.
- `src/pwa`: PWA hanya precache app shell/assets; UI update prompt masih pending.

Server state berada di TanStack Query. Pinia menyimpan context/UI state; token
melalui session abstraction. Generated hooks dibungkus domain query agar scoped
cache tidak memakai key global yang sama.
