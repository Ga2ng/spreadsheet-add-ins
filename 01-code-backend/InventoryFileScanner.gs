/**
 * ============================================================================
 * FITUR 08: INVENTORY FILE SCANNER & PEMBANDING (InventoryFileScanner.gs)
 * ============================================================================
 * 1. Mendeteksi & menampilkan daftar file / sheet yang depannya 'INVENTORY'
 * 2. Multi-Table Grid Scanner: Mem-parsing tabel yang posisinya pecah-pecah acak
 *    baik secara HORIZONTAL (kolom berdampingan) maupun VERTIKAL (header berulang).
 * 3. Membandingkan baris HPP yang diblok (selected range) dengan dataset Inventory.
 * 4. Mendukung Auto Create Tabel Pembanding (2 Warna) & Replace Harga Kemasan.
 * ============================================================================
 */

/**
 * Mendapatkan daftar sumber dataset INVENTORY yang tersedia.
 * Memindai:
 * - Sheet tabs di spreadsheet aktif yang diawali / memuat kata 'INVENTORY'
 * - Sheet tabs lainnya di spreadsheet aktif
 * - Dataset Slot .gs aktif (DATA_INVENTORY_OUTLET)
 * - File spreadsheet di Google Drive yang diawali / memuat kata 'INVENTORY' (jika diizinkan)
 */
function getAvailableInventorySources() {
  var sources = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet tabs di spreadsheet aktif
  if (ss) {
    var sheets = ss.getSheets();
    var activeSheetName = ss.getActiveSheet() ? ss.getActiveSheet().getName() : "";

    // Prioritaskan sheet yang diawali kata INVENTORY
    for (var s = 0; s < sheets.length; s++) {
      var sName = sheets[s].getName().trim();
      var isInventory = /^inventory/i.test(sName) || /inventory/i.test(sName);
      if (isInventory) {
        sources.push({
          id: "sheet_" + s,
          type: "sheet",
          name: "📑 Sheet: " + sName + (sName === activeSheetName ? " (Sheet Aktif)" : ""),
          sheetName: sName,
          isPriority: true,
          badge: "INVENTORY TAB"
        });
      }
    }

    // Tambahkan sheet lainnya di spreadsheet ini sebagai opsi sekunder
    for (var o = 0; o < sheets.length; o++) {
      var oName = sheets[o].getName().trim();
      var isInv = /^inventory/i.test(oName) || /inventory/i.test(oName);
      if (!isInv) {
        sources.push({
          id: "sheet_" + o,
          type: "sheet",
          name: "📄 Sheet: " + oName + (oName === activeSheetName ? " (Sheet Aktif)" : ""),
          sheetName: oName,
          isPriority: false,
          badge: "SHEET"
        });
      }
    }
  }

  // 2. Dataset Slot .gs aktif (DataInventoryOutlet.gs)
  if (typeof DATA_INVENTORY_OUTLET !== "undefined" && DATA_INVENTORY_OUTLET && DATA_INVENTORY_OUTLET.items) {
    sources.push({
      id: "dataset_outlet_gs",
      type: "dataset_gs",
      name: "⚡ Slot .gs: " + (DATA_INVENTORY_OUTLET.outletName || "OUTLET") + " (" + DATA_INVENTORY_OUTLET.items.length + " Item - " + (DATA_INVENTORY_OUTLET.periode || "") + ")",
      itemCount: DATA_INVENTORY_OUTLET.items.length,
      isPriority: true,
      badge: "SLOT .GS"
    });
  }

  // 3. Cari File Spreadsheet di Google Drive yang depannya 'INVENTORY' (safely via try-catch)
  try {
    if (typeof DriveApp !== "undefined" && DriveApp.searchFiles) {
      var files = DriveApp.searchFiles("title contains 'INVENTORY' and trashed = false");
      var fileCount = 0;
      while (files.hasNext() && fileCount < 10) {
        var file = files.next();
        var fName = file.getName();
        // Pastikan depannya diawali INVENTORY
        if (/^inventory/i.test(fName) || /inventory/i.test(fName)) {
          sources.push({
            id: "drive_" + file.getId(),
            type: "drive_file",
            fileId: file.getId(),
            name: "📁 Drive: " + fName,
            isPriority: true,
            badge: "DRIVE FILE"
          });
          fileCount++;
        }
      }
    }
  } catch (e) {
    // Abaikan jika scope DriveApp belum aktif, sheet tabs tetap berfungsi 100%
  }

  return {
    success: true,
    totalSources: sources.length,
    sources: sources
  };
}

