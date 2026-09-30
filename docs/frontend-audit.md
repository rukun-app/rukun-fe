# Audit frontend — diperbarui 1 Oktober 2026

## Penyebab aplikasi tidak dapat dibuka

Guard lama memakai `to.matched.some(r => r.meta.requiresAuth !== false)`.
Layout `/auth` tidak memiliki nilai `requiresAuth`; `undefined !== false` membuat
login dianggap protected dan mengarah ke login lagi. Guard sekarang membaca
metadata gabungan Vue Router, menunggu hydration profil sebelum memeriksa akses,
dan menangani kegagalan hydration dengan halaman retry.

Masalah lain yang diperbaiki:

- InputText/Button di halaman auth belum diimpor; PrimeVue tidak mendaftarkan semua komponen otomatis.
- Login tidak mengembalikan `contexts`; `/auth/me` mengembalikan profil langsung dalam `data`, bukan `data.user`.
- Forgot-password membutuhkan `email`, bukan `identifier`; SMS reset tidak tersedia.
- HTTP belum memiliki timeout; request sekarang dibatasi 15 detik.
- Token expiry/logout/context switch belum membersihkan cache server state.
- `vue-tsc --noEmit` menunjuk tsconfig root dengan `files: []`, sehingga laporan tanpa error sebelumnya bukan pemeriksaan source aplikasi.
- Orval menunjuk file backend yang tidak ada dan Axios mutator belum sesuai return type generated contract.
- API drift CI dinonaktifkan; browser smoke sebelumnya hanya memeriksa judul halaman.
- PrimeIcons dan integrasi token warna Tailwind/PrimeVue belum terpasang.

## Kontrak aktual dan batas akses

Kontrak sementara `FILE_BE/openapi.json` yang diberikan pengguna pada 1 Oktober
2026 identik secara semantik dengan `openapi/rukun.json`: 126 path, 155 operasi,
193 schema. Semua referensi lokal ter-resolve. Pernyataan audit lama bahwa
salinan FILE_BE tertinggal tidak berlaku untuk berkas OpenAPI ini.
[Review endpoint dan gap FE-0–FE-3](openapi-review-fe0-fe3.md) menjadi rujukan
status terbaru. Keberadaan endpoint bukan bukti seluruh gate bisnis lulus.

Pada audit awal, pembacaan `Modules/Identity/Http/AuthController.php` mengonfirmasi
bahwa `userData()` hanya mengekspor permission global. Tidak ada endpoint context
atau validasi `X-Rukun-Context` dalam kontrak yang tersedia.

Implementasi awal menyediakan pilihan presentation management/system hanya
jika **permission global aktual** mendukungnya. Pilihan ini tidak mengklaim sebagai
scope RT/RW dan tidak mengirim header context buatan. Role name tidak digunakan
untuk mengasumsikan permission. Akun tanpa permission global mendapatkan halaman
akses kosong yang dapat ditutup dengan logout, bukan loading tanpa akhir.

Perubahan terbaru sudah menambahkan contexts dari profil server ke frontend.
Integrasi isolasi scope nyata belum diverifikasi pada tahap mutasi ini.
Untuk menyelesaikan gate FE-2/FE-3 scoped, berikut yang tetap perlu diverifikasi:

1. Daftar context milik actor: ID stabil, type, label, scope type/public UUID, capabilities efektif.
2. Context mencakup assignment temporal aktif serta membership household milik actor; global permissions tidak ditempelkan sembarangan ke context scoped.
3. Validasi `X-Rukun-Context` pada request domain, tidak mempercayai ID dari client.
4. Stable error code untuk context invalid/revoked/expired.
5. Schema OpenAPI dan test pengguna multi-assignment, RW inheritance, cross-RT denial, vendor isolation, dan revoked assignment.

Tidak ada perubahan backend dilakukan dalam pekerjaan frontend ini.

## Audit tiap fase

| Fase  | Hasil pemeriksaan / pekerjaan                                                                                                                                                                                        | Gate yang masih terbuka                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| FE-0  | Client/types Orval dari snapshot aktual, proxy `/api`, timeout, typecheck source, pinned pnpm, CI/drift check                                                                                                        | CI remote belum dijalankan                                                                |
| FE-1  | Komponen auth terpasang, token warna/icons terhubung, sidebar mobile, logout/switch access                                                                                                                           | Audit keyboard/a11y seluruh shell; bukan hanya login/dashboard                            |
| FE-2  | Login email/HP, profile hydration, initial password guard, session expiry/retry, email recovery, capability guard dan cache cleanup                                                                                  | Context scoped backend, validasi multi-scope/revocation end-to-end                        |
| FE-3  | Tahap 1–3: detail/edit/hapus wilayah, mutasi/riwayat membership, dashboard pengurus, daftar/detail/create/update Household/Resident, cursor pagination, daftar/create wilayah, Zod forms, error/loading/empty states | Profile/inbox, import/export UI, scoped assignments, sensitive reveal; gate isolasi scope |
| FE-4  | API Billing tersedia; belum diimplementasikan FE                                                                                                                                                                     | FE-2/3 scoped dan seluruh financial journeys                                              |
| FE-5  | API WiFi/galon tercantum pada backend live; FE belum diimplementasikan                                                                                                                                               | Verifikasi readiness backend dan FE-4                                                     |
| FE-6  | Foundation Payments tersedia; integrasi Billing/QRIS belum terbukti siap                                                                                                                                             | Contract invoice checkout/reservation/verified receipt                                    |
| FE-7  | Pengumuman/layanan warga belum tersedia pada snapshot ini                                                                                                                                                            | Backend F6                                                                                |
| FE-8  | Ronda/kegiatan belum tersedia pada snapshot ini                                                                                                                                                                      | Backend F7                                                                                |
| FE-9  | Marketplace belum tersedia pada snapshot ini                                                                                                                                                                         | Backend F8                                                                                |
| FE-10 | HOLD sesuai rencana                                                                                                                                                                                                  | Hardware dan PoC                                                                          |

