# 🎨 RULES.md — Aturan Pewarnaan 2 Warna & Simbol Logo (Menu Pembanding HPP)

Sistem menggunakan **2 WARNA SAJA** (Merah & Hijau — warna Biru sudah dihapus) yang difokuskan pada **2 KOLOM TERAKHIR** (bulan/periode terbaru) dan **KOLOM NOTE**.

---

## 1. Konsep Pewarnaan 2 Warna (Fokus di 2 Kolom Terakhir)

Pengecekan harga Inventory terhadap **Harga HPP** dilakukan pada **2 Kolom Periode Terakhir** (misal: `PL UPDATE 15 OKTOBER` dan `PL CENTRAL 15 OKTOBER`):

| Warna di Sheet | Kode Hex | Simbol | Status | Arti bagi Auditor HPP |
| :--- | :--- | :---: | :--- | :--- |
| 🟩 **Hijau Muda (Bold)** | Background `#dcfce7`<br>Teks `#166534` | `🟢` | **SESUAI / AMAN** | Harga Inventory di bulan terakhir **`<= Harga HPP`** (harga sama persis atau turun di bawah HPP). Margin resep aman! |
| 🟥 **Merah Muda (Bold)** | Background `#fee2e2`<br>Teks `#991b1b` | `🔺` | **NAIK (Di Atas HPP)** | Harga Inventory di bulan terakhir **`> Harga HPP`** (harga naik/lebih mahal). **Waspada:** HPP harus dinaikkan! |
| ⬜ **Putih / Abu-abu** | Background `#ffffff`<br>Teks `#1e293b` | `-` | **KOLOM LAMA / KOSONG** | Kolom bulan-bulan terdahulu tampil dengan angka normal (latar putih polos) agar tabel bersih & tidak berantakan. |

> **Catatan Penting:** Warna Biru **tidak digunakan**. Semua harga yang sama atau turun di bawah HPP otomatis diwarnai **HIJAU** (Aman).

---

## 2. Ringkasan Kolom `NOTE` (Hanya Bandingkan 2 Kolom Terakhir)

Kolom terakhir (`NOTE`) hanya memeriksa **2 Kolom Terakhir** terhadap harga HPP:

1. **Jika Semua Aman / Turun (`<= HPP`):**
   - Teks: `🟢 AMAN (<= HPP)` atau `🟢 SESUAI HPP`
   - Warna Sel: 🟩 **Hijau Muda (`#dcfce7`)**
2. **Jika Ada yang Naik (`> HPP`):**
   - Teks: `🔺 NAIK (Ctr: +2.973 vs HPP)` atau `🔺 NAIK (Upd: +138.000, Ctr: +173.800)`
   - Warna Sel: 🟥 **Merah Muda (`#fee2e2`)**
3. **Jika Barang Tidak Ditemukan:**
   - Teks: `⚪ TIDAK DITEMUKAN`
   - Warna Sel: ⬜ **Abu-abu (`#f8fafc`)**

---

## 3. Pewarnaan Baris Header (Tabel Ke-1)

| Warna Header | Kode Hex | Jenis Kolom |
| :--- | :--- | :--- |
| 🟢 **Hijau Tua** | `#047857` (Teks Putih) | Kolom **`PL UPDATE [Tanggal Bulan]`** |
| 🔵 **Biru Navy** | `#1e3a8a` (Teks Putih) | Kolom **`PL CENTRAL [Tanggal Bulan]`** |
| ⚫ **Hitam Slate** | `#0f172a` (Teks Putih) | Kolom Terakhir **`NOTE`** |

---

## 4. Menu 03: Replace HARGA / KEMASAN di Sheet HPP (Dengan Preview Lengkap)

Menu 03 dipisahkan secara mandiri khusus untuk **mengganti harga HPP resep ke sheet**:
1. **Target Kolom di Sheet:**
   - Kolom **`HARGA / KEMASAN`** (misal kolom F).
   - Seluruh rumus spreadsheet di sebelah kanannya (`HARGA / Gram / Ml` dan `HARGA`) otomatis ikut ter-update ("sisanya ikut").
2. **Pilihan Sumber Harga Pengganti:**
   - `PL CENTRAL Terbaru (Rekomendasi)`: mengambil harga acuan central kitchen/storage terakhir.
   - `PL UPDATE Terbaru`: mengambil harga market update terakhir.
   - Atau kolom periode tanggal tertentu yang sedang aktif.
3. **Smart Scale Matching (Konversi Satuan Otomatis):**
   - Jika inventory bersatuan `GR` / `GRAM` / `ML` (harga per gram/ml) sedangkan di resep adalah harga per kemasan (misal 1000 gr), sistem otomatis mengalikan dengan berat kemasannya (contoh: Jahe Rp 27,6/gr * 1000 gr = Rp 27.600).