/**
 * Memindai sumber dataset INVENTORY terpilih dan mem-parsing seluruh tabel yang
 * pecah-pecah (horizontal & vertikal) berdasarkan header-nya.
 */
function scanInventorySource(sourceConfig) {
  if (!sourceConfig) {
    throw new Error("Konfigurasi sumber inventori tidak valid.");
  }

  var sourceType = sourceConfig.type || "sheet";
  var sourceName = sourceConfig.name || "INVENTORY";

  // Kasus A: Dataset Slot .gs
  if (sourceType === "dataset_gs") {
    if (typeof DATA_INVENTORY_OUTLET === "undefined" || !DATA_INVENTORY_OUTLET || !DATA_INVENTORY_OUTLET.items) {
      throw new Error("Dataset DataInventoryOutlet.gs kosong atau belum dimuat.");
    }
    return {
      success: true,
      sourceName: "DataInventoryOutlet.gs (" + DATA_INVENTORY_OUTLET.outletName + ")",
      totalItems: DATA_INVENTORY_OUTLET.items.length,
      totalCategories: 1,
      categories: [{ name: DATA_INVENTORY_OUTLET.outletName || "OUTLET", count: DATA_INVENTORY_OUTLET.items.length }],
      items: DATA_INVENTORY_OUTLET.items
    };
  }

  // Kasus B: Sheet Tab di Spreadsheet Aktif
  var grid = [];
  var displayGrid = [];

  if (sourceType === "sheet") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Tidak ada spreadsheet yang sedang aktif.");

    var sheet = sourceConfig.sheetName ? ss.getSheetByName(sourceConfig.sheetName) : ss.getActiveSheet();
    if (!sheet) {
      throw new Error("Sheet '" + sourceConfig.sheetName + "' tidak ditemukan.");
    }
    sourceName = sheet.getName();

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 2) {
      throw new Error("Sheet '" + sourceName + "' tidak memiliki data yang cukup untuk discan.");
    }

    var range = sheet.getRange(1, 1, lastRow, lastCol);
    grid = range.getValues();
    displayGrid = range.getDisplayValues();
  }
  // Kasus C: File Google Drive (Spreadsheet lain)
  else if (sourceType === "drive_file" && sourceConfig.fileId) {
    var extSs = SpreadsheetApp.openById(sourceConfig.fileId);
    if (!extSs) throw new Error("Gagal membuka file spreadsheet dari Google Drive.");

    var extSheet = extSs.getActiveSheet();
    sourceName = extSs.getName() + " (" + extSheet.getName() + ")";

    var extLastRow = extSheet.getLastRow();
    var extLastCol = extSheet.getLastColumn();
    if (extLastRow < 2 || extLastCol < 2) {
      throw new Error("File '" + sourceName + "' tidak memiliki data yang cukup.");
    }

    var extRange = extSheet.getRange(1, 1, extLastRow, extLastCol);
    grid = extRange.getValues();
    displayGrid = extRange.getDisplayValues();
  } else {
    throw new Error("Tipe sumber inventori tidak dikenali: " + sourceType);
  }

  // Eksekusi Multi-Table Grid Parser (Horizontal & Vertikal)
  var parsed = parseMultiTableInventoryGrid_(grid, displayGrid, sourceName);

  return {
    success: true,
    sourceName: sourceName,
    totalItems: parsed.items.length,
    totalClusters: parsed.totalClusters,
    totalCategories: parsed.categoryList.length,
    categories: parsed.categoryList,
    items: parsed.items
  };
}

/**
 * ============================================================================
 * MULTI-TABLE INVENTORY GRID PARSER
 * ============================================================================
 * Mendeteksi setiap tabel yang terpecah secara horizontal (kolom berdampingan)
 * maupun vertikal (bertingkat ke bawah) hanya dengan mengikuti posisi header-nya.
 */