FE-3 tidak ditandai selesai dan pekerjaan tidak dilanjutkan ke transaksi finansial
sebelum fondasi scope siap. NIK/KK tidak dibaca dari list/detail dan tidak dimuat
sebelum tersedia flow sensitive khusus. Endpoint yang belum siap tidak digantikan
dengan mock production atau perhitungan bisnis di frontend.

## Pengujian

E2E menggunakan response fixtures yang mengikuti schema backend, tanpa membuat
akun/transaksi pada database development. Health check melalui proxy `/api`
dilakukan ke backend live. Login akun development dan GET daftar telah diperiksa pada iterasi UI. CRUD
nyata dan validasi multi-scope backend belum dilakukan; ini belum merupakan
pengujian integrasi penuh.

Client generated harus dihasilkan kembali dengan `pnpm api:generate` setiap
snapshot kontrak diperbarui, kemudian `pnpm api:check`. Check ini mendeteksi drift
terhadap snapshot versioned, bukan polling backend live pada setiap CI run.

## Hasil penyerahan tahap ini

Pada Node 24: typecheck aplikasi/config, lint, format,
production build, dan OpenAPI drift check lulus. Vitest: **57 unit/component test / 15 file
lulus**. Playwright Chromium: **49 test lulus**. Login dan dashboard mobile
juga diperiksa secara visual dari screenshot browser.

Sesuai arahan pengguna, pekerjaan berhenti pada perbaikan foundation/auth dan
FE-3 tahap 3 untuk testing manual. Pengembangan bagian FE-3 berikutnya maupun
FE-4 memerlukan instruksi lanjutan pengguna. Tidak ada klaim seluruh fase selesai.

## Penyempurnaan tahap 1: referensi dan preferensi UI

UUID manual diganti select RW/RT/KK dengan label, pencarian pada data termuat,
cursor load-more, dan retry. ID tetap dikirim melalui DTO generated. Tema gelap
dan bahasa ID/EN (default ID) tersedia pada auth dan semua shell; preferensi
tersimpan di localStorage tanpa menyimpan data referensi. Browser fixture menguji
management/system/auth; component test mencakup shell warga/vendor karena
integrasi scope backend nyata belum diverifikasi. Fase berikutnya belum dimulai.

## Konsolidasi DataTable

Tabel KK/warga/wilayah memakai AppDataTable bersama dari design system. Kolom
referensi teknis tidak ditampilkan; identitas KK menggunakan alamat yang tersedia
di DTO, warga menggunakan nama. Search dan sort terbatas halaman cursor dan
berlabel eksplisit; backend belum menyediakan search/sort global maupun total.
Tidak ada request per baris untuk menebak kepala keluarga. Test mencakup reusable
states, slots, search/sort reset, pagination, dan keterbacaan kolom di browser.

## Review maintainability sebelum fase berikutnya

Lihat [review komponen](component-review.md): duplikasi submit/guard diangkat ke
composable, opsi domain disatukan, query referensi dipisahkan dari view, dan
primitive custom diganti PrimeVue Toolbar/Message/Tag/Password. Refactor tetap
dalam fase saat ini; tidak mengubah authorization maupun kontrak backend.

## FE-3 tahap 2

Mutasi dan riwayat membership tersedia melalui generated endpoint Community.
Source backend mengonfirmasi validasi `residents.manage` pada warga dan tujuan,
serta filtering riwayat dengan `residents.view`. Endpoint tidak punya replay store
khusus Idempotency-Key; duplicate-submit lock FE dan transaksi/no-op backend
tidak diklaim sebagai exactly-once guarantee. Pengujian menggunakan fixtures,
bukan mutasi akun nyata. Detail ada di [catatan tahap 2](membership-stage.md).

## FE-3 tahap 3 dan audit kontrak sementara

Detail/edit/hapus wilayah tersedia, dengan schema dan payload create/edit bersama.
Hierarchy tidak dapat diubah; penghapusan memakai konfirmasi dan penolakan backend
tidak menghilangkan data/form. Checklist ada di [catatan wilayah](area-stage.md).

Gap prioritas sampai FE-3: recovery context/revocation dan kontrak transport,
reset password sampai selesai, sinkronisasi locale API/profil, account, inbox,
import/export, provisioning akun, scoped assignment, sensitive data dan gate
integrasi nyata. Rincian dan prioritas ada di [review OpenAPI](openapi-review-fe0-fe3.md).
Install frozen lockfile dan health backend terakhir diperiksa 30 September;
tidak diklaim diulang pada review kontrak 1 Oktober.
