# FE-3 tahap 2 — mutasi dan riwayat keluarga

## Cakupan

Dari **Data Warga → detail warga → Keanggotaan dan riwayat keluarga**, pengurus
membuka `/manage/residents/:id/membership`.

- Baca keluarga saat ini dan riwayat dengan cursor backend.
- Pindahkan warga ke keluarga tujuan melalui select alamat keluarga.
- Pilih keluarga yang sama untuk memperbarui hubungan (kepala keluarga, pasangan,
  anak, orang tua, lainnya).
- Akhiri keanggotaan tanpa menghapus record warga.
- Tinjau nama warga, alamat tujuan, hubungan, dan dampak akses di PrimeVue
  ConfirmDialog. Membatalkan dialog tidak mengirim mutation.
- Riwayat memakai AppDataTable; waktu mengikuti timestamp server dan zona waktu
  browser. Pencarian/sort hanya berlaku pada halaman yang dimuat.

## Kontrak dan authorization

Kontrak generated yang dipakai:

| Operasi              | Endpoint                                              | Izin yang diperiksa backend                          |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Detail warga         | GET `/api/community/residents/{resident}`             | `residents.view` pada warga                          |
| Riwayat              | GET `/api/community/residents/{resident}/memberships` | `residents.view`; hanya household yang boleh diakses |
| Mutasi               | PUT `/api/community/residents/{resident}/membership`  | `residents.manage` pada warga dan household tujuan   |
| Nama/alamat keluarga | GET `/api/community/households/{household}`           | `households.view`                                    |

Perilaku dikonfirmasi melalui OpenAPI versioned serta pembacaan source backend
`PopulationController::move/memberships` dan `PopulationService::move`.
Backend menutup membership lama, mengelola akses lama, dan membuat membership baru
jika ada tujuan. Destination/resident tidak aktif dapat menghasilkan 409.

Payload mutasi hanya `household_id` dan `relationship`. Mengakhiri keanggotaan
mengirim `{ household_id: null, relationship: 'other' }`, karena kontrak tetap
mewajibkan enum relationship. Tidak ada tanggal efektif buatan frontend.

Frontend membatasi kontrol memakai capability aktual. Akun `residents.view` saja
boleh membaca riwayat, tetapi tidak memperoleh form mutasi atau request alamat
keluarga jika tidak mempunyai `households.view`. Backend tetap otoritatif untuk
izin per record/tujuan, bukan daftar pilihan frontend.

Nama/alamat riwayat diambil hanya untuk ID dalam halaman riwayat terotorisasi,
dideduplikasi dan memakai cache query Household bersama (maksimum 20 ID unik per
halaman). Alamat gagal/terlarang memakai label generik; UUID tidak menjadi fallback.
Tidak ada request endpoint sensitive, NIK, atau nomor KK.

## Konsistensi

- Form dan dialog mengunci duplicate submit; helper idempotency mengirim request
  key. Endpoint membership saat ini tidak memiliki penyimpanan replay key khusus:
  jangan menganggap header saja memberi exactly-once guarantee. Backend menangani
  state dengan transaksi/lock dan no-op jika household + hubungan sudah sama.
- Tidak ada optimistic mutation atau perhitungan membership aktif di frontend.
- 403/409/422 menampilkan error server dan mempertahankan tampilan sebelumnya;
  retry membutuhkan tinjau/konfirmasi kembali.
- Setelah sukses: batalkan query community, hapus cache lama, refresh profile,
  lalu kembali ke daftar warga. Ini menghindari bertahan di detail yang aksesnya
  mungkin sudah dicabut oleh server.
- Perubahan form dilindungi useUnsavedChanges; dialog ditutup saat unmount.

## Checklist manual

1. Buka detail warga yang sudah terhubung dengan KK; buka keanggotaan/riwayat.
2. Pastikan keluarga ditampilkan dengan alamat, bukan UUID. Coba pagination riwayat.
3. Pilih KK lain dan hubungan; klik **Tinjau perubahan**, lalu **Batal**. Data tetap.
4. Ulangi dan pilih **Ya, simpan mutasi**. Setelah kembali ke daftar, buka detail
   lagi; keluarga baru dan riwayat berasal dari respons backend.
5. Pilih KK yang sama, ganti hubungan, lalu konfirmasi. Periksa riwayatnya.
6. Pilih **Akhiri keanggotaan**. Pastikan peringatan muncul dan warga tidak dihapus.
7. Uji akun read-only, tujuan di luar scope, tujuan tidak aktif, request gagal,
   serta retry. Jangan memakai data production untuk percobaan mutasi.
8. Coba ID/EN, dark mode, dan ponsel; tabel dapat digeser horizontal.

Pengujian otomatis memakai fixture API dan tidak menulis record development.
Gate scoped RT/RW/multi-assignment pada backend nyata tetap perlu diverifikasi.
FE-3 belum selesai keseluruhan; import/export, scoped assignment, data sensitif,
CRUD wilayah lengkap, dashboard warga, serta FE-4 berada di luar tahap ini.
