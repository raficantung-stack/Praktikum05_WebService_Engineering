# Praktikum 05 Web Service Engineering

**Nama:** Achmad Mujahid Rafianoor  
**NIM:** 240104040138  
**Studi kasus:** Layanan Katalog Buku Perpustakaan Kampus

## Persyaratan
- Node.js 24.x LTS sesuai modul (Express 5 memerlukan Node.js minimal 18).
- npm.
- Visual Studio Code atau editor lain.

Periksa versi dengan `node --version` dan `npm --version`. Saat paket dijalankan, gunakan satu terminal untuk server dan terminal kedua untuk client.

## Instalasi dan menjalankan ulang
Dari folder proyek. `package.json` sudah mematok Express 5.3.0 dan swagger-ui-express 5.0.1. Karena lockfile tidak dapat dihasilkan di lingkungan penyusunan ini (akses registry npm mengalami kegagalan DNS), jalankan `npm install` sekali pada komputer yang terhubung internet agar `package-lock.json` terbentuk. Setelah itu, simpan lockfile tersebut dan gunakan `npm ci` pada instalasi ulang.

```bash
# Pertama kali di folder ini: mengunduh versi paket yang sudah dipatok
# dan membuat package-lock.json lokal.
npm install

# Setelah package-lock.json tersedia, instalasi ulang berikutnya dapat memakai:
# npm ci
npm run docs
npm run check
npm start
```

Server berjalan pada `http://127.0.0.1:3200`.

## Alamat layanan
- API: `http://127.0.0.1:3200/api/buku`
- OpenAPI JSON: `http://127.0.0.1:3200/openapi.json`
- Swagger UI: `http://127.0.0.1:3200/docs/`

## Pengujian melalui client terminal
Jalankan perintah dari akar folder proyek pada terminal kedua:

```bash
node client.cjs GET /api/buku
node client.cjs GET /api/buku/1
node client.cjs GET "/api/buku?q=kotlin"
node client.cjs POST /api/buku samples/buku-baru.json
```

Catat ID dan header Location dari POST. Pakai ID aktual tersebut untuk GET, PUT, dan DELETE. Contoh jika ID yang diterima adalah 3:

```bash
node client.cjs GET /api/buku/3
node client.cjs PUT /api/buku/3 samples/buku-ubah.json
node client.cjs GET /api/buku/3
node client.cjs DELETE /api/buku/3
node client.cjs GET /api/buku/3
```

## Tugas mandiri: dua buku
Kedua berkas berikut disiapkan untuk POST tugas mandiri:

```bash
node client.cjs POST /api/buku samples/buku-mandiri-1.json
node client.cjs POST /api/buku samples/buku-mandiri-2.json
```

Catat kedua ID aktual. Baca keduanya dengan GET. Ubah salah satu menggunakan `samples/buku-ubah.json`, lalu hapus satu buku dengan DELETE. Jangan menebak ID; gunakan ID dari respons POST.

## Pengujian input tidak valid

```bash
node client.cjs GET /api/buku/abc
node client.cjs GET /api/buku/01
node client.cjs GET /api/buku/999
node client.cjs POST /api/buku samples/buku-salah-tipe.json
node client.cjs PUT /api/buku/1 samples/buku-parsial.json
node client.cjs POST /api/buku samples/json-rusak.txt
node client.cjs POST /api/buku samples/buku-baru.json text/plain
node client.cjs GET "/api/buku?q=a&q=b"
node client.cjs GET /api/tidak-ada
```

## Swagger UI
Buka `/docs/`, pilih operasi, klik **Try it out**, isi parameter/body, lalu **Execute**. Catat bagian **Server response**, bukan hanya Example Value. Dokumentasi harus dipasang sebelum handler 404 pada `app.cjs`.

## Struktur proyek
- `app.cjs`, `server.cjs`, `client.cjs`
- `src/errors.cjs`, `src/buku.repository.cjs`, `src/buku.service.cjs`, `src/buku.controller.cjs`, `src/buku.routes.cjs`
- `scripts/generate-openapi.cjs`, `docs/openapi.json`
- `samples/` berisi lima input wajib modul dan dua input tugas mandiri
- `Rancangan_API_*.md`

## Batasan
Penyimpanan menggunakan array dalam memori. Data tambahan hilang setelah server dimulai ulang. Proyek ini untuk simulasi lokal, bukan layanan produksi. Tidak ada login, otorisasi, database, maupun transaksi peminjaman.

Hentikan server dengan `Ctrl+C` pada terminal pertama.

## Uji HTTP terotomasi
Setelah server aktif pada terminal pertama, jalankan pada terminal kedua:

```bash
node tests/run-http-tests.cjs
```

Hasil HTTP ditulis ke `tests/hasil-uji-http.json`. Skrip melakukan POST/PUT/DELETE sehingga data yang dibuat akan hilang saat server direstart. Skenario server mati, restart, dan `npm ci` tetap diperiksa terpisah mengikuti langkah modul.
