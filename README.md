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
   Untuk RT, pilih **RW induk** berdasarkan nama/kode. Select hanya menampilkan RW.
5. Buka **Kartu Keluarga** (`/manage/households`): tambah KK dengan memilih **wilayah RT**;
   buka detail, ubah alamat/blok/nomor/hunian, dan simpan.
6. Dari detail KK, pilih **Lihat anggota keluarga**, lalu **Tambah warga**.
   KK terisi otomatis beserta referensi/alamatnya. Dari form tambah warga langsung,
   pilih KK melalui select. Nama wajib diisi; nomor HP/tanggal lahir opsional. Coba ubah data warga dan
   pastikan perubahan tersimpan setelah reload.
7. Coba filter nama RT, halaman berikut/sebelumnya, input kosong, dan respons
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

## Select referensi, tema, dan bahasa

- Form RT memilih RW induk; form KK memilih RT; form warga memilih KK melalui
  nama/kode atau referensi/alamat. UUID tetap menjadi payload internal API.
- Pencarian select bekerja pada pilihan yang sudah dimuat. Gunakan **Muat pilihan
  berikutnya** untuk mengambil halaman berikutnya (50 record per request).
  Data kosong, izin daftar tidak tersedia, dan kegagalan request ditampilkan;
  request gagal dapat dicoba lagi. Izin baca wilayah/KK diperlukan sesuai referensi.
- Tombol matahari/bulan dan pilihan **ID / EN** tersedia di login/pilih akses serta
  shell pengurus, sistem, warga, dan vendor. Bahasa default **Indonesia (`id`)**;
  tema awal mengikuti sistem. Pilihan manual tersimpan di browser dan bertahan
  setelah reload/logout. Preferensi tidak mengubah hak akses atau data backend.
- Terjemahan mencakup navigasi, formulir, status, validasi lokal, dan empty state
  pada halaman yang sudah tersedia. Nama/alamat data backend dan pesan validasi
  bebas dari backend tetap ditampilkan sesuai respons aslinya.

Tambahan checklist: ganti ID → EN, aktifkan mode gelap, reload, lalu buka form
KK/warga dan pilih akses lain. Coba kembali ke ID/terang, tampilan ponsel,
select kosong, pilihan di halaman berikutnya, dan retry saat jaringan gagal.
Fitur fase selanjutnya tetap belum dikerjakan.

## DataTable bersama

Semua tabel yang tersedia (KK, warga, wilayah) menggunakan `AppDataTable` dari
`@/design-system`, berbasis PrimeVue DataTable. Toolbar, pencarian, loading,
empty/error + retry, jumlah baris termuat, scroll horizontal, dan cursor pagination
berada dalam satu komponen. Halaman fitur hanya menentukan kolom, pencarian pada
field yang relevan, filter bisnis, dan query. Tabel fitur baru mengikuti pola ini.

- KK: alamat sebagai tautan detail, hunian, blok/nomor, status. Nama kepala keluarga
  belum tersedia pada DTO daftar backend; referensi teknis tidak dijadikan identitas tampilan.
- Warga: nama, nomor HP, status, aksi detail. Kolom referensi internal dihapus.
- Wilayah: nama, jenis RW/RT, dan kode wilayah yang dipahami pengurus.
- Klik judul kolom yang memiliki ikon sort; gunakan **Cari di halaman ini** untuk
  mencari alamat/nama/kode/telepon sesuai tabel. Pencarian dan sort hanya berlaku
  pada halaman cursor yang dimuat, serta direset ketika halaman/filter server berubah.
  API belum menyediakan pencarian/sort global dan total baris; UI tidak mengarang total.

Checklist: cari lalu hapus pencarian, coba kata yang tidak cocok, urutkan kolom,
pindah cursor, buka detail dari alamat/nama, serta cek tabel pada ponsel, dark mode,
dan EN. Tes komponen mencakup slot kolom, search/sort/reset, opaque cursor,
loading/error/empty/retry; tes browser memastikan referensi internal tidak tampil.

## Hasil verifikasi — 30 September 2026

| Pemeriksaan                                 | Hasil             |
| ------------------------------------------- | ----------------- |
| Install dari lockfile                       | Lulus             |
| Unit test (Vitest 4, 10 file)               | **39/39 lulus**   |
| Browser E2E (Chromium)                      | **26/26 lulus**   |
| TypeScript source Vue dan konfigurasi Node  | Lulus             |
| ESLint dan Prettier                         | Lulus             |
| Production build + service worker           | Lulus             |
| OpenAPI generated-client drift              | Lulus             |
| Health backend melalui `localhost:5173/api` | HTTP 200, healthy |

Unit test mencakup session, environment, permission presentation, pembersihan
cache saat logout/context berubah, error normalization, transport generated API,
dan idempotency retry. E2E mencakup login email/HP, redirect, forced password
change, sesi kedaluwarsa, outage/retry, reset email, akses terbatas, CRUD KK,
cursor pagination, validasi server, dan layout mobile. Tambahan tes mencakup
filter jenis referensi, RW pada halaman berikutnya, KK terpilih di luar halaman
pertama, retry select, persistensi bahasa/tema, dan kontrol preferensi di semua shell.

E2E memakai fixture kontrak. Login akun development dan pembacaan daftar backend
nyata telah diperiksa pada iterasi UI; CRUD nyata dan multi-scope backend belum
divalidasi. Shell warga/vendor diperiksa lewat component test karena kontrak
context scoped belum tersedia. CI remote dan uji manual pengguna masih pending.

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