function parseMultiTableInventoryGrid_(grid, displayGrid, defaultCategory) {
  var numRows = grid.length;
  var numCols = grid[0] ? grid[0].length : 0;
  var items = [];
  var categoriesMap = {};
  var idCounter = 1;

  // 1. Pindai seluruh koordinat (r, c) untuk menemukan posisi Header Tabel
  var headerClusters = [];
  for (var r = 0; r < numRows; r++) {
    for (var c = 0; c < numCols; c++) {
      var val = String(grid[r][c] || "").trim().toLowerCase();

      // Cek apakah sel ini merupakan header nama barang / bahan
      if (/^(nama\s*barang|nama\s*item|nama\s*bahan|item|bahan|barang|product|produk|material)$/i.test(val)) {
        var colQty = -1;
        var colUnit = -1;
        var colPrice = -1;

        // Periksa kolom di kanannya (c+1 sampai c+6) di baris yang sama
        for (var offset = 1; offset <= 6 && (c + offset) < numCols; offset++) {
          var colIdx = c + offset;
          var hVal = String(grid[r][colIdx] || "").trim().toLowerCase();
          if (/^(qty|kuantitas|jumlah)$/i.test(hVal) && colQty === -1) colQty = colIdx;
          if (/^(unit|satuan|uom)$/i.test(hVal) && colUnit === -1) colUnit = colIdx;
          if (/^(price|harga|harga\s*beli|harga\s*kemasan|pl\s*update|pl\s*central|subtotal)$/i.test(hVal) && colPrice === -1) {
            colPrice = colIdx;
          }
        }

        // Jika terdeteksi kolom pendukung (price, unit, atau qty), simpan sebagai satu cluster tabel
        if (colPrice !== -1 || colUnit !== -1 || colQty !== -1) {
          // Cari nama kategori di atas baris header (1 s/d 3 baris di atasnya)
          var category = "";
          for (var checkRow = r - 1; checkRow >= Math.max(0, r - 3); checkRow--) {
            var catVal = String(grid[checkRow][c] || grid[checkRow][Math.max(0, c - 1)] || "").trim();
            if (catVal && !/^\d+$/.test(catVal) && !/^(no|nomor|id|kode)$/i.test(catVal)) {
              category = catVal.replace(/^(KATEGORI|CATEGORY|GROUP|TABEL|INVENTORI|INVENTORY)\s*[:\-]?\s*/i, "").trim();
              break;
            }
          }
          if (!category) {
            var colLetter = colNumberToLetter_(c + 1);
            category = "KATEGORI " + colLetter;
          }

          headerClusters.push({
            startRow: r,
            colItem: c,
            colQty: colQty,
            colUnit: colUnit,
            colPrice: colPrice,
            category: category.toUpperCase()
          });
        }
      }
    }
  }

  // 2. Jika tidak ada cluster header yang terdeteksi via regex standar,
  // gunakan fallback deteksi kolom item & harga di seluruh lembar
  if (headerClusters.length === 0) {
    var fallbackItem = -1, fallbackPrice = -1, fallbackUnit = -1, fallbackQty = -1;
    for (var rHead = 0; rHead < Math.min(10, numRows); rHead++) {
      for (var cHead = 0; cHead < numCols; cHead++) {
        var hStr = String(grid[rHead][cHead] || "").trim().toLowerCase();
        if (/item|bahan|barang|nama/i.test(hStr) && fallbackItem === -1) fallbackItem = cHead;
        if (/harga|price/i.test(hStr) && fallbackPrice === -1) fallbackPrice = cHead;
        if (/satuan|unit/i.test(hStr) && fallbackUnit === -1) fallbackUnit = cHead;
        if (/qty|jumlah/i.test(hStr) && fallbackQty === -1) fallbackQty = cHead;
      }
      if (fallbackItem !== -1 && (fallbackPrice !== -1 || fallbackUnit !== -1)) {
        headerClusters.push({
          startRow: rHead,
          colItem: fallbackItem,
          colQty: fallbackQty,
          colUnit: fallbackUnit,
          colPrice: fallbackPrice >= 0 ? fallbackPrice : (fallbackItem + 3 < numCols ? fallbackItem + 3 : -1),
          category: (defaultCategory || "INVENTORY UMUM").toUpperCase()
        });
        break;
      }
    }
  }

  // 3. Baca data ke bawah untuk setiap cluster tabel yang ditemukan
  headerClusters.forEach(function (cluster) {
    var emptyCount = 0;
    for (var rowIdx = cluster.startRow + 1; rowIdx < numRows; rowIdx++) {
      var rawName = String(grid[rowIdx][cluster.colItem] || "").trim();
      if (!rawName) {
        emptyCount++;
        // Berhenti jika 4 baris kosong berturut-turut pada cluster ini
        if (emptyCount >= 4) break;
        continue;
      }
      emptyCount = 0;

      // Hentikan pembacaan jika bertemu header tabel baru atau subtotal/total
      if (/^(total|subtotal|grand\s*total)$/i.test(rawName)) {
        break;
      }
      if (/^(nama\s*barang|nama\s*item|nama\s*bahan|item|bahan)$/i.test(rawName)) {
        break;
      }

      var rawUnit = cluster.colUnit >= 0 ? String(grid[rowIdx][cluster.colUnit] || "").trim().toUpperCase() : "PORSI";
      if (!rawUnit || rawUnit === "-") rawUnit = "PORSI";

      var rawPrice = cluster.colPrice >= 0 ? grid[rowIdx][cluster.colPrice] : 0;
      var dispPrice = (displayGrid && cluster.colPrice >= 0 && displayGrid[rowIdx]) ? displayGrid[rowIdx][cluster.colPrice] : "";
      var priceNum = parseCleanPrice_(rawPrice) || parseCleanPrice_(dispPrice) || 0;

      var rawQty = cluster.colQty >= 0 ? grid[rowIdx][cluster.colQty] : null;
      var qtyNum = (typeof rawQty === "number") ? rawQty : parseFloat(String(rawQty || "").replace(/[^\d.-]/g, ""));
      if (isNaN(qtyNum)) qtyNum = null;

      var cellAddr = colNumberToLetter_(cluster.colItem + 1) + (rowIdx + 1);

      items.push({
        id: "inv-" + (idCounter++),
        name: rawName,
        unit: rawUnit,
        price: priceNum,
        qty: qtyNum,
        category: cluster.category,
        cellAddress: cellAddr
      });

      if (!categoriesMap[cluster.category]) categoriesMap[cluster.category] = 0;
      categoriesMap[cluster.category]++;
    }
  });

  var categoryList = [];
  for (var cat in categoriesMap) {
    categoryList.push({ name: cat, count: categoriesMap[cat] });
  }

  return {
    totalClusters: headerClusters.length,
    items: items,
    categoryList: categoryList
  };
}

