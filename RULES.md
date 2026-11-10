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

## 5. Struktur File HTML Terpisah (3 Menu Mandiri)

Untuk memudahkan pemeliharaan dan menjaga performa sidebar, UI di folder `03-sidebar-ui/` dipecah modular per menu:
- [`Sidebar.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/Sidebar.html) : Kerangka utama, Header switcher menu, dan penampung include.
- [`ParserView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/ParserView.html) : Menu 01 Parser Range ke JSON.
- [`PembandingView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/PembandingView.html) : Menu 02 Pembanding HPP (2 warna & auto create tabel pembanding).
- [`ReplaceHppView.html`](file:///c:/DEV/addons-spreadsheet/03-sidebar-ui/ReplaceHppView.html) : Menu 03 Replace Harga HPP (preview lama vs baru, smart scale & apply ke sheet).
