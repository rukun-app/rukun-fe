# Preferensi notifikasi — tahap 2

Penyerahan 2 Oktober 2026. Buka **Menu akun → Notifikasi → Preferensi notifikasi**
atau `/notifications/preferences`. Halaman tersedia untuk seluruh jenis akses.

## Perilaku

- PrimeVue DataTable dan ToggleSwitch menampilkan kategori Keamanan, Akun, dan
  Sistem serta kanal Inbox aplikasi dan Email. Pencarian/sorting menggunakan
  wrapper tabel bersama; ID default, EN, dan dark mode tetap tersedia.
- Nilai awal dan `locked_channels` selalu berasal dari GET
  `/notification-preferences`. Kanal wajib aktif, disabled, dan berlabel Wajib.
  Aturan tidak di-hardcode berdasarkan nama kategori.
- Simpan memakai PUT `/notification-preferences` melalui generated client;
  hanya kategori yang berubah dikirim, berisi kategori dan dua boolean kanal.
  Metadata lock tidak dikirim. Adapter memeriksa lock baseline sebelum request.
- Simpan dinonaktifkan saat belum ada perubahan atau request sedang berjalan.
  Berhasil menyimpan mengadopsi respons resmi server dan membersihkan dirty state.
- Error tidak menghapus pilihan pengguna dan tidak menampilkan sukses palsu.
  Batalkan perubahan memulihkan snapshot terakhir yang berhasil dimuat/disimpan.
- Navigasi/reload dengan perubahan belum disimpan memicu konfirmasi. Refetch
  window focus/reconnect dinonaktifkan agar tidak menimpa edit.
- Inbox dan preferensi memakai `AccountWorkspace` yang sama untuk header,
  menu akun, dan preferensi tampilan; tanpa menduplikasi shell.

## Kontrak dan batas

DTO respons OpenAPI masih generik. Adapter runtime Zod memeriksa envelope,
boolean, kategori yang didukung, kategori duplikat, dan required-channel invariant.
Respons tidak lengkap/inkonsisten menjadi error dan tidak membuat nilai default
editable. Rujukan bentuk respons: `PreferenceController` dan
`NotificationRegistry` backend lokal; file generated tidak diedit.

Preferensi berlaku untuk notifikasi berikutnya dan tidak mengubah riwayat inbox.
UI tidak mengirim email, membuat notifikasi, atau menguji delivery nyata.
Pengujian otomatis memakai fixture; persistensi/delivery/ownership lintas akun
pada backend nyata masih perlu diuji manual. Backend tetap menentukan kanal wajib;
bila aturan berubah ketika form terbuka, penolakan server ditampilkan dan pilihan
lokal dipertahankan. Setelah reload, nilai resmi mengikuti server.

## Checklist manual

1. Masuk sebagai warga/pengurus/vendor, buka halaman preferensi dari inbox.
2. Cocokkan nilai awal dan kanal berlabel Wajib; kanal wajib tidak bisa dimatikan.
3. Ubah kanal opsional. Simpan, lalu reload: nilai harus mengikuti server.
4. Ubah lagi, coba kembali ke inbox dan batalkan navigasi: pilihan tetap ada.
5. Klik Batalkan perubahan: nilai kembali dan tombol Simpan nonaktif.
6. Uji error 422/403/jaringan, retry, ID/EN, dan dark mode pada mobile.
7. Dengan backend development, uji delivery notifikasi baru setelah preferensi
   berubah; pastikan keamanan dan kanal wajib tetap mengikuti kebijakan server.

Hapus pesan, badge global, realtime, deep-link pergantian context, dan FE-4 belum
termasuk penyerahan ini.
