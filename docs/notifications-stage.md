# Inbox notifikasi — tahap 1

Penyerahan 2 Oktober 2026. Buka **Menu akun → Notifikasi** atau `/notifications`.
Route warga `/app/notifications` mengarah ke halaman yang sama. Semua jenis akses
memakai inbox milik akun yang sedang login; backend memeriksa kepemilikan pesan.

## Fitur

- AppDataTable berbasis PrimeVue, judul/kategori/status/tanggal yang terbaca.
- Filter kategori dan status di server; cursor pagination tanpa mengubah cursor.
  Pencarian dan pengurutan hanya berlaku pada halaman yang dimuat.
- Jumlah belum dibaca dari server untuk seluruh akun, tidak mengikuti filter.
  Kegagalan mengambil jumlah tampil sebagai `—`, bukan nol palsu.
- Detail melalui PrimeVue Dialog. Membuka detail tidak otomatis mengubah status.
- Tombol tandai dibaca/belum dibaca; status diperbarui setelah respons server dan
  refetch. Error tetap menampilkan status terakhir dengan tombol retry.
- Konfirmasi tandai semua dibaca mencakup seluruh inbox, termasuk di luar filter.
- Loading, empty, error/retry, ID default/EN, dan dark mode. Query daftar/detail
  menggunakan key akun dan locale agar pesan terjemahan tidak tertukar.

## Kontrak dan batas tahap

Generated client dari `openapi/rukun.json` dipakai tanpa perubahan generated code.
Schema notification pada snapshot masih object generik. Adapter Zod memvalidasi
response envelope, daftar, cursor, detail, dan count berdasarkan bentuk respons
`Modules/Notifications/Http/NotificationController.php` backend yang tersedia.
Respons yang tidak cocok menjadi error, bukan daftar kosong palsu.

Endpoint yang digunakan:

- GET `/notifications`, `/notifications/unread-count`, `/notifications/{id}`.
- PATCH `/notifications/{id}/read` untuk dibaca.
- DELETE `/notifications/{id}/read` untuk belum dibaca; bukan menghapus pesan.
- POST `/notifications/read-all` untuk tandai seluruh inbox dibaca.

Konten dirender sebagai teks. Field `action`/`context` tidak dijadikan tautan atau
perpindahan akses otomatis. Hapus pesan, badge global di shell,
realtime, dan deep-link dengan validasi context belum termasuk tahap ini.
Integrasi kepemilikan lintas akun pada backend nyata masih perlu diuji manual;
E2E menggunakan fixture API dan tidak mengubah notifikasi nyata.

## Checklist manual

1. Buka inbox dari akun warga/pengurus/vendor; cocokkan pesan dengan akun aktif.
2. Coba filter dibaca/belum dibaca dan kategori; buka halaman berikutnya, ganti
   filter, pastikan cursor kembali ke awal. Coba pencarian lokal dan sorting.
3. Buka detail: status tetap. Klik tandai dibaca, periksa detail/daftar/count;
   kembalikan menjadi belum dibaca.
4. Klik tandai semua, batalkan, kemudian konfirmasi. Perhatikan cakupan seluruh akun.
5. Uji jaringan gagal/403/404 dan daftar kosong; UI harus menyediakan retry.
6. Ganti ID/EN, dark mode, dan viewport mobile. Bahasa isi pesan mengikuti respons
   terjemahan backend; frontend menerjemahkan label UI.

Preferensi kanal dengan channel wajib dari server tersedia pada [tahap 2](notification-preferences-stage.md).
FE-4 billing belum dimulai.

Validasi inbox tahap 1: **88/88 unit test (22 file), 95/95 E2E Chromium**,
TypeScript, ESLint, Prettier, dan production build lulus. Tambahan tahap ini:
6 unit test untuk adapter/filter dan 11 E2E untuk akses lintas context, pagination,
read/unread/read-all, error/retry, rendering teks, dan mobile dark EN.