4. **Preview Perubahan Sebelum Apply:**
   - Tabel menampilkan perbandingan jelas: **Harga Lama** ➔ **Harga Baru** beserta **Selisih/Delta** (Merah jika naik, Hijau jika turun, Netral jika sama).
   - Dilengkapi checkbox per baris (default: hanya mencentang yang harganya berubah/beda).
   - Pengguna bisa leluasa mencentang atau membatalkan centang sebelum menekan tombol Apply.

---

## 5. Struktur File HTML Terpisah (Modular Edition)

Untuk memudahkan pemeliharaan dan menjaga performa sidebar, UI di folder `03-sidebar-ui/` dipecah modular per menu:
- [`Sidebar.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/Sidebar.html) : Kerangka utama, Header switcher menu, dan penampung include.
- [`ParserView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/ParserView.html) : Menu 01 Parser Range ke JSON.
- [`PembandingView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/PembandingView.html) : Menu 02 Pembanding HPP Central (2 warna & auto create tabel pembanding Central).
- [`ReplaceHppView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/ReplaceHppView.html) : Menu 03 Replace Harga HPP Central (Central Kitchen & Storage).
- [`ScannerView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/ScannerView.html) : Menu 04 Scanner Sheet Central Storage & Kitchen Live.
- [`CiamsoPembandingView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/CiamsoPembandingView.html) : Menu 05 Pembanding HPP Ciamso (Inventory Okt) — mekanisme persis Menu 02 dengan base data `INVENTORY CIAMSO SBY OKT` (116 Item).

---

## 6. Menu 05: Pembanding HPP Ciamso (Inventory Okt)
1. **Mekanisme Sama Persis Menu 02:**
   - Membaca baris HPP resep di sheet (termasuk multi-menu seperti BUBUR ORIENTAL & BUBUR AYAM HAUCEK, baris kosong, dan baris TOTAL).
   - Base Data: 116 item dari `INVENTORY CIAMSO SBY OKT` (folder `inventory_ciamso_sby_Okt/`).
2. **Aturan 2 Warna & Note:**
   - 🟩 **Hijau Muda (`#dcfce7`)** jika `<= HPP` (Sesuai / Turun / Aman)
   - 🟥 **Merah Muda (`#fee2e2`)** jika `> HPP` (Naik)
   - Kolom **NOTE**: `🟢 AMAN (<= HPP)` atau `🔺 NAIK (Ciamso: +X vs HPP)` atau `⚪ TIDAK DITEMUKAN`.
   - Baris kosong / baris `TOTAL` otomatis dilewati tanpa merusak keselarasan baris.
3. **Dua Tombol Eksekusi:**
   - **Tombol 1 (Auto Create Tabel):** Menuliskan kolom `[HARGA CIAMSO (OKT 2026), NOTE]` di sebelah kanan tabel resep dengan 2 warna & border rapi.
   - **Tombol 2 (Replace Kolom Harga/Kemasan):** Menimpa kolom `HARGA / KEMASAN` dengan harga Ciamso dan memberi highlight **HIJAU** (`#dcfce7`). Rumus Harga/gr & Total terhitung ulang otomatis.

---

## 7. Menu 06: Replace Data (Replace All Bahan di Seluruh Sheet)

Menu 06 dirancang khusus untuk mempermudah pembaruan harga bahan baku yang dipakai di banyak resep sekaligus:
1. **Mode 1 — 🎯 Cari 1 Bahan & Replace All:**
   - Pengguna memilih/mencari nama bahan (misal `beras`, `ayam grill`, `daun bawang`).
   - Sistem memindai seluruh resep di sheet aktif dan menampilkan seluruh sel `HARGA / KEMASAN` yang menggunakan bahan tersebut (misal: BUBUR ORIENTAL baris 4 G4, BUBUR AYAM HAUCEK baris 14 G14).
   - Menampilkan perbandingan Harga Lama ➔ Harga Baru Ciamso.
   - Tombol **⚡ REPLACE ALL BAHAN INI DI SELURUH SHEET (WARNA HIJAU)**: langsung memperbarui seluruh sel tersebut di spreadsheet sekaligus dan mewarnainya dengan latar hijau muda (`#dcfce7`).
2. **Mode 2 — 📋 Scan Seluruh Sheet & Replace Massal:**
   - Memindai seluruh sheet aktif secara otomatis untuk mengekstrak seluruh resep & bahan.
   - Menampilkan tabel rekap bahan, jumlah resep yang memakai, status pencocokan Ciamso, dan checkbox.
   - Tombol **⚡ REPLACE ALL BAHAN TERPILIH DI SELURUH SHEET (WARNA HIJAU)**: mengganti semua sel yang dicentang sekaligus.
3. **Mode 3 — 🔍 Range Seleksi Manual:**
   - Pengguna dapat memblok range baris tertentu seperti biasa dan menekan replace.
4. **Integrasi Pintas dari Menu 05:**
   - Setiap kartu bahan di Menu 05 dilengkapi tombol cepat: **⚡ Replace All "[Bahan]" di Seluruh Sheet (Menu 06)**.
