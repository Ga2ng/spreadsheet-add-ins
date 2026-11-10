const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const jsonPath = path.join(rootDir, 'inventory_ciamso_sby_Okt', 'audit-data_INVENTORY_CIAMSO_SBY_OKT_N4-R122_20261110-100203.json');
const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const items = raw.data.slice(1).map((r, i) => ({
  id: 'ci-' + (i + 1),
  name: String(r['INVENTORI FOOD & SNACK'] || '').trim(),
  unit: String(r['Column_3'] || '').trim().toUpperCase(),
  price: Number(r['Column_4']) || 0
})).filter(it => it.name && it.price > 0);

console.log('Total Ciamso Items parsed:', items.length);

const viewContent = `<!--
===============================================================================
MENU 05: PEMBANDING HPP CIAMSO (CiamsoPembandingView.html)
===============================================================================
Fitur:
1. Sama persis seperti Menu 02, menggunakan basis data INVENTORY CIAMSO SBY OKT (116 Item).
2. Membaca tabel 8 kolom HPP Resep:
   [0] Bahan • [1] Gramasi • [2] SATUAN • [3] KEMASAN (Gram/ml) • [4] HARGA / KEMASAN • [5] HARGA/ Gram / Ml • [6] HARGA • [7] PROCESSING
3. Membandingkan harga kemasan Ciamso vs HPP Resep:
   - 🟢 Hijau Muda (#dcfce7 / #166534) : AMAN / TURUN (<= HPP)
   - 🔺 Merah Muda (#fee2e2 / #991b1b) : NAIK (> HPP)
   - Kolom NOTE ringkasan status.
4. Dua Tombol Eksekusi:
   - ⚡ 2. AUTO CREATE TABEL PEMBANDING DI SHEET (Persis Menu 02)
   - ⚡ GANTI KOLOM HARGA / KEMASAN DI SHEET (Warna Hijau #dcfce7)
===============================================================================
-->
<div id="viewCiamsoPembanding" class="space-y-3">

  <!-- STEP 1: INFO DATA PEMBANDING CIAMSO -->
  <section class="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-2.5">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-800">1. Data Pembanding Ciamso (Inventory Okt)</h2>
        <p class="text-[11px] text-slate-500">
          Dibaca dari database <code class="font-mono text-emerald-700">INVENTORY CIAMSO SBY OKT</code> (116 Item).
        </p>
      </div>
      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
        116 Item Aktif
      </span>
    </div>

    <!-- Ringkasan Dataset Ciamso -->
    <div class="bg-emerald-50/70 border border-emerald-200 rounded-md px-2.5 py-2 text-[11px] text-emerald-900 space-y-0.5">
      <div class="flex items-center justify-between">
        <span class="font-semibold">✓ Sumber: INVENTORY CIAMSO SBY OKT</span>
        <span class="font-semibold bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">Periode: Okt 2026</span>
      </div>
      <div class="text-[10px] text-emerald-700">
        Data inventori siap dicocokkan otomatis dengan satuan &amp; harga kemasan resep HPP.
      </div>
    </div>
  </section>

  <!-- STEP 2: SELECT BARIS RESEP HPP -->
  <section class="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-2.5">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-800">2. Select Baris HPP &amp; Preview</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">
          Blok baris tabel resep HPP di Sheet (8 kolom standar).
        </p>
      </div>
      <button
        type="button"
        onclick="loadCiamsoSampleExactTable()"
        class="shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded"
      >
        Contoh Data
      </button>
    </div>

    <!-- PANDUAN URUTAN 8 KOLOM HPP -->
    <div class="bg-slate-50 border border-slate-200 rounded-md p-2 text-[10px] text-slate-600 leading-relaxed">
      <div class="font-bold text-slate-700 mb-0.5">Urutan 8 Kolom HPP Resep:</div>
      <div class="font-mono text-[9px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
        <div>[0] <strong>Bahan</strong> • [1] <strong>Gramasi</strong> • [2] <strong>SATUAN</strong> • [3] <strong>KEMASAN (Gram/ml)</strong></div>
        <div>[4] <strong>HARGA / KEMASAN</strong> • [5] <strong>HARGA/Gram/Ml</strong> • [6] <strong>HARGA</strong> • [7] <strong>PROCESSING</strong></div>
      </div>
    </div>

    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input
        id="chkCiamsoNoHeaderHpp"
        type="checkbox"
        checked
        onchange="recomputeCiamsoComparison()"
        class="h-4 w-4 rounded border-slate-300 text-emerald-600"
      />
      <span class="text-xs font-medium text-slate-700">
        Baris ke-1 yang di-select langsung data bahan (Tanpa Header)
      </span>
    </label>

    <div id="ciamsoSelectedRangeInfo" class="hidden bg-emerald-50/60 border border-emerald-200 rounded-md px-2.5 py-1.5 text-[11px] text-emerald-900 font-mono"></div>

    <button
      id="btnReadCiamsoSelection"
      type="button"
      onclick="handleReadCiamsoSelectedRange()"
      class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
    >
      1. Baca Baris HPP yang Di-Select &amp; Tampilkan Preview
    </button>
  </section>

  <!-- STEP 3: PREVIEW TABEL & DUA TOMBOL EKSEKUSI -->
  <section id="ciamsoTableOutputSection" class="hidden bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-3">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-800">3. Hasil Pembanding HPP Ciamso</h2>
        <p class="text-[11px] text-slate-500">2 Warna saja (Hijau &amp; Merah) + Kolom Note.</p>
      </div>
      <span id="ciamsoRowCountBadge" class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"></span>
    </div>

    <!-- STATISTIK CEPAT & LEGENDA 2 WARNA -->
    <div class="grid grid-cols-3 gap-1.5 text-center">
      <div class="bg-emerald-50 border border-emerald-200 rounded p-1.5">
        <div id="statCiamsoSesuai" class="text-xs font-bold text-emerald-800">0</div>
        <div class="text-[10px] text-emerald-700 font-semibold">🟢 Sesuai/Aman (&lt;= HPP)</div>
      </div>
      <div class="bg-red-50 border border-red-200 rounded p-1.5">
        <div id="statCiamsoNaik" class="text-xs font-bold text-red-800">0</div>
        <div class="text-[10px] text-red-700 font-semibold">🔺 Naik (&gt; HPP)</div>
      </div>
      <div class="bg-slate-100 border border-slate-200 rounded p-1.5">
        <div id="statCiamsoNotFound" class="text-xs font-bold text-slate-700">0</div>
        <div class="text-[10px] text-slate-500">⚪ Kosong / Dilewati</div>
      </div>
    </div>

    <!-- TABEL PREVIEW HASIL PEMBANDING -->
    <div class="space-y-1">
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-bold text-slate-700">Tabel Preview Per Baris Bahan:</span>
        <span class="text-[10px] text-slate-400">Geser ke kanan →</span>
      </div>

      <div class="border border-slate-200 rounded-md overflow-x-auto max-h-72">
        <table class="w-full text-[10px] border-collapse">
          <thead class="bg-slate-800 text-white sticky top-0 z-10">
            <tr>
              <th class="px-1.5 py-1.5 text-center w-7">
                <input type="checkbox" id="chkCiamsoSelectAll" checked onchange="handleToggleAllRowsCheck(this.checked)" title="Pilih Semua / Batal" class="rounded text-emerald-600 cursor-pointer" />
              </th>
              <th class="px-2 py-1.5 text-center w-6">#</th>
              <th class="px-2 py-1.5 text-left whitespace-nowrap">Bahan Resep</th>
              <th class="px-2 py-1.5 text-center whitespace-nowrap">Gramasi</th>
              <th class="px-2 py-1.5 text-center whitespace-nowrap">Satuan</th>
              <th class="px-2 py-1.5 text-center whitespace-nowrap bg-slate-700 text-white">Kemasan (Manual)</th>
              <th class="px-2 py-1.5 text-right whitespace-nowrap">Harga Lama</th>
              <th class="px-1.5 py-1.5 text-center">➔</th>
              <th class="px-2 py-1.5 text-right whitespace-nowrap bg-emerald-800 text-white">Harga/Kemasan Baru (Manual)</th>
              <th class="px-2 py-1.5 text-left whitespace-nowrap bg-slate-900 text-white">NOTE STATUS</th>
            </tr>
          </thead>
          <tbody id="ciamsoTablePreviewTbody" class="divide-y divide-slate-200 bg-white"></tbody>
        </table>
      </div>
    </div>

    <!-- PENGATURAN ITEM CIAMSO PER BARIS (ACCORDION) -->
    <details class="border border-slate-200 rounded-md bg-slate-50 p-2.5">
      <summary class="cursor-pointer text-[11px] font-bold text-slate-700 select-none">
        Pencocokan Item Ciamso Per Baris (Bisa Ganti Manual)
      </summary>
      <div id="ciamsoMatchDetailCards" class="mt-2.5 space-y-2 max-h-60 overflow-y-auto pr-1"></div>
    </details>

    <!-- DUA TOMBOL UTAMA -->
    <div class="space-y-2 pt-1">

      <!-- TOMBOL UTAMA 1: AUTO CREATE TABEL KE SHEET -->
      <div class="bg-slate-900 text-white rounded-lg p-3 space-y-2 shadow-sm">
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-emerald-300 font-semibold">1. Klik sel target di Sheet, lalu buat tabel pembanding:</span>
          <span class="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">2 Kolom (Harga + Note)</span>
        </div>
        <button
          id="btnAutoCreateCiamsoTable"
          type="button"
          onclick="handleAutoCreateCiamsoTable()"
          class="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-md shadow transition-colors uppercase tracking-wide flex items-center justify-center gap-1.5"
        >
          <span>⚡ 2. AUTO CREATE TABEL PEMBANDING DI SHEET</span>
        </button>
      </div>

      <!-- TOMBOL UTAMA 2: REPLACE HARGA & KEMASAN MANUAL DI SHEET SAAT INI -->
      <div class="border border-emerald-300 rounded-lg p-2.5 bg-emerald-50/70 space-y-2 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-emerald-950">Aksi: Replace Harga &amp; Kemasan Manual</span>
          <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">Hanya Sheet Aktif Saat Ini</span>
        </div>
        <p class="text-[10px] text-emerald-800 leading-relaxed">
          Mengganti sel pada kolom <strong>HARGA / KEMASAN</strong> (dan <strong>KEMASAN</strong> jika diubah) <strong>hanya pada sheet yang sedang aktif saat ini</strong> menggunakan harga &amp; kemasan manual yang Anda tentukan di tabel/kartu di atas, serta memberi warna latar <strong>HIJAU</strong> (<code>#dcfce7</code>).
        </p>
        <div id="lblSelectedRowsCount" class="text-[11px] font-bold text-emerald-900 bg-white p-1.5 rounded border border-emerald-200 text-center">
          Semua baris dicentang siap di-replace
        </div>
        <button
          id="btnApplyCiamsoReplaceDirect"
          type="button"
          onclick="handleApplyCiamsoReplaceDirect()"
          class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black rounded-md shadow uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>⚡ GANTI HARGA / KEMASAN MANUAL DI SHEET SAAT INI (WARNA HIJAU)</span>
        </button>
      </div>

    </div>
  </section>

</div>

<script>
  // Database 116 Item Inventori Ciamso dari folder inventory_ciamso_sby_Okt
  var CIAMSO_JSON_ITEMS = ${JSON.stringify(items)};

  // State Global Menu 05 Pembanding Ciamso
  var ciamsoRawSelection = null;
  var ciamsoComparisonRows = [];
  var ciamsoManualOverrideMap = {};
  var ciamsoManualKemasanMap = {};
  var ciamsoManualHargaMap = {};
  var ciamsoRowCheckedMap = {};

  function initCiamsoPembandingView() {
    if (ciamsoRawSelection) {
      recomputeCiamsoComparison();
    }
  }

  function normalizeCiamsoWord(w) {
    var s = String(w || "").toLowerCase().trim();
    s = s.replace(/telor/g, "telur");
    s = s.replace(/saos|sauce/g, "saus");
    s = s.replace(/cabai/g, "cabe");
    s = s.replace(/blackpepper/g, "blackpaper");
    s = s.replace(/sichuan/g, "sechuan");
    s = s.replace(/charsiew|chasiew|charseu/g, "charsiu");
    return s;
  }

  function collapseCiamsoWord(w) {
    return normalizeCiamsoWord(w).replace(/([a-z])\\1+/g, "$1");
  }

  function ciamsoWordsMatch(w1, w2) {
    var n1 = normalizeCiamsoWord(w1);
    var n2 = normalizeCiamsoWord(w2);
    if (n1 === n2) return true;

    var c1 = collapseCiamsoWord(w1);
    var c2 = collapseCiamsoWord(w2);
    if (c1 === c2) return true;

    if (n1.length >= 4 && n2.length >= 4) {
      if (n1.indexOf(n2) === 0 || n2.indexOf(n1) === 0) return true;
    }
    return false;
  }

  function cleanCiamsoIngredientWords(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:ml|gr|gram|kg|l|liter|sak|btl|botol|pcs|pack|porsi|jrg|jirigen)?\b/gi, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(function (w) {
        return w.length >= 2 && !/^(gr|gram|ml|kg|l|pcs|pack|porsi|sak|per|vacum)$/i.test(w);
      });
  }

  function findBestCiamsoMatch(recipeBahan, pool) {
    var rawB = String(recipeBahan || "").trim();
    var lowerB = rawB.toLowerCase();
    if (!lowerB) return null;

    // Proteksi kata umum non-bahan / bahan tanpa inventory
    if (lowerB === "air" || lowerB.replace(/[^a-z]/g, "") === "air") return null;

    // 1. Exact match (case-insensitive, abaikan spasi & simbol)
    var normKey = lowerB.replace(/[^a-z0-9]/g, "");
    for (var i = 0; i < pool.length; i++) {
      var itKey = pool[i].name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (itKey === normKey) return pool[i];
    }

    // 2. Token Matching 1 kata atau 2 kata mirip (misal: knor -> knorr / knor 100ml)
    var qWords = cleanCiamsoIngredientWords(lowerB);
    if (qWords.length === 0) return null;

    var best = null;
    var maxScore = -1;

    for (var j = 0; j < pool.length; j++) {
      var it = pool[j];
      var itLower = it.name.toLowerCase();
      var itWords = cleanCiamsoIngredientWords(itLower.split("@")[0].trim());
      if (itWords.length === 0) continue;

      var matchCount = 0;
      var score = 0;

      for (var qwIdx = 0; qwIdx < qWords.length; qwIdx++) {
        var qw = qWords[qwIdx];
        var wordMatched = false;
        for (var iwIdx = 0; iwIdx < itWords.length; iwIdx++) {
          var iw = itWords[iwIdx];
          if (ciamsoWordsMatch(qw, iw)) {
            wordMatched = true;
            if (normalizeCiamsoWord(qw) === normalizeCiamsoWord(iw)) {
              score += 15;
            } else {
              score += 10;
            }
          }
        }
        if (wordMatched) matchCount++;
      }

      if (matchCount === 0) continue;

      if (matchCount === qWords.length) {
        score += 20;
      }

      var extraWords = Math.max(0, itWords.length - qWords.length);
      score -= extraWords * 1.5;

      if (matchCount >= 1 && score > maxScore) {
        maxScore = score;
        best = it;
      }
    }

    return maxScore > 5 ? best : null;
  }

  function calculateCiamsoPriceForKemasan(matchedItem, kemasanNum) {
    var p = Number(matchedItem.price) || 0;
    var u = String(matchedItem.unit || "").toUpperCase();
    var k = Number(kemasanNum) || 0;

    if (u === "GRAM" || u === "GR" || u === "ML") {
      if (k > 0) return Math.round(p * k);
      return p;
    }

    if (k >= 1) return Math.round(p * k);
    return p;
  }

  function handleReadCiamsoSelectedRange() {
    var btn = document.getElementById("btnReadCiamsoSelection");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Membaca Baris HPP Sheet...';
    showAuditStatus("info", "Sedang membaca baris resep yang Anda pilih di sheet...");

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          btn.innerHTML = '1. Baca Baris HPP yang Di-Select &amp; Tampilkan Preview';
          if (!res || !Array.isArray(res.values) || res.values.length === 0) {
            showAuditStatus("error", "Tidak ada baris yang dipilih. Silakan blok area tabel resep terlebih dahulu.");
            return;
          }
          ciamsoRawSelection = res;
          var infoBox = document.getElementById("ciamsoSelectedRangeInfo");
          if (infoBox) {
            infoBox.textContent = "Range: " + res.sheetName + "!" + res.address + " (" + res.rowCount + " baris × " + res.columnCount + " kolom)";
            infoBox.classList.remove("hidden");
          }
          showAuditStatus("success", "✓ Berhasil membaca " + res.rowCount + " baris dari Sheet! Tinjau tabel pembanding di bawah.");
          recomputeCiamsoComparison();
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          btn.innerHTML = '1. Baca Baris HPP yang Di-Select &amp; Tampilkan Preview';
          showAuditStatus("error", "Gagal membaca sheet: " + (err.message || err));
        })
        .readSelectedRangeFromSheet();
    } else {
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = '1. Baca Baris HPP yang Di-Select &amp; Tampilkan Preview';
        loadCiamsoSampleExactTable();
      }, 300);
    }
  }

  // Memuat contoh data persis dari struktur 8 kolom yang diberikan pengguna
  function loadCiamsoSampleExactTable() {
    ciamsoRawSelection = {
      sheetName: "HPP RESEP",
      address: "A2:H9",
      startRow: 2,
      startCol: 1,
      rowCount: 8,
      columnCount: 8,
      values: [
        // [0] Bahan, [1] Gramasi, [2] SATUAN, [3] KEMASAN, [4] HARGA / KEMASAN, [5] HARGA/Gram/Ml, [6] HARGA, [7] PROCESSING
        ["beras", 75, "gr", 25000, 425000, 17.00, 1275, 128],
        ["daun bawang", 3, "gr", 1000, 30000, 30.00, 90, 9],
        ["ayam grill", 1, "porsi", 1, 5385, 5385.00, 5385, 539],
        ["kecap asin", 5, "ml", 600, 42600, 71.00, 355, 36],
        ["minyak wijen", 5, "ml", 620, 48360, 78.00, 390, 39],
        ["air", 20, "ml", "", null, null, null, null],
        ["bawang merah goreng", 5, "gr", 1000, 116000, 116.00, 580, 58],
        ["kerupuk", 1, "pcs", 1, 1050, 1050.00, 1050, 105]
      ]
    };
    showAuditStatus("info", "Memuat contoh data struktur 8 kolom HPP (beras, daun bawang, ayam grill, kecap asin, minyak wijen, air, bawang merah goreng, kerupuk)...");
    recomputeCiamsoComparison();
  }

  function recomputeCiamsoComparison() {
    if (!ciamsoRawSelection || !Array.isArray(ciamsoRawSelection.values)) return;

    var sec = document.getElementById("ciamsoTableOutputSection");
    if (sec) sec.classList.remove("hidden");

    var chkNoHeader = document.getElementById("chkCiamsoNoHeaderHpp");
    var hasNoHeader = chkNoHeader ? chkNoHeader.checked : true;
    var rows = ciamsoRawSelection.values;

    var startIndex = 0;
    // Jika baris ke-0 terdeteksi sebagai header teks
    if (rows.length > 0) {
      var r0Join = rows[0].join(" ").toUpperCase();
      if (r0Join.indexOf("BAHAN") !== -1 || r0Join.indexOf("GRAMASI") !== -1) {
        startIndex = 1;
      } else if (!hasNoHeader) {
        startIndex = 1;
      }
    }

    ciamsoComparisonRows = [];
    var countSesuai = 0;
    var countNaik = 0;
    var countNotFound = 0;

    for (var r = startIndex; r < rows.length; r++) {
      var row = rows[r] || [];
      var rowNum = r + 1;
      var actualSheetRow = (ciamsoRawSelection.startRow || 1) + r;

      // STRUKTUR 8 KOLOM PERSIS SESUAI SPESIFIKASI:
      // [0] Bahan
      // [1] Gramasi
      // [2] SATUAN
      // [3] KEMASAN (Gram/ml)
      // [4] HARGA / KEMASAN
      // [5] HARGA/ Gram / Ml
      // [6] HARGA
      // [7] PROCESSING
      //
      // Jika user memilih tabel dengan kolom No & Preparetion di sebelah kiri:
      var colBahan = 0;
      var colGramasi = 1;
      var colSatuan = 2;
      var colKemasan = 3;
      var colHargaKemasan = 4;

      if (row.length >= 9 && row[2] && isNaN(Number(row[2])) && parseNum(row[3]) !== null) {
        colBahan = 2;
        colGramasi = 3;
        colSatuan = 4;
        colKemasan = 5;
        colHargaKemasan = 6;
      }

      var rawBahan = row[colBahan];
      var rawGramasi = row[colGramasi];
      var rawSatuan = row[colSatuan];
      var rawKemasan = row[colKemasan];
      var rawHargaKemasan = row[colHargaKemasan];

      var cBahan = String(rawBahan || "").replace(/\\s+/g, " ").trim();
      var isTotal = /^(TOTAL|SUBTOTAL)$/i.test(cBahan);
      var isEmpty = !cBahan || isTotal;

      var actualSheetColKemasan = (ciamsoRawSelection.startCol || 1) + colKemasan;
      var actualSheetColHarga = (ciamsoRawSelection.startCol || 1) + colHargaKemasan;

      if (isEmpty) {
        ciamsoComparisonRows.push({
          rowNumber: rowNum,
          sheetRow: actualSheetRow,
          sheetCol: actualSheetColHarga,
          sheetColKemasan: actualSheetColKemasan,
          cellAddress: colNumberToLetter(actualSheetColHarga) + actualSheetRow,
          isEmptyRow: true,
          bahan: isTotal ? "TOTAL" : "",
          gramasi: "",
          satuan: "",
          kemasan: 0,
          oldHargaKemasan: null,
          newHargaKemasan: null,
          status: "EMPTY",
          priceDisplay: "",
          note: ""
        });
        countNotFound++;
        continue;
      }

      var cGramasi = parseNum(rawGramasi) || 0;
      var cSatuan = String(rawSatuan || "").trim().toUpperCase() || "-";
      var cKemasan = parseNum(rawKemasan) || 1;
      var cHargaKemasan = parseNum(rawHargaKemasan);

      // Cek apakah ada perubahan kemasan manual yang pernah diinput user
      if (ciamsoManualKemasanMap[rowNum] !== undefined) {
        cKemasan = ciamsoManualKemasanMap[rowNum];
      }

      var matched = null;
      var overrideId = ciamsoManualOverrideMap[rowNum];
      if (overrideId) {
        matched = CIAMSO_JSON_ITEMS.find(function (it) { return it.id === overrideId; });
      }
      if (!matched) {
        matched = findBestCiamsoMatch(cBahan, CIAMSO_JSON_ITEMS);
      }

      var newPrice = matched ? calculateCiamsoPriceForKemasan(matched, cKemasan) : null;
      var manualPriceOverridden = false;

      // Cek apakah ada perubahan harga manual yang pernah diinput user
      if (ciamsoManualHargaMap[rowNum] !== undefined) {
        newPrice = ciamsoManualHargaMap[rowNum];
        manualPriceOverridden = true;
      }

      if (!matched && !manualPriceOverridden) {
        ciamsoComparisonRows.push({
          rowNumber: rowNum,
          sheetRow: actualSheetRow,
          sheetCol: actualSheetColHarga,
          sheetColKemasan: actualSheetColKemasan,
          cellAddress: colNumberToLetter(actualSheetColHarga) + actualSheetRow,
          isEmptyRow: false,
          bahan: cBahan,
          gramasi: cGramasi,
          satuan: cSatuan,
          kemasan: cKemasan,
          oldHargaKemasan: cHargaKemasan,
          newHargaKemasan: null,
          isRowChecked: false,
          status: "NOT_FOUND",
          priceDisplay: "-",
          note: "⚪ TIDAK DITEMUKAN"
        });
        countNotFound++;
        continue;
      }

      var delta = (cHargaKemasan !== null && newPrice !== null) ? newPrice - cHargaKemasan : 0;
      var status = "SESUAI";
      var note = "🟢 AMAN (<= HPP)";

      if (cHargaKemasan !== null && delta > 0) {
        status = "NAIK";
        note = "🔺 NAIK (+" + formatIDR(delta) + " vs HPP)";
        countNaik++;
      } else {
        status = "SESUAI";
        if (cHargaKemasan !== null && delta < 0) {
          note = "🟢 TURUN (-" + formatIDR(Math.abs(delta)) + ")";
        }
        countSesuai++;
      }

      var isChecked = ciamsoRowCheckedMap[rowNum] !== undefined
        ? ciamsoRowCheckedMap[rowNum]
        : (newPrice !== null && newPrice > 0);

      ciamsoComparisonRows.push({
        rowNumber: rowNum,
        sheetRow: actualSheetRow,
        sheetCol: actualSheetColHarga,
        sheetColKemasan: actualSheetColKemasan,
        cellAddress: colNumberToLetter(actualSheetColHarga) + actualSheetRow,
        isEmptyRow: false,
        bahan: cBahan,
        gramasi: cGramasi,
        satuan: cSatuan,
        kemasan: cKemasan,
        oldHargaKemasan: cHargaKemasan,
        newHargaKemasan: newPrice,
        matchedItem: matched,
        manualPriceOverridden: manualPriceOverridden,
        isRowChecked: isChecked,
        delta: delta,
        status: status,
        priceDisplay: newPrice,
        note: note
      });
    }

    var badge = document.getElementById("ciamsoRowCountBadge");
    if (badge) badge.textContent = ciamsoComparisonRows.length + " Baris × 2 Kolom";

    var statS = document.getElementById("statCiamsoSesuai");
    if (statS) statS.textContent = countSesuai;

    var statN = document.getElementById("statCiamsoNaik");
    if (statN) statN.textContent = countNaik;

    var statNF = document.getElementById("statCiamsoNotFound");
    if (statNF) statNF.textContent = countNotFound;

    renderCiamsoTablePreviewUI();
    renderCiamsoMatchCards();
  }

  function renderCiamsoTablePreviewUI() {
    var tbody = document.getElementById("ciamsoTablePreviewTbody");
    if (!tbody) return;

    var rowsHtml = ciamsoComparisonRows.map(function (row) {
      if (row.isEmptyRow) {
        return (
          '<tr class="bg-slate-50/60 text-slate-400">' +
          '<td class="px-1.5 py-1 text-center font-mono text-[9px]">-</td>' +
          '<td class="px-2 py-1 text-center font-mono text-[9px]">' + row.rowNumber + '</td>' +
          '<td class="px-2 py-1 font-bold text-slate-400">' + escapeHtml(row.bahan || "") + '</td>' +
          '<td class="px-2 py-1 text-center font-mono">-</td>' +
          '<td class="px-2 py-1 text-center font-mono">-</td>' +
          '<td class="px-2 py-1 text-center font-mono">-</td>' +
          '<td class="px-2 py-1 text-right font-mono">-</td>' +
          '<td class="px-1 text-center text-slate-300">➔</td>' +
          '<td class="px-2 py-1 text-center font-mono">-</td>' +
          '<td class="px-2 py-1 text-center font-mono text-slate-400">-</td>' +
          '</tr>'
        );
      }

      var bgClass = "bg-white";
      var textClass = "text-slate-800";
      var noteBgClass = "bg-slate-50 text-slate-600";

      if (row.status === "SESUAI") {
        bgClass = "bg-green-50/90";
        textClass = "text-green-800 font-bold";
        noteBgClass = "bg-green-100 text-green-900 font-bold";
      } else if (row.status === "NAIK") {
        bgClass = "bg-red-50/90";
        textClass = "text-red-800 font-bold";
        noteBgClass = "bg-red-100 text-red-900 font-bold";
      } else {
        bgClass = "bg-slate-50";
        textClass = "text-slate-500";
        noteBgClass = "bg-slate-100 text-slate-500";
      }

      var oldPriceDisplay = (row.oldHargaKemasan !== null && row.oldHargaKemasan !== undefined && row.oldHargaKemasan > 0)
        ? "Rp " + formatIDR(row.oldHargaKemasan)
        : "-";
      var isChecked = row.isRowChecked !== false;
      var kemasanVal = row.kemasan !== undefined && row.kemasan !== null ? row.kemasan : "";
      var hargaVal = row.newHargaKemasan !== undefined && row.newHargaKemasan !== null ? row.newHargaKemasan : "";

      return (
        '<tr class="hover:bg-slate-100/60 transition-colors">' +
        '<td class="px-1.5 py-1 text-center">' +
          '<input type="checkbox" id="chkRow_' + row.rowNumber + '" ' + (isChecked ? 'checked' : '') + ' onchange="handleToggleRowCheck(' + row.rowNumber + ', this.checked)" class="cursor-pointer rounded text-emerald-600" />' +
        '</td>' +
        '<td class="px-2 py-1.5 text-center font-mono text-[9px] text-slate-400">' + row.rowNumber + '</td>' +
        '<td class="px-2 py-1.5 font-bold text-slate-800 whitespace-nowrap">' + escapeHtml(row.bahan) + '</td>' +
        '<td class="px-2 py-1.5 text-center font-mono text-[9px] text-slate-600 whitespace-nowrap">' + (row.gramasi ? formatIDR(row.gramasi) : "-") + '</td>' +
        '<td class="px-2 py-1.5 text-center font-mono text-[9px] text-slate-500 whitespace-nowrap">' + escapeHtml(row.satuan) + '</td>' +
        '<td class="px-1.5 py-1 text-center">' +
          '<input type="number" step="any" id="inputKemasan_' + row.rowNumber + '" value="' + kemasanVal + '" oninput="handleManualKemasanChange(' + row.rowNumber + ', this.value)" class="w-16 px-1.5 py-0.5 text-center font-mono font-bold text-[10px] border border-slate-300 rounded bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 shadow-sm" title="Ubah kemasan manual jika diperlukan" />' +
        '</td>' +
        '<td class="px-2 py-1.5 text-right font-mono text-slate-600 whitespace-nowrap">' + oldPriceDisplay + '</td>' +
        '<td class="px-1 py-1.5 text-center text-slate-400">➔</td>' +
        '<td class="px-1.5 py-1 text-right ' + bgClass + '">' +
          '<div class="flex items-center justify-end gap-1">' +
            '<span class="text-[9px] text-slate-400">Rp</span>' +
            '<input type="number" step="any" id="inputHarga_' + row.rowNumber + '" value="' + hargaVal + '" oninput="handleManualHargaChange(' + row.rowNumber + ', this.value)" class="w-24 px-1.5 py-0.5 text-right font-mono font-bold text-[11px] border border-emerald-500 rounded bg-white text-emerald-950 focus:ring-1 focus:ring-emerald-600 shadow-sm" title="Ubah harga pengganti manual jika diperlukan" />' +
          '</div>' +
        '</td>' +
        '<td id="previewNote_' + row.rowNumber + '" class="px-2 py-1.5 text-left font-mono text-[9px] whitespace-nowrap ' + noteBgClass + '">' + escapeHtml(row.note) + '</td>' +
        '</tr>'
      );
    });

    tbody.innerHTML = rowsHtml.join("");
    updateReplaceButtonSummary();
  }

  function renderCiamsoMatchCards() {
    var container = document.getElementById("ciamsoMatchDetailCards");
    if (!container) return;

    var validRows = ciamsoComparisonRows.filter(function (r) { return !r.isEmptyRow; });
    var cards = validRows.map(function (row) {
      var matchedId = row.matchedItem ? row.matchedItem.id : "";
      var opts = ['<option value="">-- Tidak Dicocokkan (Lewati) --</option>'];
      CIAMSO_JSON_ITEMS.forEach(function (it) {
        var isSel = it.id === matchedId;
        opts.push(
          '<option value="' + escapeHtml(it.id) + '" ' + (isSel ? 'selected' : '') + '>' +
          escapeHtml(it.name) + ' (' + escapeHtml(it.unit) + ' • Rp ' + formatIDR(it.price) + ')' +
          '</option>'
        );
      });

      var isChecked = row.isRowChecked !== false;
      var kemasanVal = row.kemasan !== undefined && row.kemasan !== null ? row.kemasan : "";
      var hargaVal = row.newHargaKemasan !== undefined && row.newHargaKemasan !== null ? row.newHargaKemasan : "";

      return (
        '<div class="p-2.5 rounded border border-slate-200 bg-white space-y-2 text-[10px]">' +
        '<div class="flex items-center justify-between font-bold text-slate-800">' +
          '<label class="flex items-center gap-1.5 cursor-pointer">' +
            '<input type="checkbox" id="chkCardRow_' + row.rowNumber + '" ' + (isChecked ? 'checked' : '') + ' onchange="handleToggleRowCheck(' + row.rowNumber + ', this.checked)" class="cursor-pointer rounded text-emerald-600" />' +
            '<span>[Baris ' + row.rowNumber + '] ' + escapeHtml(row.bahan) + ' (Sel ' + escapeHtml(row.cellAddress) + ')</span>' +
          '</label>' +
          '<span class="text-slate-400">HPP Lama: ' + (row.oldHargaKemasan ? 'Rp ' + formatIDR(row.oldHargaKemasan) : '-') + '</span>' +
        '</div>' +
        '<div>' +
          '<label class="text-[9px] text-slate-500 font-semibold block mb-0.5">Item Acuan Ciamso:</label>' +
          '<select onchange="handleOverrideCiamsoRowMatch(' + row.rowNumber + ', this.value)" class="w-full text-[10px] border border-slate-300 rounded px-1.5 py-0.5 bg-slate-50 focus:bg-white">' +
            opts.join("") +
          '</select>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2 bg-emerald-50/60 p-2 rounded border border-emerald-100">' +
          '<div>' +
            '<label class="text-[9px] text-slate-600 font-bold block mb-0.5">Kemasan Manual (' + escapeHtml(row.satuan || '') + '):</label>' +
            '<input type="number" step="any" id="cardInputKemasan_' + row.rowNumber + '" value="' + kemasanVal + '" oninput="handleManualKemasanChange(' + row.rowNumber + ', this.value)" class="w-full text-xs font-mono font-bold border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 shadow-sm" />' +
          '</div>' +
          '<div>' +
            '<label class="text-[9px] text-emerald-900 font-bold block mb-0.5">Harga / Kemasan Baru (Manual):</label>' +
            '<input type="number" step="any" id="cardInputHarga_' + row.rowNumber + '" value="' + hargaVal + '" oninput="handleManualHargaChange(' + row.rowNumber + ', this.value)" class="w-full text-xs font-mono font-bold border border-emerald-400 rounded px-2 py-1 bg-white text-emerald-950 focus:ring-1 focus:ring-emerald-600 shadow-sm" />' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between pt-0.5">' +
          '<span id="cardPreviewNote_' + row.rowNumber + '" class="font-bold text-[10px] ' + (row.status === 'SESUAI' ? 'text-emerald-700' : (row.status === 'NAIK' ? 'text-red-700' : 'text-slate-500')) + '">' + escapeHtml(row.note) + '</span>' +
          '<button type="button" data-bahan="' + escapeHtml(row.bahan) + '" onclick="handleQuickReplaceAllFromMenu05(this.dataset.bahan)" class="text-[9px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">⚡ Replace All "' + escapeHtml(row.bahan) + '" di Seluruh Sheet (Menu 06)</button>' +
        '</div>' +
        '</div>'
      );
    });

    container.innerHTML = cards.join("");
  }

  window.handleToggleRowCheck = function(rowNumber, isChecked) {
    ciamsoRowCheckedMap[rowNumber] = isChecked;
    var row = ciamsoComparisonRows.find(function(r) { return r.rowNumber === rowNumber; });
    if (row) {
      row.isRowChecked = isChecked;
    }
    var chk1 = document.getElementById("chkRow_" + rowNumber);
    if (chk1 && chk1.checked !== isChecked) chk1.checked = isChecked;
    var chk2 = document.getElementById("chkCardRow_" + rowNumber);
    if (chk2 && chk2.checked !== isChecked) chk2.checked = isChecked;
    updateReplaceButtonSummary();
  };

  window.handleToggleAllRowsCheck = function(isChecked) {
    ciamsoComparisonRows.forEach(function(r) {
      if (!r.isEmptyRow) {
        ciamsoRowCheckedMap[r.rowNumber] = isChecked;
        r.isRowChecked = isChecked;
        var chk = document.getElementById("chkRow_" + r.rowNumber);
        if (chk) chk.checked = isChecked;
        var cardChk = document.getElementById("chkCardRow_" + r.rowNumber);
        if (cardChk) cardChk.checked = isChecked;
      }
    });
    updateReplaceButtonSummary();
  };

  window.handleManualKemasanChange = function(rowNumber, val) {
    var row = ciamsoComparisonRows.find(function(r) { return r.rowNumber === rowNumber; });
    if (!row) return;

    var k = Number(val) || 0;
    row.kemasan = k;
    ciamsoManualKemasanMap[rowNumber] = k;

    // Jika belum pernah di-override harga secara manual, hitung ulang harga kemasannya
    if (!row.manualPriceOverridden && row.matchedItem) {
      row.newHargaKemasan = calculateCiamsoPriceForKemasan(row.matchedItem, k);
      ciamsoManualHargaMap[rowNumber] = row.newHargaKemasan;
      var inpH = document.getElementById("inputHarga_" + rowNumber);
      if (inpH) inpH.value = row.newHargaKemasan;
      var cardH = document.getElementById("cardInputHarga_" + rowNumber);
      if (cardH) cardH.value = row.newHargaKemasan;
    }

    recomputeRowStatus(row);
    syncInputValues(rowNumber);
    updateReplaceButtonSummary();
  };

  window.handleManualHargaChange = function(rowNumber, val) {
    var row = ciamsoComparisonRows.find(function(r) { return r.rowNumber === rowNumber; });
    if (!row) return;

    var h = Number(val) || 0;
    row.newHargaKemasan = h;
    row.manualPriceOverridden = true;
    ciamsoManualHargaMap[rowNumber] = h;

    recomputeRowStatus(row);
    syncInputValues(rowNumber);
    updateReplaceButtonSummary();
  };

  function recomputeRowStatus(row) {
    var oldP = row.oldHargaKemasan || 0;
    var newP = row.newHargaKemasan || 0;

    if (newP <= 0) {
      row.status = "NOT_FOUND";
      row.note = "⚪ HARGA KOSONG";
    } else if (oldP > 0) {
      var diff = newP - oldP;
      if (diff > 0) {
        row.status = "NAIK";
        row.note = "🔺 NAIK (+" + formatIDR(diff) + " vs HPP)";
      } else if (diff < 0) {
        row.status = "SESUAI";
        row.note = "🟢 TURUN (-" + formatIDR(Math.abs(diff)) + ")";
      } else {
        row.status = "SESUAI";
        row.note = "🟢 SESUAI HPP";
      }
    } else {
      row.status = "SESUAI";
      row.note = "🟢 HARGA MANUAL";
    }

    var noteEl = document.getElementById("previewNote_" + row.rowNumber);
    if (noteEl) {
      noteEl.textContent = row.note;
      noteEl.className = "px-2 py-1.5 text-left font-mono text-[9px] whitespace-nowrap " +
        (row.status === "SESUAI" ? "bg-green-100 text-green-900 font-bold" : (row.status === "NAIK" ? "bg-red-100 text-red-900 font-bold" : "bg-slate-100 text-slate-500"));
    }

    var cardNoteEl = document.getElementById("cardPreviewNote_" + row.rowNumber);
    if (cardNoteEl) {
      cardNoteEl.textContent = row.note;
      cardNoteEl.className = "font-bold text-[10px] " +
        (row.status === "SESUAI" ? "text-emerald-700" : (row.status === "NAIK" ? "text-red-700" : "text-slate-500"));
    }
  }

  function syncInputValues(rowNumber) {
    var row = ciamsoComparisonRows.find(function(r) { return r.rowNumber === rowNumber; });
    if (!row) return;

    var inpK = document.getElementById("inputKemasan_" + rowNumber);
    var cardK = document.getElementById("cardInputKemasan_" + rowNumber);
    if (inpK && document.activeElement !== inpK) inpK.value = row.kemasan;
    if (cardK && document.activeElement !== cardK) cardK.value = row.kemasan;

    var inpH = document.getElementById("inputHarga_" + rowNumber);
    var cardH = document.getElementById("cardInputHarga_" + rowNumber);
    if (inpH && document.activeElement !== inpH) inpH.value = row.newHargaKemasan;
    if (cardH && document.activeElement !== cardH) cardH.value = row.newHargaKemasan;
  }

  function updateReplaceButtonSummary() {
    var checked = ciamsoComparisonRows.filter(function(r) {
      return !r.isEmptyRow && r.isRowChecked !== false && r.newHargaKemasan !== undefined && r.newHargaKemasan !== null && r.newHargaKemasan > 0;
    });
    var lbl = document.getElementById("lblSelectedRowsCount");
    if (lbl) {
      lbl.textContent = checked.length + " baris dicentang siap di-replace ke sheet saat ini";
    }
  }

  function handleOverrideCiamsoRowMatch(rowNumber, newId) {
    ciamsoManualOverrideMap[rowNumber] = newId;
    delete ciamsoManualHargaMap[rowNumber];
    recomputeCiamsoComparison();
  }

  window.handleQuickReplaceAllFromMenu05 = function(bahan) {
    switchFeatureMode('ciamso-replace');
    if (typeof handleQuickPickTargetBahan === 'function') {
      setTimeout(function() {
        handleQuickPickTargetBahan(bahan);
      }, 100);
    }
  };

  // =========================================================================
  // AKSI 1: AUTO CREATE TABEL PEMBANDING KE SHEET (PERSIS MEKANISME MENU 02)
  // =========================================================================
  function handleAutoCreateCiamsoTable() {
    if (!ciamsoRawSelection || ciamsoComparisonRows.length === 0) {
      showAuditStatus("error", "Belum ada baris HPP yang dipilih untuk dibuatkan tabel pembanding.");
      return;
    }

    var btn = document.getElementById("btnAutoCreateCiamsoTable");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Menulis Tabel Pembanding di Sheet...';

    // Format headers & rows untuk writeComparisonTableToSheet di Code.gs
    var headers = ["HARGA CIAMSO (OKT 2026)", "NOTE"];
    var payloadRows = ciamsoComparisonRows.map(function (r) {
      var cellStatus = r.status === "NAIK" ? "NAIK" : (r.status === "SESUAI" ? "SESUAI" : "EMPTY");
      return {
        isEmptyRow: r.isEmptyRow,
        values: [r.isEmptyRow ? "" : (r.newHargaKemasan || "-"), r.note || ""],
        cellStatuses: [cellStatus],
        noteColorStatus: cellStatus,
        noteText: r.note || ""
      };
    });

    var payload = {
      headers: headers,
      rows: payloadRows,
      headerMode: "auto",
      sourceMeta: {
        sheetName: ciamsoRawSelection.sheetName,
        startRow: ciamsoRawSelection.startRow,
        startCol: ciamsoRawSelection.startCol,
        rowCount: ciamsoRawSelection.rowCount,
        columnCount: ciamsoRawSelection.columnCount
      }
    };

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 2. AUTO CREATE TABEL PEMBANDING DI SHEET</span>';
          showAuditStatus("success", "✓ Berhasil membuat tabel pembanding Ciamso di sel " + res.rangeAddress + " (" + res.rowCount + " baris)!");
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 2. AUTO CREATE TABEL PEMBANDING DI SHEET</span>';
          showAuditStatus("error", "Gagal menulis tabel ke sheet: " + (err.message || err));
        })
        .writeComparisonTableToSheet(payload);
    } else {
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ 2. AUTO CREATE TABEL PEMBANDING DI SHEET</span>';
        showAuditStatus("success", "✓ Simulasi: Tabel pembanding Ciamso 2 warna berhasil dibuat di sheet!");
      }, 500);
    }
  }

  // =========================================================================
  // AKSI 2: GANTI HARGA & KEMASAN MANUAL DI SHEET SAAT INI (WARNA HIJAU)
  // =========================================================================
  function handleApplyCiamsoReplaceDirect() {
    var validRowsToUpdate = ciamsoComparisonRows.filter(function (r) {
      return !r.isEmptyRow && r.isRowChecked !== false && r.newHargaKemasan !== undefined && r.newHargaKemasan !== null && r.newHargaKemasan > 0;
    });

    if (validRowsToUpdate.length === 0) {
      showAuditStatus("error", "Tidak ada baris bahan yang dicentang / memiliki harga valid untuk di-replace.");
      return;
    }

    var btn = document.getElementById("btnApplyCiamsoReplaceDirect");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Mengganti ' + validRowsToUpdate.length + ' Baris di Sheet Saat Ini...';

    var payload = {
      sheetName: null, // HANYA DI SHEET SAAT INI (ACTIVE SHEET)
      highlightGreen: true,
      highlightColor: "#dcfce7",
      items: validRowsToUpdate.map(function (r) {
        return {
          sheetRow: r.sheetRow,
          sheetCol: r.sheetCol,
          kemasanCol: r.sheetColKemasan,
          newKemasan: r.kemasan,
          cellAddress: r.cellAddress,
          newValue: r.newHargaKemasan,
          oldValue: r.oldHargaKemasan,
          bahan: r.bahan
        };
      })
    };

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function (res) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ GANTI HARGA / KEMASAN MANUAL DI SHEET SAAT INI (WARNA HIJAU)</span>';
          showAuditStatus("success", "✓ Sukses! Berhasil mereplace " + res.totalUpdated + " baris pada sheet '" + res.sheetName + "' dengan harga manual & warna HIJAU!");
        })
        .withFailureHandler(function (err) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ GANTI HARGA / KEMASAN MANUAL DI SHEET SAAT INI (WARNA HIJAU)</span>';
          showAuditStatus("error", "Gagal mereplace harga ke sheet: " + (err.message || err));
        })
        .applyReplaceHargaKemasanToSheet(payload);
    } else {
      setTimeout(function () {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ GANTI HARGA / KEMASAN MANUAL DI SHEET SAAT INI (WARNA HIJAU)</span>';
        showAuditStatus("success", "✓ Simulasi: " + validRowsToUpdate.length + " sel kolom HARGA / KEMASAN berhasil di-replace dengan warna HIJAU!");
      }, 500);
    }
  }
</script>
`;

fs.writeFileSync(path.join(rootDir, '03-sidebar-ui', 'CiamsoPembandingView.html'), viewContent, 'utf8');
console.log('Successfully written 03-sidebar-ui/CiamsoPembandingView.html with exact 8-column structure!');