/**
 * ============================================================================
 * PERBANDINGAN HPP BLOK (SELECTED RANGE) VS INVENTORY DATASET
 * ============================================================================
 * Membandingkan range sel resep HPP yang di-select pengguna dengan dataset
 * hasil scan inventory. Menghasilkan struktur perbandingan, payload Auto Create,
 * dan payload Replace All.
 */
function compareBlockedHppWithInventory(payload) {
  if (!payload || !payload.blockedRange) {
    throw new Error("Data blok sel resep tidak ditemukan. Silakan blok baris resep di sheet.");
  }
  var blocked = payload.blockedRange;
  var inventoryItems = payload.inventoryItems || [];
  var sourceName = payload.inventorySourceName || "INVENTORY";

  if (!inventoryItems || inventoryItems.length === 0) {
    throw new Error("Dataset inventory kosong. Silakan pilih & scan sumber file inventory terlebih dahulu.");
  }

  var rawValues = blocked.values || [];
  var displayValues = blocked.displayValues || rawValues;
  var startRow = Number(blocked.startRow) || 1;
  var startCol = Number(blocked.startCol) || 1;
  var rowCount = Number(blocked.rowCount) || rawValues.length;

  // Deteksi kolom HPP di blok sel:
  // Format standar HPP 8 kolom:
  // [0] Bahan / Prep, [1] Gramasi, [2] Satuan, [3] Kemasan, [4] Harga Kemasan, [5] Harga/gr, [6] Total Harga, [7] Process
  var colBahanIdx = 0;
  var colGramasiIdx = 1;
  var colSatuanIdx = 2;
  var colKemasanIdx = 3;
  var colHargaKemasanIdx = 4;

  // Jika kolom pertama adalah Prep/Menu dan kolom kedua adalah Bahan
  if (rawValues.length > 0 && rawValues[0].length >= 8) {
    var c0 = String(displayValues[0][0] || "").toLowerCase();
    var c1 = String(displayValues[0][1] || "").toLowerCase();
    if (/prep|menu|resep/i.test(c0) || /bahan/i.test(c1)) {
      colBahanIdx = 1;
      colGramasiIdx = 2;
      colSatuanIdx = 3;
      colKemasanIdx = 4;
      colHargaKemasanIdx = 5;
    }
  }

  var comparisonItems = [];
  var matchedCount = 0;
  var naikCount = 0;
  var turunCount = 0;
  var notMatchedCount = 0;

  var currentRecipe = "Resep Umum";

  for (var r = 0; r < rawValues.length; r++) {
    var row = rawValues[r];
    var dispRow = displayValues[r] || row;
    var sheetRowNumber = startRow + r;

    var rawBahan = row[colBahanIdx];
    var dispBahan = String(dispRow[colBahanIdx] || "").trim();

    // Lewati baris header jika ada
    if (/^(bahan|nama\s*bahan|preparetion|menu|resep)$/i.test(dispBahan)) {
      continue;
    }

    if (!dispBahan || /^(total|subtotal|grand\s*total|hpp|selling)$/i.test(dispBahan)) {
      continue;
    }

    // Deteksi menu preparation jika ada
    if (colBahanIdx > 0 && row[0]) {
      var pVal = String(row[0]).trim();
      if (pVal && isNaN(Number(pVal))) {
        currentRecipe = pVal;
      }
    }

    var gramasi = parseCleanPrice_(row[colGramasiIdx]) || parseCleanPrice_(dispRow[colGramasiIdx]) || 1;
    var satuan = colSatuanIdx < row.length ? String(dispRow[colSatuanIdx] || "").trim() : "gr";
    var kemasan = parseCleanPrice_(row[colKemasanIdx]) || parseCleanPrice_(dispRow[colKemasanIdx]) || 1;
    var hargaKemasan = parseCleanPrice_(row[colHargaKemasanIdx]) || parseCleanPrice_(dispRow[colHargaKemasanIdx]) || 0;

    // Pencocokan cerdas dengan dataset inventory
    var matched = matchRecipeIngredientToInventory_(dispBahan, inventoryItems);

    var itemResult = {
      sheetRow: sheetRowNumber,
      sheetColHargaKemasan: startCol + colHargaKemasanIdx,
      cellAddress: colNumberToLetter_(startCol + colHargaKemasanIdx) + sheetRowNumber,
      recipe: currentRecipe,
      bahan: dispBahan,
      gramasi: gramasi,
      satuan: satuan,
      kemasan: kemasan,
      hargaHppKemasan: hargaKemasan,
      matchedItem: null,
      inventoryPrice: 0,
      inventoryUnit: "-",
      inventoryCategory: "-",
      diff: 0,
      status: "TIDAK DITEMUKAN", // "SESUAI" | "NAIK" | "TIDAK DITEMUKAN"
      statusColor: "text-slate-500",
      note: "Item tidak ditemukan di inventory"
    };

    if (matched) {
      matchedCount++;
      var invPriceRaw = Number(matched.price) || 0;
      var invPriceScaled = invPriceRaw;

      // Konversi jika unit inventory adalah gram/ml dan kemasan resep > 1
      var u = String(matched.unit || "").toUpperCase();
      if ((u === "GRAM" || u === "GR" || u === "ML") && kemasan > 1 && invPriceRaw < hargaKemasan / 10) {
        invPriceScaled = Math.round(invPriceRaw * kemasan);
      }

      var diff = invPriceScaled - hargaKemasan;
      var isNaik = diff > 0;
      var isSesuai = diff <= 0;

      if (isNaik) {
        naikCount++;
        itemResult.status = "NAIK";
        itemResult.statusColor = "text-red-700 bg-red-100";
        itemResult.note = "NAIK Rp " + formatNumber_(diff);
      } else {
        turunCount++;
        itemResult.status = "SESUAI";
        itemResult.statusColor = "text-emerald-800 bg-emerald-100";
        itemResult.note = (diff === 0) ? "SESUAI" : ("TURUN Rp " + formatNumber_(-diff));
      }

      itemResult.matchedItem = matched;
      itemResult.inventoryPrice = invPriceScaled;
      itemResult.inventoryUnit = matched.unit || "-";
      itemResult.inventoryCategory = matched.category || "-";
      itemResult.diff = diff;
    } else {
      notMatchedCount++;
      itemResult.statusColor = "text-amber-800 bg-amber-50";
    }

    comparisonItems.push(itemResult);
  }

  // Bangun Payload untuk fungsi Auto Create Tabel di Sheet (writeComparisonTableToSheet)
  var tableHeaders = [
    sourceName.toUpperCase().slice(0, 25),
    "NOTE"
  ];

  var tableRows = comparisonItems.map(function (ci) {
    var invVal = ci.inventoryPrice > 0 ? ci.inventoryPrice : "-";
    var noteVal = ci.matchedItem ? ci.note : "TIDAK DITEMUKAN";
    var st = ci.status === "NAIK" ? "NAIK" : (ci.status === "SESUAI" ? "SESUAI" : "EMPTY");

    return {
      isEmptyRow: false,
      values: [invVal, noteVal],
      cellStatuses: [st, st],
      noteColorStatus: st
    };
  });

  var tablePayload = {
    headers: tableHeaders,
    rows: tableRows,
    headerMode: "auto",
    sourceMeta: {
      sheetName: blocked.sheetName,
      startRow: startRow,
      startCol: startCol,
      rowCount: rowCount,
      columnCount: blocked.columnCount
    }
  };

  // Bangun Payload untuk Replace All ke Sheet (applyReplaceHargaKemasanToSheet)
  var replaceItems = comparisonItems
    .filter(function (ci) { return ci.matchedItem && ci.inventoryPrice > 0; })
    .map(function (ci) {
      return {
        sheetRow: ci.sheetRow,
        sheetCol: ci.sheetColHargaKemasan,
        cellAddress: ci.cellAddress,
        newValue: ci.inventoryPrice,
        oldValue: ci.hargaHppKemasan,
        bahan: ci.bahan
      };
    });

  var replacePayload = {
    sheetName: blocked.sheetName,
    highlightGreen: true,
    highlightColor: "#dcfce7",
    items: replaceItems
  };

  return {
    success: true,
    sheetName: blocked.sheetName,
    sourceName: sourceName,
    totalBahan: comparisonItems.length,
    matchedCount: matchedCount,
    naikCount: naikCount,
    turunCount: turunCount,
    notMatchedCount: notMatchedCount,
    comparisonItems: comparisonItems,
    tablePayload: tablePayload,
    replacePayload: replacePayload
  };
}

