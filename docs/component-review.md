# Review komponen — tahap FE-3 saat ini

Review mencakup komponen aplikasi/auth, design system, dan fitur community yang
sudah tersedia. Generated API tidak diedit; fase berikutnya belum dimulai.

## Temuan dan perbaikan

| Temuan                                                                                               | Implementasi                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tiga halaman mengulang busy, normalisasi error, dan idempotency submit                               | `useFormSubmission` dipakai KK, warga, dan wilayah. Payload, validasi, invalidasi cache, serta navigasi tetap ditentukan fitur.                                                                                    |
| Intent yang sudah sukses dapat memakai key lama ketika membuat record berikutnya dengan payload sama | Key dipertahankan untuk retry gagal dan dirotasi setelah seluruh alur sukses; kegagalan efek pascasimpan mempertahankan key retry.                                                                                 |
| Guard perubahan belum disimpan berulang dan hanya menangani leave                                    | `useUnsavedChanges` menangani leave, update route yang memakai komponen sama, reload/close, dan cleanup listener.                                                                                                  |
| Event Select tidak selalu memicu DOM change pada form                                                | Event PrimeVue Select ditangani eksplisit agar perubahan dropdown ikut dilindungi guard.                                                                                                                           |
| Refetch fokus/reconnect dapat mereset form edit melalui dataUpdatedAt                                | Auto refetch fokus/reconnect dinonaktifkan untuk query detail form. List tetap memakai kebijakan refetch sebelumnya; retry dan invalidasi eksplisit tetap tersedia.                                                |
| PageHeader tersedia tetapi lima halaman mengulang heading sendiri                                    | PageHeader yang sama kini berbasis PrimeVue Toolbar dan dipakai lima halaman community.                                                                                                                            |
| Kontrol tampil/sembunyikan password dibuat ulang                                                     | Login dan ganti password memakai PrimeVue Password. PassThrough bersama menyediakan label ID/EN dan aktivasi Enter/Space untuk ikon SVG bawaan; state tetap milik PrimeVue. Autocomplete diteruskan ke inputProps. |
| Alert mutasi dan badge status memakai primitive custom                                               | MutationErrors memakai PrimeVue Message di design system; StatusBadge memakai PrimeVue Tag. Adapter RecordStatus yang tidak diperlukan dihapus.                                                                    |
| Pilihan enum dan label form/tabel diduplikasi                                                        | `community/options.ts` menjadi sumber nilai schema Zod, label, dan opsi Select. Status KK/warga tetap memiliki himpunan berbeda. Helper tableLabels dihapus.                                                       |
| ReferenceSelect mencampur pengambilan data dan rendering                                             | Query, capability, cursor, preselected household, deduplikasi, dan retry dipindahkan ke `useReferenceOptions`; view tetap memakai PrimeVue Select/Button.                                                          |

## Batas reuse

Gunakan komponen PrimeVue langsung untuk primitive: Button, InputText, Select,
Password, Tag, Message, Toolbar, DataTable, Drawer, Menu, Skeleton, dan dialog.
Tidak dibuat framework UI atau generator form baru.

Wrapper hanya untuk kebijakan aplikasi yang benar-benar berulang:

- `AppDataTable`: PrimeVue DataTable + cursor API, search halaman, states dan toolbar.
- `PageHeader`: PrimeVue Toolbar + hierarki judul dan slot aksi.
- `MutationErrors`: PrimeVue Message + bentuk envelope error backend.
- `StatusBadge`: PrimeVue Tag + label/severity konsisten.
- `ReferenceSelect`: adapter domain untuk PrimeVue Select; data berada pada composable.
- `AppSkeleton`: pola tampilan loading di atas PrimeVue Skeleton.

Label, fieldset, paragraf, tautan, dan layout semantik tetap HTML/Vue biasa. Brand
serta ilustrasi lingkungan tetap dekorasi aplikasi. Shell memiliki navigasi sesuai
akses dan berbagi SessionActions/DisplayPreferences; tidak digabung menjadi satu
shell dengan banyak kondisi per role. Query resource tetap eksplisit agar izin,
parameter, serta kontrak generated tidak tersembunyi dalam generic CRUD framework.

Guard reload/close harus memakai mekanisme browser `beforeunload`. Konfirmasi
navigasi menggunakan guard native yang sama dengan alur sebelumnya; ini bukan
komponen dialog custom baru.

Primitive fondasi yang belum dipakai fitur berjalan (misalnya MoneyDisplay,
SensitiveValue, ConfirmAction) bukan bukti fitur finansial/data sensitif selesai.
Gate backend scoped, keamanan reveal, dan fitur fase berikutnya tetap pending.

## Konvensi untuk perubahan berikutnya

1. Cari komponen PrimeVue dan wrapper yang sudah ada sebelum menambah komponen.
2. Simpan state/asynchronous lifecycle bersama pada composable, bukan wrapper input.
3. Biarkan schema, payload API, capability, dan efek sukses pada modul pemiliknya.
4. Gunakan options domain yang sama untuk schema, label, dan Select; jangan mengubah
   nilai enum API saat mengganti bahasa.
5. Tambahkan regression test perilaku yang berubah, termasuk permission, keyboard,
   retry/idempotency, dan route guard. Jangan menguji hanya kemiripan markup.

## Verifikasi

46 unit/component test pada 13 file; 28 E2E Chromium pada run final `--workers=1`. Pengujian mencakup duplicate
submit, retry key, rotasi intent setelah sukses, efek sukses gagal, guard route dan
beforeunload, cleanup, opsi ID/EN, dropdown dirty state, serta Password keyboard.
Typecheck, lint, format, production build juga diperiksa. E2E menggunakan fixture
backend; tidak ada penulisan CRUD ke database nyata untuk refactor ini.
