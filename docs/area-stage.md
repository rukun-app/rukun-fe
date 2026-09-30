# FE-3 tahap 3 — detail, edit, hapus wilayah

Penyerahan 1 Oktober 2026. Buka **Wilayah RT/RW → klik nama wilayah**.

- Detail membutuhkan `areas.view`. Edit/hapus ditampilkan hanya untuk `areas.manage`; backend tetap memeriksa akses record.
- PATCH memakai code (maks. 20) dan name (maks. 100), trim + wajib diisi. Schema/payload digunakan bersama create/edit; field immutable dan extra response tidak ikut dikirim.
- Jenis wilayah dan RW induk tidak dapat diubah. Induk dibaca dari GET area detail, ditampilkan dengan nama/kode, dengan fallback dan retry tanpa UUID.
- Hapus memakai ConfirmDialog PrimeVue dengan nama/kode dari server. Cancel tidak mengirim DELETE. Perubahan belum disimpan diberi peringatan jika akan dibuang.
- Tidak ada optimistic deletion. 403/409/422 mempertahankan form dan menampilkan error server. Wilayah masih digunakan ditolak backend; frontend tidak menebak dependensi dari satu halaman tabel.
- Shared submit mengunci request rangkap. Shared leave guard menjaga perubahan belum disimpan. Cache Community (termasuk pilihan referensi) dibersihkan setelah sukses, lalu kembali ke daftar.
- UI memakai Form/InputText/Tag/Button/Message/ConfirmDialog PrimeVue, PageHeader, MutationErrors, dan query/composable bersama. Bahasa ID default, EN, dark mode dan mobile mengikuti shell.
- PATCH/DELETE tidak memiliki replay guarantee dalam OpenAPI. Header idempotency dari helper bukan jaminan exactly-once.

## Pengujian manual

1. Pilih RT dari tabel; lihat nama RW induk, tanpa input UUID.
2. Ubah kode/nama, simpan, buka kembali; periksa nilai dari backend dan pilihan wilayah pada form KK.
3. Coba kode kosong/duplikat, nama terlalu panjang, akses read-only, serta akses dicabut backend.
4. Edit lalu tinggalkan halaman: batalkan dialog leave dan pastikan perubahan tetap ada.
5. Klik Hapus wilayah, lalu Batal: data tetap.
6. Pada data development yang tidak direferensikan, konfirmasi hapus dan periksa daftar terbaru.
7. Coba wilayah yang masih dipakai: backend menolak, halaman/form tetap tersedia.
8. Coba layar ponsel, ID/EN dan dark mode; periksa konfirmasi hapus dan retry detail/induk.

Tes otomatis memakai fixture API; tidak menghapus wilayah development nyata. Review kontrak dan backlog sampai FE-3 ada di [review OpenAPI](openapi-review-fe0-fe3.md). FE-4 belum dimulai.