/**
 * Helper pencocokan cerdas bahan resep ke item inventory
 */
function matchRecipeIngredientToInventory_(bahanName, inventoryItems) {
  var raw = String(bahanName || "").trim().toLowerCase();
  if (!raw || raw === "air" || raw.replace(/[^a-z]/g, "") === "air") return null;

  var normRaw = raw.replace(/[^a-z0-9]/g, "");

  // 1. Exact match
  for (var i = 0; i < inventoryItems.length; i++) {
    var it = inventoryItems[i];
    var itNorm = String(it.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (itNorm === normRaw) return it;
  }

  // 2. Token overlap & keyword matching
  var rawWords = raw
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ml|gr|gram|kg|l|liter|pcs|pack|porsi)?\b/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(function (w) { return w.length >= 2; });

  if (rawWords.length === 0) return null;

  var bestItem = null;
  var maxScore = -1;

  for (var j = 0; j < inventoryItems.length; j++) {
    var item = inventoryItems[j];
    var itName = String(item.name || "").toLowerCase();
    var itWords = itName
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:ml|gr|gram|kg|l|liter|pcs|pack|porsi)?\b/gi, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(function (w) { return w.length >= 2; });

    var matchCount = 0;
    var score = 0;

    for (var rw = 0; rw < rawWords.length; rw++) {
      var word = rawWords[rw];
      for (var iw = 0; iw < itWords.length; iw++) {
        var itWord = itWords[iw];
        if (word === itWord) {
          matchCount++;
          score += 15;
          break;
        } else if (word.length >= 4 && itWord.length >= 4 && (word.indexOf(itWord) === 0 || itWord.indexOf(word) === 0)) {
          matchCount++;
          score += 10;
          break;
        }
      }
    }

    if (matchCount === 0) continue;
    if (matchCount === rawWords.length) score += 20;

    var extraWords = Math.max(0, itWords.length - rawWords.length);
    score -= extraWords * 1.5;

    if (matchCount >= 1 && score > maxScore) {
      maxScore = score;
      bestItem = item;
    }
  }

  return maxScore >= 8 ? bestItem : null;
}

function formatNumber_(n) {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

