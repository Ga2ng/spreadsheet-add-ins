# Blueprint & Panduan Penggunaan — Audit Data Tools (Modular HTML + 2 Warna Saja di 2 Kolom Terakhir)

Proyek ini sudah dipisahkan per-folder, arsitektur UI HTML dipecah modular per menu (`Sidebar.html`, `PembandingView.html`, `ParserView.html`), dilengkapi **Parser Converter CLI (`npm run convert`)** yang menghemat 86% ukuran & token AI, serta fitur **Auto Create Tabel Per Kolom Bulan (Mulai Agustus) + Evaluasi 2 Warna Saja pada 2 Kolom Terakhir + Ringkasan Note Singkat 1 Baris**.

---

## 1. Struktur Folder & File Modular

```text
c:\DEV\addons-spreadsheet\
├── 00-manifest\
│   └── appsscript.json                <-- Konfigurasi Manifest Google Apps Script
├── 01-code-backend\
│   └── Code.gs                        <-- Backend Apps Script (include helper, 2-color engine, auto create table)
├── 02-data-pembanding\
│   ├── DataPembanding.gs              <-- HASIL CONVERT JSON (Hemat 86% Token, Dibaca Langsung oleh Apps Script)
│   ├── central-kitchen.json           <-- JSON Sumber 1: Central Kitchen (180 Item Valid)
│   └── central-storage.json           <-- JSON Sumber 2: Central Storage (250 Item Valid)
├── 03-sidebar-ui\
│   ├── Sidebar.html                   <-- Layout Shell & Navigation Switcher (Modular Host)
│   ├── ParserView.html                <-- Menu 01: Parser Range Sheet ke JSON
│   ├── PembandingView.html            <-- Menu 02: Pembanding HPP (2 Warna & Auto Create Tabel)
│   └── ReplaceHppView.html            <-- Menu 03: Replace Harga HPP (Preview & Apply ke Sheet)
├── RULES.md                           <-- Aturan Pewarnaan 2 Warna & Format Ringkasan Note
├── scripts\
│   └── convert-json.js                <-- Converter JSON & Sync Otomatis ke dist-clasp/
└── dist-clasp\                        <-- Folder hasil sync otomatis untuk "npm run push"
```

---

## 2. Aturan Pewarnaan (2 Warna Saja — Biru Dihapus) & 2 Kolom Terakhir

Sesuai permintaan terbaru, warna biru resmi dihapus:
1. **HIJAU (`#dcfce7` / text `#166534`)**:
   - Status: **SESUAI / TURUN / AMAN**
   - Kondisi: Harga Inventory `<= HPP`.
2. **MERAH (`#fee2e2` / text `#991b1b`)**:
   - Status: **NAIK**
   - Kondisi: Harga Inventory `> HPP`.
3. **Fokus Evaluasi Highlight & Note**:
   - Hanya dievaluasi pada **2 KOLOM PERIODE TERAKHIR** (misal `PL UPDATE 15 OKTOBER 2026` dan `PL CENTRAL 15 OKTOBER 2026`).
   - Kolom-kolom historis sebelumnya (Agustus, September) berlatar netral/putih (`#ffffff`).
4. **Ringkasan Note Singkat 1 Baris (Anti Merusak Baris Tabel)**:
   - Jika ada yang naik di 2 kolom terakhir: `🔺 NAIK (Ctr: +2.973,3 vs HPP)` (Merah).
   - Jika <= HPP: `🟢 AMAN (<= HPP)` atau `🟢 SESUAI HPP` (Hijau).
   - Jika tidak ditemukan di database: `⚪ TIDAK DITEMUKAN` (Abu-abu).
   - Opsi `setWrap(false)` diterapkan pada sheet agar baris tabel resep tetap rapi dan tidak melar.

---

## 3. Alur Eksekusi Menu 02 — Pembanding HPP

1. **Pilih Data Pembanding (Bisa > 1):**
   - Centang `Central Kitchen` dan/atau `Central Storage` (default keduanya tercentang & digabung otomatis).
2. **Blok Baris Bahan HPP (8 Kolom Tanpa Header):**
   - Urutan pasti: `[1] Bahan | [2] Gramasi | [3] Satuan | [4] KEMASAN | [5] HARGA/KEMASAN | [6] HARGA/Gr/Ml | [7] HARGA | [8] PROCESS 10%`
   - Klik tombol **`1. Baca Baris HPP yang Di-Select & Tampilkan Preview`**.
3. **Klik 1 Sel Target di Sheet Lalu Tekan 1 Tombol Auto Create:**
   - Klik tombol tunggal **`⚡ 2. AUTO CREATE TABEL DI SEL YANG DI-SELECT`**.
   - **Tabel HPP Ke-1 (Paling Atas):** Klik sel sejajar bahan pertama (misal `J5`). Dibuatkan header bulan otomatis di `J4:P4` dan data di `J5:P14`.
   - **Tabel HPP Ke-2, Ke-3, dst. (Di Bawahnya):** Blok baris bahan tabel ke-2 (misal `B20:I28`), klik sel target `J20`, lalu tekan Auto Create. Sistem otomatis mendeteksi header di atas sudah ada, sehingga **tidak membuat header ulang** dan langsung mengisi data di baris yang sejajar!

---

## 4. Alur Eksekusi Menu 03 — Replace Harga HPP (Menu Mandiri)

1. **Pilih Acuan Harga Pembanding:**
   - Dropdown: `PL CENTRAL Terbaru (Rekomendasi)` atau `PL UPDATE Terbaru`.
2. **Blok Baris Resep HPP (Format Standar / Resep Lengkap):**
   - Mendukung format resep: `[Menu] • [Bahan] • [Gramasi] • [Satuan] • [Kemasan] • [HARGA/KEMASAN] • [Harga/gr] • [Total Harga]`
   - Klik **`1. Baca Baris Resep yang Di-Select & Tampilkan Preview`** (atau tombol **Contoh 14 Bahan**).
3. **Tinjau Tabel Preview Sebelum Apply:**
   - Cek kolom target sel (misal `F5` s/d `F18`), harga lama, harga baru (dengan konversi skala berat otomatis), dan selisihnya (merah jika naik, hijau jika turun).
   - Centang baris mana saja yang ingin di-update (default: otomatis mencentang yang harganya berubah).
4. **Klik `⚡ 2. TERAPKAN PERUBAHAN KE KOLOM HARGA/KEMASAN DI SHEET`:**
   - Nilai harga kemasan baru langsung ditulis ke kolom HARGA / KEMASAN di sheet.
   - Seluruh rumus spreadsheet di sebelah kanannya (`HARGA / Gram / Ml` dan `HARGA`) otomatis ikut menghitung ulang ("sisanya ikut").

---

## 5. Perintah Terminal (`npm run convert` & `npm run push`)

```powershell
# Convert ulang file JSON di 02-data-pembanding/ ke DataPembanding.gs sekaligus sync semua file modular ke dist-clasp/
npm run convert

# Push semua file modular ke Google Apps Script Anda
npm run push
```
