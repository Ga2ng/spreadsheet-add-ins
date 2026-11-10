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

console.log('Total Ciamso Items parsed for Replace Data:', items.length);

const viewContent = `<!--
===============================================================================
MENU 06: REPLACE DATA (ReplaceDataView.html)
===============================================================================
Fitur:
1. Mengganti kolom HARGA / KEMASAN di Sheet untuk SATU BAHAN TERTENTU di SELURUH resep di sheet,
   atau SCAN SELURUH SHEET & REPLACE MASSAL sekaligus.
2. Seluruh sel yang diubah otomatis diberi latar warna HIJAU MUDA (#dcfce7) sesuai RULES.md.
3. Basis data harga: INVENTORY CIAMSO SBY OKT (116 Item).
===============================================================================
-->
<div id="viewReplaceData" class="space-y-3">

  <!-- STEP 1: INFO BASIS DATA CIAMSO -->
  <section class="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-2.5">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h2 class="text-xs font-bold uppercase tracking-wider text-emerald-800">06. Replace Data (Replace All Bahan di Sheet)</h2>
        <p class="text-[11px] text-slate-500">
          Ganti kolom <code class="font-mono text-emerald-700 font-semibold">HARGA / KEMASAN</code> untuk bahan pilihan di seluruh resep sekaligus.
        </p>
      </div>
      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
        116 Item Ciamso
      </span>
    </div>

    <!-- TAB PILIHAN METODE REPLACE -->
    <div class="flex border-b border-slate-200 gap-1 text-[11px] font-bold">
      <button
        id="tabBtnSingleBahan"
        type="button"
        onclick="switchReplaceDataTab('single')"
        class="py-1.5 px-3 border-b-2 border-emerald-600 text-emerald-700"
      >
        🎯 Pilih 1 Bahan (Replace All)
      </button>
      <button
        id="tabBtnScanAll"
        type="button"
        onclick="switchReplaceDataTab('all')"
        class="py-1.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700"
      >
        📋 Scan Seluruh Sheet (Massal)
      </button>
      <button
        id="tabBtnSelection"
        type="button"
        onclick="switchReplaceDataTab('selection')"
        class="py-1.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700"
      >
        🔍 Range Seleksi
      </button>
    </div>
  </section>

  <!-- PANEL 1: PILIH 1 BAHAN & REPLACE ALL DI SELURUH SHEET -->
  <section id="panelSingleBahan" class="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-3">
    <div class="space-y-1">
      <label for="selectCiamsoBahanTarget" class="block text-[11px] font-bold text-slate-700">
        1. Pilih Bahan yang Ingin Di-Replace All di Sheet:
      </label>
      <div class="flex gap-1.5">
        <select
          id="selectCiamsoBahanTarget"
          onchange="handleSelectCiamsoTargetBahan(this.value)"
          class="flex-1 text-xs font-semibold border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-sm"
        >
          <option value="">-- Pilih Bahan dari Database Ciamso --</option>
        </select>
        <button
          type="button"
          onclick="handleQuickPickTargetBahan('beras')"
          class="text-[10px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 border rounded text-slate-700"
          title="Contoh: Beras"
        >
          Beras
        </button>
        <button
          type="button"
          onclick="handleQuickPickTargetBahan('ayam grill')"
          class="text-[10px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 border rounded text-slate-700"
          title="Contoh: Ayam Grill"
        >
          Ayam Grill
        </button>
      </div>
    </div>

    <!-- INFO DETAIL HARGA INVENTORY CIAMSO -->
    <div id="targetBahanInfoBox" class="hidden bg-emerald-50/70 border border-emerald-200 rounded-md p-2.5 text-xs text-emerald-950 space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="font-bold text-xs" id="infoBahanName">-</span>
        <span class="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded font-mono font-bold" id="infoBahanUnit">-</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span class="text-slate-500">Harga Satuan Ciamso:</span>
          <div class="font-mono font-bold text-emerald-800" id="infoBahanPrice">-</div>
        </div>
        <div>
          <span class="text-slate-500">Pengali Kemasan Resep:</span>
          <div class="font-mono font-bold text-slate-800" id="infoBahanKemasan">Otomatis / 1</div>
        </div>
      </div>
    </div>

    <!-- TOMBOL CARI DI SELURUH SHEET -->
    <button
      id="btnFindBahanInSheet"
      type="button"
      onclick="handleFindTargetBahanInSheet()"
      class="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors"
    >
      <span>🔍 2. Cari Semua Baris Resep Bahan Ini di Sheet Aktif</span>
    </button>

    <!-- HASIL PENCARIAN DI SHEET -->
    <div id="singleBahanResultsBox" class="hidden space-y-2">
      <div class="flex items-center justify-between text-[11px]">
        <span class="font-bold text-slate-700" id="singleBahanCountLabel">Ditemukan di 0 Resep</span>
        <span class="text-[10px] text-slate-500">Kolom Target: <b class="text-emerald-800" id="singleBahanTargetColName">HARGA / KEMASAN</b></span>
      </div>

      <!-- DAFTAR RESEP YANG MENGGUNAKAN BAHAN INI -->
      <div id="singleBahanLocationsList" class="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 text-xs">
        <!-- Render baris per resep -->
      </div>

      <!-- TOMBOL EKSEKUSI REPLACE ALL -->
      <button
        id="btnExecuteSingleBahanReplaceAll"
        type="button"
        onclick="handleExecuteSingleBahanReplaceAll()"
        class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>⚡ 3. REPLACE ALL BAHAN INI DI SELURUH SHEET (WARNA HIJAU)</span>
      </button>
    </div>
  </section>

  <!-- PANEL 2: SCAN SELURUH SHEET & REPLACE MASSAL -->
  <section id="panelScanAll" class="hidden bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-3">
    <div>
      <h3 class="text-xs font-bold text-slate-800">Scan Seluruh Resep di Sheet Aktif</h3>
      <p class="text-[11px] text-slate-500">
        Membaca semua resep dan mencocokkan seluruh bahan dengan database Ciamso Okt.
      </p>
    </div>

    <button
      id="btnScanEntireSheetMassal"
      type="button"
      onclick="handleScanEntireSheetMassal()"
      class="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1.5 transition-colors"
    >
      <span>🔍 1. Scan Seluruh Isi Sheet Aktif Sekarang</span>
    </button>

    <!-- HASIL SCAN MASSAL -->
    <div id="massalScanResultsBox" class="hidden space-y-2.5">
      <div class="flex items-center justify-between text-[11px] bg-slate-50 border p-2 rounded">
        <div>
          <span class="font-bold text-slate-800" id="massalTotalItemsLabel">0 Bahan Ditemukan</span>
          <div class="text-[10px] text-slate-500" id="massalRecipesCountLabel">Dari 0 Resep</div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick="toggleAllMassalCheckboxes(true)"
            class="text-[10px] font-semibold text-emerald-700 hover:underline"
          >
            Pilih Semua
          </button>
          <span class="text-slate-300">|</span>
          <button
            type="button"
            onclick="toggleAllMassalCheckboxes(false)"
            class="text-[10px] font-semibold text-slate-500 hover:underline"
          >
            Batal
          </button>
        </div>
      </div>

      <!-- TABEL REKAP MASSAL -->
      <div id="massalItemsTableContainer" class="max-h-64 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 text-xs">
        <!-- Render rekap bahan -->
      </div>

      <!-- TOMBOL EKSEKUSI MASSAL -->
      <button
        id="btnExecuteMassalReplaceAll"
        type="button"
        onclick="handleExecuteMassalReplaceAll()"
        class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>⚡ 2. REPLACE ALL BAHAN TERPILIH DI SELURUH SHEET (WARNA HIJAU)</span>
      </button>
    </div>
  </section>

  <!-- PANEL 3: RANGE SELEKSI MANUAL -->
  <section id="panelSelection" class="hidden bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm space-y-3">
    <div>
      <h3 class="text-xs font-bold text-slate-800">Mode Range Seleksi Manual</h3>
      <p class="text-[11px] text-slate-500">
        Blok range resep tertentu di Google Sheets (8 kolom HPP) dan replace kolom HARGA / KEMASAN-nya.
      </p>
    </div>

    <button
      id="btnReadSelectionReplace"
      type="button"
      onclick="handleReadSelectionReplace()"
      class="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow-sm"
    >
      <span>1. Baca Range yang Sedang Diblok</span>
    </button>

    <div id="selectionReplaceResultsBox" class="hidden space-y-2">
      <div id="selectionReplaceSummary" class="text-[11px] text-slate-600 font-semibold"></div>
      <div id="selectionReplaceList" class="max-h-56 overflow-y-auto space-y-1.5 text-xs"></div>
      <button
        id="btnExecuteSelectionReplace"
        type="button"
        onclick="handleExecuteSelectionReplace()"
        class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow"
      >
        <span>⚡ REPLACE RANGE TERSELEKSI (WARNA HIJAU)</span>
      </button>
    </div>
  </section>

</div>

<script>
(function() {
  // DATASET 116 ITEM CIAMSO OKT
  var CIAMSO_ITEMS = ${JSON.stringify(items, null, 2)};
  window.CIAMSO_OCT_INVENTORY = CIAMSO_ITEMS;

  // State Global Fitur 06
  var replaceActiveTab = 'single';
  var selectedTargetCiamsoItem = null;
  var scannedSheetRecipeRows = [];
  var singleBahanMatches = [];
  var massalGroupedBahan = [];
  var selectionRowsData = [];

  window.initReplaceDataView = function() {
    populateCiamsoDropdown();
  };

  function populateCiamsoDropdown() {
    var sel = document.getElementById("selectCiamsoBahanTarget");
    if (!sel || sel.options.length > 2) return;

    sel.innerHTML = '<option value="">-- Pilih Bahan dari Database Ciamso (116 Item) --</option>';
    CIAMSO_ITEMS.forEach(function(it) {
      var opt = document.createElement("option");
      opt.value = it.id;
      opt.textContent = it.name + ' (' + formatIDR(it.price) + ' / ' + it.unit + ')';
      sel.appendChild(opt);
    });
  }

  window.switchReplaceDataTab = function(tab) {
    replaceActiveTab = tab;
    var btnSingle = document.getElementById("tabBtnSingleBahan");
    var btnAll = document.getElementById("tabBtnScanAll");
    var btnSel = document.getElementById("tabBtnSelection");

    var pSingle = document.getElementById("panelSingleBahan");
    var pAll = document.getElementById("panelScanAll");
    var pSel = document.getElementById("panelSelection");

    [btnSingle, btnAll, btnSel].forEach(function(b) {
      if (b) {
        b.className = "py-1.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700";
      }
    });

    if (pSingle) pSingle.classList.add("hidden");
    if (pAll) pAll.classList.add("hidden");
    if (pSel) pSel.classList.add("hidden");

    if (tab === 'single') {
      if (btnSingle) btnSingle.className = "py-1.5 px-3 border-b-2 border-emerald-600 text-emerald-700 font-bold";
      if (pSingle) pSingle.classList.remove("hidden");
    } else if (tab === 'all') {
      if (btnAll) btnAll.className = "py-1.5 px-3 border-b-2 border-emerald-600 text-emerald-700 font-bold";
      if (pAll) pAll.classList.remove("hidden");
    } else {
      if (btnSel) btnSel.className = "py-1.5 px-3 border-b-2 border-emerald-600 text-emerald-700 font-bold";
      if (pSel) pSel.classList.remove("hidden");
    }
  };

  window.handleQuickPickTargetBahan = function(query) {
    populateCiamsoDropdown();
    var qClean = query.toLowerCase().trim();
    var match = CIAMSO_ITEMS.find(function(it) {
      return it.name.toLowerCase().includes(qClean);
    });

    if (match) {
      var sel = document.getElementById("selectCiamsoBahanTarget");
      if (sel) sel.value = match.id;
      handleSelectCiamsoTargetBahan(match.id);
      handleFindTargetBahanInSheet();
    }
  };

  window.handleSelectCiamsoTargetBahan = function(itemId) {
    selectedTargetCiamsoItem = CIAMSO_ITEMS.find(function(it) { return it.id === itemId; }) || null;
    var infoBox = document.getElementById("targetBahanInfoBox");
    if (!selectedTargetCiamsoItem) {
      if (infoBox) infoBox.classList.add("hidden");
      return;
    }

    if (infoBox) infoBox.classList.remove("hidden");
    document.getElementById("infoBahanName").textContent = selectedTargetCiamsoItem.name;
    document.getElementById("infoBahanUnit").textContent = selectedTargetCiamsoItem.unit;
    document.getElementById("infoBahanPrice").textContent = "Rp " + formatIDR(selectedTargetCiamsoItem.price) + " / " + selectedTargetCiamsoItem.unit;
  };

  // -------------------------------------------------------------
  // TAB 1: CARI BAHAN TERTENTU & REPLACE ALL DI SHEET
  // -------------------------------------------------------------
  window.handleFindTargetBahanInSheet = function() {
    if (!selectedTargetCiamsoItem) {
      var selVal = document.getElementById("selectCiamsoBahanTarget").value;
      if (selVal) {
        selectedTargetCiamsoItem = CIAMSO_ITEMS.find(function(it) { return it.id === selVal; }) || null;
      }
    }

    if (!selectedTargetCiamsoItem) {
      showAuditStatus("error", "Silakan pilih salah satu bahan Ciamso terlebih dahulu.");
      return;
    }

    var btn = document.getElementById("btnFindBahanInSheet");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Memindai Seluruh Sheet Aktif...';

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔍 2. Cari Semua Baris Resep Bahan Ini di Sheet Aktif</span>';
          processSingleBahanScanResults(res);
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔍 2. Cari Semua Baris Resep Bahan Ini di Sheet Aktif</span>';
          showAuditStatus("error", "Gagal memindai sheet: " + err.message);
        })
        .scanRecipeRowsFromEntireSheet();
    } else {
      // Mock Data jika di-run di luar GAS (Browser Preview)
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>🔍 2. Cari Semua Baris Resep Bahan Ini di Sheet Aktif</span>';
        var mockRes = {
          success: true,
          sheetName: "HPP CIAMSO SBY",
          totalRowsScanned: 50,
          totalItemsFound: 16,
          detectedColumns: { colPrep: "B", colBahan: "C", colKemasan: "F", colHargaKemasan: "G" },
          items: [
            { sheetRow: 2, sheetCol: 7, cellAddress: "G2", recipe: "BUBUR ORIENTAL", bahan: "beras", kemasan: 25000, hargaKemasan: 425000 },
            { sheetRow: 3, sheetCol: 7, cellAddress: "G3", recipe: "BUBUR ORIENTAL", bahan: "daun bawang", kemasan: 1000, hargaKemasan: 30000 },
            { sheetRow: 4, sheetCol: 7, cellAddress: "G4", recipe: "BUBUR ORIENTAL", bahan: "ayam grill", kemasan: 1, hargaKemasan: 5385 },
            { sheetRow: 5, sheetCol: 7, cellAddress: "G5", recipe: "BUBUR ORIENTAL", bahan: "kecap asin", kemasan: 600, hargaKemasan: 42600 },
            { sheetRow: 6, sheetCol: 7, cellAddress: "G6", recipe: "BUBUR ORIENTAL", bahan: "minyak wijen", kemasan: 620, hargaKemasan: 48360 },
            { sheetRow: 8, sheetCol: 7, cellAddress: "G8", recipe: "BUBUR ORIENTAL", bahan: "bawang merah goreng", kemasan: 1000, hargaKemasan: 116000 },
            { sheetRow: 9, sheetCol: 7, cellAddress: "G9", recipe: "BUBUR ORIENTAL", bahan: "kerupuk", kemasan: 1, hargaKemasan: 1050 },
            { sheetRow: 12, sheetCol: 7, cellAddress: "G12", recipe: "BUBUR AYAM HAUCEK", bahan: "beras", kemasan: 25000, hargaKemasan: 425000 },
            { sheetRow: 13, sheetCol: 7, cellAddress: "G13", recipe: "BUBUR AYAM HAUCEK", bahan: "daun bawang", kemasan: 1000, hargaKemasan: 30000 },
            { sheetRow: 14, sheetCol: 7, cellAddress: "G14", recipe: "BUBUR AYAM HAUCEK", bahan: "ayam grill", kemasan: 1, hargaKemasan: 5385 },
            { sheetRow: 15, sheetCol: 7, cellAddress: "G15", recipe: "BUBUR AYAM HAUCEK", bahan: "telor pitan", kemasan: 20, hargaKemasan: 220000 },
            { sheetRow: 16, sheetCol: 7, cellAddress: "G16", recipe: "BUBUR AYAM HAUCEK", bahan: "kecap asin", kemasan: 600, hargaKemasan: 42600 },
            { sheetRow: 17, sheetCol: 7, cellAddress: "G17", recipe: "BUBUR AYAM HAUCEK", bahan: "minyak wijen", kemasan: 620, hargaKemasan: 48360 },
            { sheetRow: 19, sheetCol: 7, cellAddress: "G19", recipe: "BUBUR AYAM HAUCEK", bahan: "bawang merah goreng", kemasan: 1000, hargaKemasan: 116000 },
            { sheetRow: 20, sheetCol: 7, cellAddress: "G20", recipe: "BUBUR AYAM HAUCEK", bahan: "kerupuk", kemasan: 1, hargaKemasan: 1050 }
          ]
        };
        processSingleBahanScanResults(mockRes);
      }, 500);
    }
  };

  function processSingleBahanScanResults(res) {
    if (!res || !res.items) {
      showAuditStatus("error", "Data hasil scan kosong.");
      return;
    }

    scannedSheetRecipeRows = res.items;

    // Cari seluruh baris di mana bahan sheet cocok dengan target Ciamso (case-insensitive & fuzzy)
    singleBahanMatches = scannedSheetRecipeRows.filter(function(row) {
      var match = findBestCiamsoMatchForText(row.bahan);
      return match && match.id === selectedTargetCiamsoItem.id;
    });

    var resultsBox = document.getElementById("singleBahanResultsBox");
    var listContainer = document.getElementById("singleBahanLocationsList");
    var countLabel = document.getElementById("singleBahanCountLabel");
    var targetColName = document.getElementById("singleBahanTargetColName");

    if (resultsBox) resultsBox.classList.remove("hidden");
    if (targetColName && res.detectedColumns) {
      targetColName.textContent = "HARGA / KEMASAN (Kolom " + res.detectedColumns.colHargaKemasan + ")";
    }

    if (singleBahanMatches.length === 0) {
      countLabel.textContent = "Tidak ditemukan di sheet aktif";
      listContainer.innerHTML = '<div class="p-3 text-center text-slate-500 bg-slate-50 rounded border text-xs">Bahan <b>' + selectedTargetCiamsoItem.name + '</b> tidak ditemukan di baris resep sheet ini.</div>';
      document.getElementById("btnExecuteSingleBahanReplaceAll").disabled = true;
      return;
    }

    countLabel.textContent = "Ditemukan di " + singleBahanMatches.length + " Resep di Sheet ini";
    document.getElementById("btnExecuteSingleBahanReplaceAll").disabled = false;

    // Render kartu tiap resep
    listContainer.innerHTML = singleBahanMatches.map(function(m, idx) {
      var kemasan = m.kemasan || 1;
      var newHargaKemasan = Math.round(selectedTargetCiamsoItem.price * kemasan);
      var oldHarga = m.hargaKemasan || 0;
      var diff = newHargaKemasan - oldHarga;
      var isNaik = diff > 0;
      var isSesuai = diff <= 0;

      m.calculatedNewHarga = newHargaKemasan;

      return '<div class="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between gap-2">' +
        '<div>' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Baris ' + m.sheetRow + '</span>' +
            '<span class="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 rounded">' + m.cellAddress + '</span>' +
            '<span class="font-bold text-slate-800">' + m.recipe + '</span>' +
          '</div>' +
          '<div class="text-[11px] text-slate-500 mt-0.5">' +
            'Bahan: <b>' + m.bahan + '</b> • Kemasan: <b>' + formatIDR(kemasan) + ' ' + (m.satuan || '') + '</b>' +
          '</div>' +
        '</div>' +
        '<div class="text-right shrink-0">' +
          '<div class="text-[10px] text-slate-400 line-through">Lama: Rp ' + formatIDR(oldHarga) + '</div>' +
          '<div class="font-mono font-bold text-xs ' + (isNaik ? 'text-red-700' : 'text-emerald-700') + '">' +
            'Baru: Rp ' + formatIDR(newHargaKemasan) +
          '</div>' +
          '<span class="text-[9px] font-bold px-1 py-0.5 rounded ' + (isNaik ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800') + '">' +
            (isNaik ? '🔺 Naik +' + formatIDR(diff) : '🟢 Sesuai/Turun') +
          '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    showAuditStatus("info", "Ditemukan " + singleBahanMatches.length + " kemunculan bahan '" + selectedTargetCiamsoItem.name + "' di sheet aktif.");
  }

  window.handleExecuteSingleBahanReplaceAll = function() {
    if (!singleBahanMatches || singleBahanMatches.length === 0) {
      showAuditStatus("error", "Tidak ada baris bahan yang dapat di-replace.");
      return;
    }

    var btn = document.getElementById("btnExecuteSingleBahanReplaceAll");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Mengganti ' + singleBahanMatches.length + ' Sel di Sheet & Mewarnai Hijau...';

    var updates = singleBahanMatches.map(function(m) {
      return {
        sheetRow: m.sheetRow,
        sheetCol: m.sheetCol,
        cellAddress: m.cellAddress,
        newValue: m.calculatedNewHarga,
        oldValue: m.hargaKemasan,
        bahan: m.bahan,
        recipe: m.recipe
      };
    });

    var payload = {
      sheetName: null,
      highlightColor: "#dcfce7", // Hijau Muda
      updates: updates
    };

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 3. REPLACE ALL BAHAN INI DI SELURUH SHEET (WARNA HIJAU)</span>';
          showAuditStatus("success", "BERHASIL! " + res.totalUpdated + " sel kolom HARGA / KEMASAN untuk '" + selectedTargetCiamsoItem.name + "' telah di-replace & diwarnai HIJAU di sheet " + res.sheetName + ".");
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 3. REPLACE ALL BAHAN INI DI SELURUH SHEET (WARNA HIJAU)</span>';
          showAuditStatus("error", "Gagal me-replace: " + err.message);
        })
        .replaceAllBahanInActiveSheet(payload);
    } else {
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ 3. REPLACE ALL BAHAN INI DI SELURUH SHEET (WARNA HIJAU)</span>';
        showAuditStatus("success", "(Demo Mode) Berhasil me-replace " + updates.length + " sel di sheet dengan warna latar hijau muda (#dcfce7)!");
      }, 700);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: SCAN SELURUH SHEET & REPLACE MASSAL
  // -------------------------------------------------------------
  window.handleScanEntireSheetMassal = function() {
    var btn = document.getElementById("btnScanEntireSheetMassal");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Membaca Seluruh Resep di Sheet...';

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔍 1. Scan Seluruh Isi Sheet Aktif Sekarang</span>';
          processMassalScanResults(res);
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>🔍 1. Scan Seluruh Isi Sheet Aktif Sekarang</span>';
          showAuditStatus("error", "Gagal memindai sheet: " + err.message);
        })
        .scanRecipeRowsFromEntireSheet();
    } else {
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>🔍 1. Scan Seluruh Isi Sheet Aktif Sekarang</span>';
        handleFindTargetBahanInSheet(); // reuse mock
      }, 500);
    }
  };

  function processMassalScanResults(res) {
    if (!res || !res.items || res.items.length === 0) {
      showAuditStatus("error", "Tidak ada baris resep yang ditemukan di sheet aktif.");
      return;
    }

    scannedSheetRecipeRows = res.items;

    // Kelompokkan per nama bahan unik
    var grouped = {};
    scannedSheetRecipeRows.forEach(function(row) {
      var normB = row.bahan.toLowerCase().trim();
      if (!grouped[normB]) {
        grouped[normB] = {
          name: row.bahan,
          normName: normB,
          occurrences: [],
          matchedCiamso: null
        };
      }
      grouped[normB].occurrences.push(row);
    });

    // Cocokkan tiap grup bahan dengan inventory Ciamso
    massalGroupedBahan = Object.values(grouped).map(function(grp) {
      var best = findBestCiamsoMatchForText(grp.name);
      grp.matchedCiamso = best;
      return grp;
    });

    var box = document.getElementById("massalScanResultsBox");
    var totalLabel = document.getElementById("massalTotalItemsLabel");
    var recipeLabel = document.getElementById("massalRecipesCountLabel");
    var tableContainer = document.getElementById("massalItemsTableContainer");

    if (box) box.classList.remove("hidden");
    totalLabel.textContent = massalGroupedBahan.length + " Bahan Unik (" + scannedSheetRecipeRows.length + " Total Baris)";

    var uniqueRecipes = {};
    scannedSheetRecipeRows.forEach(function(r) { if (r.recipe) uniqueRecipes[r.recipe] = true; });
    recipeLabel.textContent = "Tersebar di " + Object.keys(uniqueRecipes).length + " Resep";

    renderMassalGroupedTable();
    showAuditStatus("info", "Berhasil memindai " + scannedSheetRecipeRows.length + " baris resep di sheet.");
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

  function findBestCiamsoMatchForText(text) {
    var rawB = String(text || "").trim();
    var lowerB = rawB.toLowerCase();
    if (!lowerB) return null;

    if (lowerB === "air" || lowerB.replace(/[^a-z]/g, "") === "air") return null;

    var normKey = lowerB.replace(/[^a-z0-9]/g, "");
    for (var i = 0; i < CIAMSO_ITEMS.length; i++) {
      var itKey = CIAMSO_ITEMS[i].name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (itKey === normKey) return CIAMSO_ITEMS[i];
    }

    var qWords = cleanCiamsoIngredientWords(lowerB);
    if (qWords.length === 0) return null;

    var best = null;
    var maxScore = -1;

    for (var j = 0; j < CIAMSO_ITEMS.length; j++) {
      var it = CIAMSO_ITEMS[j];
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

  function renderMassalGroupedTable() {
    var container = document.getElementById("massalItemsTableContainer");
    if (!container) return;

    container.innerHTML = massalGroupedBahan.map(function(grp, idx) {
      var hasMatch = grp.matchedCiamso !== null;
      var ciamsoName = hasMatch ? grp.matchedCiamso.name : "Tidak ditemukan di Ciamso";
      var ciamsoPrice = hasMatch ? "Rp " + formatIDR(grp.matchedCiamso.price) + " / " + grp.matchedCiamso.unit : "-";

      return '<div class="p-2.5 flex items-start justify-between gap-2 hover:bg-slate-50">' +
        '<div class="flex items-start gap-2">' +
          '<input type="checkbox" id="massalChk_' + idx + '" ' + (hasMatch ? 'checked' : 'disabled') + ' class="mt-1 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />' +
          '<div>' +
            '<div class="font-bold text-slate-800">' + grp.name + '</div>' +
            '<div class="text-[10px] text-slate-500">' +
              'Muncul di <b>' + grp.occurrences.length + ' resep</b> • Match: <span class="' + (hasMatch ? 'text-emerald-700 font-semibold' : 'text-slate-400') + '">' + ciamsoName + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="text-right shrink-0">' +
          '<div class="font-mono font-bold text-[11px] text-slate-700">' + ciamsoPrice + '</div>' +
          '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded ' + (hasMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500') + '">' +
            (hasMatch ? '🟢 COCOK' : '⚪ SKIP') +
          '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.toggleAllMassalCheckboxes = function(check) {
    massalGroupedBahan.forEach(function(grp, idx) {
      var chk = document.getElementById("massalChk_" + idx);
      if (chk && !chk.disabled) chk.checked = check;
    });
  };

  window.handleExecuteMassalReplaceAll = function() {
    var updates = [];

    massalGroupedBahan.forEach(function(grp, idx) {
      var chk = document.getElementById("massalChk_" + idx);
      if (chk && chk.checked && grp.matchedCiamso) {
        grp.occurrences.forEach(function(row) {
          var kemasan = row.kemasan || 1;
          var newVal = Math.round(grp.matchedCiamso.price * kemasan);
          updates.push({
            sheetRow: row.sheetRow,
            sheetCol: row.sheetCol,
            cellAddress: row.cellAddress,
            newValue: newVal,
            oldValue: row.hargaKemasan,
            bahan: row.bahan,
            recipe: row.recipe
          });
        });
      }
    });

    if (updates.length === 0) {
      showAuditStatus("error", "Tidak ada bahan yang dicentang untuk di-replace.");
      return;
    }

    var btn = document.getElementById("btnExecuteMassalReplaceAll");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Mengganti ' + updates.length + ' Sel di Seluruh Sheet...';

    var payload = {
      sheetName: null,
      highlightColor: "#dcfce7",
      updates: updates
    };

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 2. REPLACE ALL BAHAN TERPILIH DI SELURUH SHEET (WARNA HIJAU)</span>';
          showAuditStatus("success", "BERHASIL MASSAL! " + res.totalUpdated + " sel di seluruh resep telah di-replace & diberi warna HIJAU!");
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ 2. REPLACE ALL BAHAN TERPILIH DI SELURUH SHEET (WARNA HIJAU)</span>';
          showAuditStatus("error", "Gagal replace massal: " + err.message);
        })
        .replaceAllBahanInActiveSheet(payload);
    } else {
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ 2. REPLACE ALL BAHAN TERPILIH DI SELURUH SHEET (WARNA HIJAU)</span>';
        showAuditStatus("success", "(Demo) Berhasil me-replace massal " + updates.length + " sel di sheet dengan warna hijau muda!");
      }, 700);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: SELEKSI RANGE MANUAL
  // -------------------------------------------------------------
  window.handleReadSelectionReplace = function() {
    var btn = document.getElementById("btnReadSelectionReplace");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Membaca Range...';

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(sel) {
          btn.disabled = false;
          btn.innerHTML = '<span>1. Baca Range yang Sedang Diblok</span>';
          processSelectionReplaceData(sel);
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>1. Baca Range yang Sedang Diblok</span>';
          showAuditStatus("error", "Gagal membaca range: " + err.message);
        })
        .readSelectedRangeFromSheet();
    } else {
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>1. Baca Range yang Sedang Diblok</span>';
        showAuditStatus("info", "(Mode Demo) Gunakan di Google Sheets untuk membaca seleksi.");
      }, 500);
    }
  };

  function processSelectionReplaceData(sel) {
    if (!sel || !sel.values || sel.values.length === 0) {
      showAuditStatus("error", "Range seleksi kosong.");
      return;
    }

    selectionRowsData = [];
    var startRow = Number(sel.startRow);
    var startCol = Number(sel.startCol);

    for (var r = 0; r < sel.values.length; r++) {
      var row = sel.values[r];
      var rawBahan = row[0];
      if (!rawBahan || String(rawBahan).trim() === "") continue;

      var bahan = String(rawBahan).trim();
      var kemasan = Number(row[3]) || 1;
      var oldHarga = Number(row[4]) || 0;
      var match = findBestCiamsoMatchForText(bahan);
      var unitPrice = match ? match.price : 0;
      var defaultNewVal = unitPrice > 0 ? Math.round(unitPrice * kemasan) : oldHarga;

      selectionRowsData.push({
        idx: r,
        sheetRow: startRow + r,
        sheetCol: startCol + 4,
        kemasanCol: startCol + 3,
        cellAddress: colNumberToLetter_(startCol + 4) + (startRow + r),
        bahan: bahan,
        recipe: sel.sheetName,
        oldValue: oldHarga,
        kemasan: kemasan,
        newKemasan: kemasan,
        unitPrice: unitPrice,
        newValue: defaultNewVal,
        matchName: match ? match.name : "Input Manual",
        isRowChecked: true,
        isManualPrice: false
      });
    }

    var box = document.getElementById("selectionReplaceResultsBox");
    if (box) box.classList.remove("hidden");

    renderSelectionReplaceUI();
  }

  function renderSelectionReplaceUI() {
    var sum = document.getElementById("selectionReplaceSummary");
    var list = document.getElementById("selectionReplaceList");
    if (!sum || !list) return;

    var checkedCount = selectionRowsData.filter(function(it) { return it.isRowChecked !== false; }).length;
    sum.innerHTML = '<div class="flex items-center justify-between pb-1 border-b border-slate-200">' +
      '<span>Ditemukan <b>' + selectionRowsData.length + '</b> baris (Terpilih: <b>' + checkedCount + '</b>)</span>' +
      '<div class="flex items-center gap-1.5 text-[10px]">' +
        '<button type="button" onclick="handleToggleAllSelectionRows(true)" class="text-emerald-700 hover:underline font-bold">Pilih Semua</button>' +
        '<span>|</span>' +
        '<button type="button" onclick="handleToggleAllSelectionRows(false)" class="text-slate-500 hover:underline font-bold">Batal</button>' +
      '</div>' +
    '</div>';

    list.innerHTML = selectionRowsData.map(function(it) {
      var isChecked = it.isRowChecked !== false ? 'checked' : '';
      return '<div class="p-2 border rounded bg-slate-50 space-y-1.5 text-xs">' +
        '<div class="flex items-start justify-between gap-1.5">' +
          '<label class="flex items-center gap-1.5 cursor-pointer flex-1">' +
            '<input type="checkbox" ' + isChecked + ' onchange="handleToggleSelectionRowCheck(' + it.idx + ', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">' +
            '<div>' +
              '<div class="font-bold text-slate-800">' + it.bahan + ' <span class="text-[10px] text-slate-400 font-mono">(' + it.cellAddress + ')</span></div>' +
              '<div class="text-[10px] text-slate-500 truncate max-w-[200px]" title="' + it.matchName + '">Basis: ' + it.matchName + '</div>' +
            '</div>' +
          '</label>' +
          '<div class="text-right shrink-0">' +
            '<div class="text-[10px] text-slate-400">Harga Lama:</div>' +
            '<div class="text-[10px] font-mono line-through text-slate-400">Rp ' + formatIDR(it.oldValue) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 bg-white/70 p-1.5 rounded">' +
          '<div>' +
            '<label class="block text-[9px] font-bold text-slate-600">Kemasan (Manual):</label>' +
            '<input type="number" step="any" value="' + it.newKemasan + '" oninput="handleSelectionKemasanChange(' + it.idx + ', this.value)" class="w-full px-1.5 py-0.5 border border-slate-300 rounded text-[11px] font-mono text-center focus:ring-1 focus:ring-emerald-500 bg-white">' +
          '</div>' +
          '<div>' +
            '<label class="block text-[9px] font-bold text-emerald-800">Harga Baru (Manual):</label>' +
            '<input type="number" step="any" value="' + it.newValue + '" oninput="handleSelectionHargaChange(' + it.idx + ', this.value)" class="w-full px-1.5 py-0.5 border border-emerald-400 rounded text-[11px] font-mono font-bold text-emerald-800 text-right focus:ring-1 focus:ring-emerald-500 bg-white">' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.handleToggleSelectionRowCheck = function(idx, checked) {
    if (selectionRowsData[idx]) {
      selectionRowsData[idx].isRowChecked = checked;
    }
    var sum = document.getElementById("selectionReplaceSummary");
    if (sum) {
      var checkedCount = selectionRowsData.filter(function(it) { return it.isRowChecked !== false; }).length;
      sum.querySelector('span').innerHTML = 'Ditemukan <b>' + selectionRowsData.length + '</b> baris (Terpilih: <b>' + checkedCount + '</b>)';
    }
  };

  window.handleToggleAllSelectionRows = function(checked) {
    selectionRowsData.forEach(function(it) { it.isRowChecked = checked; });
    renderSelectionReplaceUI();
  };

  window.handleSelectionKemasanChange = function(idx, val) {
    var item = selectionRowsData[idx];
    if (!item) return;
    var k = parseFloat(val);
    item.newKemasan = isNaN(k) ? 1 : k;
    if (!item.isManualPrice && item.unitPrice > 0) {
      item.newValue = Math.round(item.unitPrice * item.newKemasan);
      renderSelectionReplaceUI();
    }
  };

  window.handleSelectionHargaChange = function(idx, val) {
    var item = selectionRowsData[idx];
    if (!item) return;
    var h = parseFloat(val);
    item.newValue = isNaN(h) ? 0 : h;
    item.isManualPrice = true;
  };

  window.handleExecuteSelectionReplace = function() {
    var itemsToUpdate = selectionRowsData.filter(function(it) { return it.isRowChecked !== false; });
    if (itemsToUpdate.length === 0) {
      showAuditStatus("warning", "Pilih minimal 1 baris untuk di-replace.");
      return;
    }

    var btn = document.getElementById("btnExecuteSelectionReplace");
    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Mengganti Range...';

    var payload = {
      sheetName: null, // Selalu aktifkan di sheet yang sedang aktif saat ini
      highlightColor: "#dcfce7",
      updates: itemsToUpdate
    };

    if (hasGoogleScriptRun()) {
      google.script.run
        .withSuccessHandler(function(res) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ REPLACE RANGE TERSELEKSI (WARNA HIJAU)</span>';
          showAuditStatus("success", "BERHASIL! " + res.totalUpdated + " sel seleksi telah di-replace & diberi warna HIJAU pada sheet aktif!");
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ REPLACE RANGE TERSELEKSI (WARNA HIJAU)</span>';
          showAuditStatus("error", "Gagal replace: " + err.message);
        })
        .replaceAllBahanInActiveSheet(payload);
    } else {
      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ REPLACE RANGE TERSELEKSI (WARNA HIJAU)</span>';
        showAuditStatus("success", "(Demo) Berhasil me-replace " + itemsToUpdate.length + " sel seleksi dengan warna hijau muda di sheet aktif!");
      }, 700);
    }
  };

  // Helper konversi kolom number ke letter di client
  function colNumberToLetter_(colNum) {
    var temp = colNum;
    var letter = "";
    while (temp > 0) {
      var mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - 1) / 26);
    }
    return letter;
  }

})();
</script>
`;

fs.writeFileSync(path.join(rootDir, '03-sidebar-ui', 'ReplaceDataView.html'), viewContent, 'utf8');
console.log('Successfully written 03-sidebar-ui/ReplaceDataView.html!');

