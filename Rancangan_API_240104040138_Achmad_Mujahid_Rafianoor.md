# Rancangan API Katalog Perpustakaan

**Nama:** Achmad Mujahid Rafianoor  
**NIM:** 240104040138  
**Mata Kuliah:** Web Service Engineering

## Tujuan dan consumer
Layanan menyediakan katalog buku yang dapat dibaca dan dikelola oleh consumer melalui HTTP. Consumer dapat berupa aplikasi web, aplikasi mobile, atau client terminal yang mengirim request ke provider Express.

## Model data
| Field | Tipe | Aturan |
|---|---|---|
| `id` | Number integer positif | Dibuat server; tidak dikirim pada body POST/PUT; harus integer aman JavaScript. |
| `judul` | String | Setelah `trim`, panjang 1-120 unit string UTF-16. |
| `tersedia` | Boolean | Wajib `true` atau `false`; string ditolak. |

Body POST/PUT hanya boleh berisi `judul` dan `tersedia`. Field tambahan ditolak.

## Kontrak endpoint
| Metode dan path | Input | Sukses | Kegagalan utama |
|---|---|---|---|
| GET `/api/buku` | Query `q` opsional, maksimal 80 unit string | 200 dan array buku | 400 `INVALID_QUERY` |
| GET `/api/buku/:id` | ID pada path | 200 dan satu objek | 400 `INVALID_ID`, 404 `BOOK_NOT_FOUND` |
| POST `/api/buku` | JSON `judul`, `tersedia` | 201, objek baru, header `Location` | 400, 413, 415 |
| PUT `/api/buku/:id` | ID dan seluruh field yang dapat ditulis | 200, objek pengganti | 400, 404, 413, 415 |
| DELETE `/api/buku/:id` | ID pada path | 204 tanpa body | 400, 404 |

ID harus berupa digit desimal positif tanpa nol di depan. Pencarian mengabaikan kapitalisasi. Query `q` berulang ditolak. Content-Type POST dan PUT harus `application/json`; body dibatasi 10 KB.

## Bentuk respons
Berhasil: `{"success":true,"data":{"id":1,"judul":"Dasar Pemrograman Kotlin","tersedia":true}}`.

Gagal: `{"success":false,"error":{"code":"BOOK_NOT_FOUND","message":"Buku tidak ditemukan."}}`.

Respons daftar selalu memakai array. Pencarian tanpa hasil menghasilkan 200 dengan array kosong. DELETE 204 tidak memiliki body.

## Arsitektur
Consumer → middleware Express → router → controller → service → repository. Router memetakan metode/path dan memvalidasi parameter ID. Controller menangani konteks HTTP dan status. Service menjalankan aturan aplikasi dan validasi data. Repository mengakses array dalam memori. Error handler mengubah kegagalan menjadi respons JSON terkontrol.

## Batasan
Server berjalan lokal pada `127.0.0.1:3200`. Penyimpanan hanya array di memori, tanpa login, database, transaksi peminjaman, atau persistensi. Data tambahan hilang setelah proses server dimulai ulang.
