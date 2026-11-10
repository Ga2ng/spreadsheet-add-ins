/**
 * ============================================================================
 * FOLDER 01 — BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * ============================================================================
 * Aturan Warna (2 Warna Saja — Lihat RULES.md):
 * - Hijau (#dcfce7 / #166534) : Harga Inventory SESUAI / TURUN (<= HPP)
 * - Merah (#fee2e2 / #991b1b) : Harga Inventory NAIK (> HPP)
 * - Evaluasi HPP & warna Merah/Hijau difokuskan pada 2 KOLOM TERAKHIR & KOLOM NOTE
 * - Kolom periode terdahulu tampil bersih dengan latar putih (#ffffff)
 * ============================================================================
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Audit Data Tools")
    .addItem("Buka Sidebar Audit Tools", "showSidebar")
    .addToUi();
}

function showSidebar() {
  var template = HtmlService.createTemplateFromFile("Sidebar");
  var html = template.evaluate()
    .setTitle("Audit Data Tools")
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Helper untuk include template HTML terpisah di Google Apps Script
 * (Sidebar.html, PembandingView.html, ParserView.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Membaca blok / range yang sedang di-select pengguna di Google Sheets.
 */
function readSelectedRangeFromSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var range = sheet.getActiveRange();

  if (!range) {
    throw new Error("Tidak ada range yang dipilih. Silakan blok baris bahan terlebih dahulu.");
  }

  var rawValues = range.getValues();
  var displayValues = range.getDisplayValues();

  var normalizedValues = [];
  for (var r = 0; r < rawValues.length; r++) {
    var rowArr = [];
    for (var c = 0; c < rawValues[r].length; c++) {
      var val = rawValues[r][c];
      if (val === "" || val === null || val === undefined) {
        rowArr.push(null);
      } else if (Object.prototype.toString.call(val) === "[object Date]") {
        rowArr.push(displayValues[r][c] || val.toISOString());
      } else {
        rowArr.push(val);
      }
    }
    normalizedValues.push(rowArr);
  }

  return {
    sheetName: sheet.getName(),
    address: range.getA1Notation(),
    startRow: range.getRow(),
    startCol: range.getColumn(),
    rowCount: range.getNumRows(),
    columnCount: range.getNumColumns(),
    values: normalizedValues,
    displayValues: displayValues
  };
}

/**
 * Mengambil seluruh daftar Data Pembanding JSON.
 * CORE DATA ENGINE:
 * 1. PRIORITAS UTAMA: Jika spreadsheet ini memiliki sheet CENTRAL KITCHEN / CENTRAL STORAGE,
 *    langsung scan sheet live tersebut secara otomatis agar selalu 100% up-to-date
 *    dan langsung digunakan di Menu 02 (Pembanding HPP) & Menu 03 (Replace HPP)
 *    tanpa perlu convert manual lagi!
 * 2. PRIORITAS KEDUA: Data yang disimpan di cache session / custom presets.
 * 3. FALLBACK: Data bawaan DataPembanding.gs (jika dibuka di sheet yang tidak ada tab Central-nya).
 */
function getAvailableReferenceJsonPresets() {
  // 1. Prioritas Utama: Cek sheet Central Kitchen & Central Storage di Spreadsheet ini
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      var sheets = ss.getSheets();
      var hasKitchen = false;
      var hasStorage = false;
      for (var s = 0; s < sheets.length; s++) {
        var sName = sheets[s].getName().trim();
        if (/central.*kitchen/i.test(sName)) hasKitchen = true;
        if (/central.*storage/i.test(sName)) hasStorage = true;
      }

      if (hasKitchen || hasStorage) {
        var scanRes = scanCentralSheetsDirectly();
        if (scanRes && scanRes.datasets && scanRes.datasets.length > 0) {
          return scanRes.datasets.map(function (ds) {
            var isKitchen = ds.kategori.indexOf("KITCHEN") !== -1;
            return {
              id: isKitchen ? "inv-central-kitchen" : "inv-central-storage",
              name: ds.sheetName + " (Live Sheet)",
              period: ds.sheetName + " (" + ds.itemCount + " Item Live)",
              defaultSelected: true,
              isLiveScanned: true,
              data: ds.items
            };
          });
        }
      }
    }
  } catch (err) {
    // Jika scanning live gagal, lanjut ke fallback
  }

  // 2. Cek apakah ada preset kustom yang disimpan
  var customList = [];
  try {
    var rawDoc = PropertiesService.getDocumentProperties().getProperty("CUSTOM_REF_JSON_PRESETS");
    var rawUser = PropertiesService.getUserProperties().getProperty("CUSTOM_REF_JSON_PRESETS");
    var rawCustom = rawDoc || rawUser;
    if (rawCustom) {
      var parsed = JSON.parse(rawCustom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customList = parsed;
      }
    }
  } catch (e) {}

  if (customList.length > 0) {
    return customList;
  }

  // 3. Fallback ke data bawaan DataPembanding.gs
  var builtIn = [];
  if (typeof getBuiltInReferenceDatasets === "function") {
    builtIn = getBuiltInReferenceDatasets() || [];
  }

  return builtIn;
}

/**
 * Menyimpan dataset JSON Pembanding tambahan ke PropertiesService
 */
function saveCustomReferenceJsonPreset(newPreset) {
  if (!newPreset || !newPreset.name || !Array.isArray(newPreset.data)) {
    throw new Error("Data JSON tidak valid.");
  }

  var customList = [];
  try {
    var rawCustom = PropertiesService.getUserProperties().getProperty("CUSTOM_REF_JSON_PRESETS");
    if (rawCustom) {
      var parsed = JSON.parse(rawCustom);
      if (Array.isArray(parsed)) {
        customList = parsed;
      }
    }
  } catch (e) {}

  customList.push({
    id: newPreset.id || ("custom-json-" + new Date().getTime()),
    name: newPreset.name,
    period: newPreset.period || "Custom Inventory JSON",
    defaultSelected: true,
    description: newPreset.description || "Ditambahkan dari Sidebar",
    data: newPreset.data
  });

  PropertiesService.getUserProperties().setProperty("CUSTOM_REF_JSON_PRESETS", JSON.stringify(customList));
  return getAvailableReferenceJsonPresets();
}

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

/**
 * Mengecek apakah di kolom target (dari baris 1 s/d targetRow) sudah pernah dibuat
 * Header Bulan ("PL UPDATE ..." / "PL CENTRAL ...").
 */
function hasExistingPeriodHeaderAbove_(sheet, targetCol, upToRow) {
  var checkRows = Math.max(1, Math.min(upToRow, sheet.getLastRow()));
  if (checkRows < 1) return false;
  var vals = sheet.getRange(1, targetCol, checkRows, 1).getDisplayValues();
  for (var r = 0; r < vals.length; r++) {
    var cellStr = String(vals[r][0] || "").toUpperCase().trim();
    if (
      cellStr.indexOf("PL UPDATE") !== -1 ||
      cellStr.indexOf("PL CENTRAL") !== -1 ||
      cellStr === "NOTE"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * ============================================================================
 * AUTO CREATE TABEL: 2 WARNA (HIJAU & MERAH) DI 2 KOLOM TERAKHIR & KOLOM NOTE
 * ============================================================================
 * Aturan Warna & Note (Sesuai RULES.md):
 * 1. Dua Warna Saja (Biru dihapus):
 *    - MERAH (#fee2e2 / #991b1b) : NAIK (Harga > HPP)
 *    - HIJAU (#dcfce7 / #166534) : SESUAI / TURUN (Harga <= HPP)
 * 2. Fokus Pewarnaan di 2 Kolom Terakhir:
 *    - Kolom periode terdahulu tampil bersih latar putih (#ffffff) dengan teks #1e293b
 *    - 2 Kolom periode terakhir diberi highlight Hijau atau Merah
 * 3. Kolom NOTE di paling kanan hanya membandingkan 2 kolom terakhir vs HPP
 * 4. Baris data disetel setWrap(false) agar tidak merusak tinggi baris tabel resep
 */
function writeComparisonTableToSheet(payload) {
  var headers = payload.headers || [];
  var rows = payload.rows || [];
  var headerMode = payload.headerMode || "auto"; // "auto" | "always" | "never"
  var sourceMeta = payload.sourceMeta || null;

  if (headers.length === 0 || rows.length === 0) {
    throw new Error("Tidak ada data perbandingan untuk di-create ke Sheet.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var activeRange = sheet.getActiveRange();
  var activeCell = sheet.getActiveCell();

  var targetRow = activeCell ? activeCell.getRow() : 1;
  var targetCol = activeCell ? activeCell.getColumn() : 1;

  // Pengaman: Jika user masih mem-blok 8 kolom HPP, otomatis geser ke kolom kanan tabel HPP
  if (
    sourceMeta &&
    activeRange &&
    sheet.getName() === sourceMeta.sheetName &&
    activeRange.getRow() === Number(sourceMeta.startRow) &&
    activeRange.getColumn() === Number(sourceMeta.startCol) &&
    activeRange.getNumColumns() >= 4
  ) {
    targetRow = Number(sourceMeta.startRow);
    targetCol = Number(sourceMeta.startCol) + Number(sourceMeta.columnCount);
  }

  var totalCols = headers.length;
  var shouldWriteHeader = false;

  if (headerMode === "always") {
    shouldWriteHeader = true;
  } else if (headerMode === "never") {
    shouldWriteHeader = false;
  } else {
    var alreadyHasHeader = hasExistingPeriodHeaderAbove_(sheet, targetCol, targetRow);
    shouldWriteHeader = !alreadyHasHeader;
  }

  var writeStartRow = targetRow;
  if (shouldWriteHeader) {
    if (sourceMeta && targetRow === Number(sourceMeta.startRow) && targetRow > 1) {
      var cellAboveVal = String(sheet.getRange(targetRow - 1, targetCol).getDisplayValue() || "").trim();
      if (cellAboveVal === "") {
        writeStartRow = targetRow - 1;
      }
    }
  }

  var matrix = [];
  var backgrounds = [];
  var fontColors = [];
  var fontWeights = [];
  var hAlignments = [];
  var numberFormats = [];

  // 1. Baris Header Bulan + Kolom NOTE
  if (shouldWriteHeader) {
    var headerRowVals = [];
    var headerBgs = [];
    var headerFgs = [];
    var headerWeights = [];
    var headerAligns = [];
    var headerNumFmts = [];

    for (var h = 0; h < totalCols; h++) {
      var hText = String(headers[h] || "");
      headerRowVals.push(hText);
      headerFgs.push("#ffffff");
      headerWeights.push("bold");
      headerNumFmts.push("@");

      if (h === totalCols - 1) {
        headerBgs.push("#0f172a"); // Hitam Slate untuk kolom NOTE
        headerAligns.push("left");
      } else if (hText.toUpperCase().indexOf("PL CENTRAL") !== -1) {
        headerBgs.push("#1e3a8a"); // Biru Navy untuk PL CENTRAL
        headerAligns.push("center");
      } else {
        headerBgs.push("#047857"); // Hijau Tua untuk PL UPDATE
        headerAligns.push("center");
      }
    }

    matrix.push(headerRowVals);
    backgrounds.push(headerBgs);
    fontColors.push(headerFgs);
    fontWeights.push(headerWeights);
    hAlignments.push(headerAligns);
    numberFormats.push(headerNumFmts);
  }

  // 2. Baris Data Nilai Per Kolom + Kolom Terakhir NOTE (2 Warna di 2 Kolom Terakhir)
  var numPeriodCols = totalCols - 1;

  for (var r = 0; r < rows.length; r++) {
    var itemRow = rows[r];
    var rowVals = [];
    var rowBgs = [];
    var rowFgs = [];
    var rowWeights = [];
    var rowAligns = [];
    var rowNumFmts = [];

    var rawCells = itemRow.values || [];
    var cellStatuses = itemRow.cellStatuses || [];
    var noteColorStatus = itemRow.noteColorStatus || "EMPTY"; // "SESUAI" | "NAIK" | "EMPTY"

    for (var c = 0; c < totalCols; c++) {
      var isNoteCol = c === totalCols - 1;
      var val = rawCells[c];

      if (isNoteCol) {
        var noteStr = val !== null && val !== undefined ? String(val) : "";
        rowVals.push(noteStr);
        rowAligns.push("left");
        rowNumFmts.push("@");

        if (itemRow.isEmptyRow || noteColorStatus === "EMPTY") {
          rowBgs.push("#f8fafc");
          rowFgs.push("#64748b");
          rowWeights.push("normal");
        } else if (noteColorStatus === "NAIK") {
          rowBgs.push("#fee2e2"); // Merah Muda (Ada yang naik di 2 kolom terakhir)
          rowFgs.push("#991b1b");
          rowWeights.push("bold");
        } else if (noteColorStatus === "SESUAI") {
          rowBgs.push("#dcfce7"); // Hijau Muda (Semua <= HPP di 2 kolom terakhir)
          rowFgs.push("#166534");
          rowWeights.push("bold");
        } else {
          rowBgs.push("#f8fafc");
          rowFgs.push("#64748b");
          rowWeights.push("normal");
        }
      } else {
        var st = cellStatuses[c] || "EMPTY";
        // Hanya 2 kolom periode terakhir yang diwarnai Merah / Hijau
        var isOneOfLastTwoPeriodCols = (c >= numPeriodCols - 2 && c < numPeriodCols);

        if (typeof val === "number" && !isNaN(val) && val > 0) {
          rowVals.push(val);
          rowAligns.push("right");
          rowNumFmts.push("#,##0.##");

          if (isOneOfLastTwoPeriodCols) {
            // 2 WARNA SAJA DI 2 KOLOM TERAKHIR:
            if (st === "NAIK") {
              rowBgs.push("#fee2e2"); // Merah Muda (> HPP)
              rowFgs.push("#991b1b"); // Merah Tua
              rowWeights.push("bold");
            } else {
              // SESUAI atau TURUN (<= HPP) -> Hijau Muda
              rowBgs.push("#dcfce7"); // Hijau Muda (<= HPP)
              rowFgs.push("#166534"); // Hijau Tua
              rowWeights.push("bold");
            }
          } else {
            // Kolom periode terdahulu: Tampil bersih latar putih normal
            rowBgs.push("#ffffff");
            rowFgs.push("#1e293b");
            rowWeights.push("normal");
          }
        } else {
          rowVals.push(itemRow.isEmptyRow ? "" : "-");
          rowAligns.push("center");
          rowNumFmts.push("@");
          rowBgs.push("#ffffff");
          rowFgs.push("#94a3b8");
          rowWeights.push("normal");
        }
      }
    }

    matrix.push(rowVals);
    backgrounds.push(rowBgs);
    fontColors.push(rowFgs);
    fontWeights.push(rowWeights);
    hAlignments.push(rowAligns);
    numberFormats.push(rowNumFmts);
  }

  var totalRowsWritten = matrix.length;
  var outRange = sheet.getRange(writeStartRow, targetCol, totalRowsWritten, totalCols);

  outRange.setValues(matrix);
  outRange.setNumberFormats(numberFormats);
  outRange.setBackgrounds(backgrounds);
  outRange.setFontColors(fontColors);
  outRange.setFontWeights(fontWeights);
  outRange.setHorizontalAlignments(hAlignments);
  outRange.setVerticalAlignment("middle");

  // Matikan text-wrap pada baris data agar tinggi baris tabel resep tidak melar
  outRange.setWrap(false);
  if (shouldWriteHeader) {
    sheet.getRange(writeStartRow, targetCol, 1, totalCols).setWrap(true);
  }

  outRange.setBorder(
    true,
    true,
    true,
    true,
    true,
    true,
    "#cbd5e1",
    SpreadsheetApp.BorderStyle.SOLID
  );

  // Lebar kolom proporsional
  if (shouldWriteHeader) {
    for (var colOffset = 0; colOffset < totalCols - 1; colOffset++) {
      var colIdx = targetCol + colOffset;
      if (sheet.getColumnWidth(colIdx) < 115) {
        sheet.setColumnWidth(colIdx, 120);
      }
    }
    var noteColIdx = targetCol + totalCols - 1;
    if (sheet.getColumnWidth(noteColIdx) < 220) {
      sheet.setColumnWidth(noteColIdx, 230);
    }
  }

  outRange.activate();

  var startColLetter = colNumberToLetter_(targetCol);
  var endColLetter = colNumberToLetter_(targetCol + totalCols - 1);
  var writtenAddress =
    startColLetter +
    writeStartRow +
    ":" +
    endColLetter +
    (writeStartRow + totalRowsWritten - 1);

  return {
    sheetName: sheet.getName(),
    rangeAddress: writtenAddress,
    headerCreated: shouldWriteHeader,
    headerRow: shouldWriteHeader ? writeStartRow : null,
    dataStartRow: shouldWriteHeader ? writeStartRow + 1 : writeStartRow,
    rowCount: rows.length,
    colCount: totalCols
  };
}

/**
 * Menerapkan penggantian nilai pada kolom HARGA / KEMASAN di Sheet HPP Resep.
 * payload: {
 *   sheetName: string,
 *   items: [
 *     { sheetRow: number, sheetCol: number, cellAddress: string, newValue: number, oldValue: number, bahan: string }
 *   ]
 * }
 */
function applyReplaceHargaKemasanToSheet(payload) {
  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Tidak ada item harga yang dipilih untuk di-replace.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = payload.sheetName ? ss.getSheetByName(payload.sheetName) : ss.getActiveSheet();
  if (!sheet) {
    sheet = ss.getActiveSheet();
  }

  var updatedList = [];
  for (var i = 0; i < payload.items.length; i++) {
    var item = payload.items[i];
    var row = Number(item.sheetRow);
    var col = Number(item.sheetCol);
    var val = Number(item.newValue);

    if (row > 0 && col > 0 && !isNaN(val)) {
      var cell = sheet.getRange(row, col);
      cell.setValue(val);
      updatedList.push({
        row: row,
        col: col,
        cellAddress: item.cellAddress || (colNumberToLetter_(col) + row),
        bahan: item.bahan || "",
        oldValue: item.oldValue,
        newValue: val
      });
    }
  }

  return {
    success: true,
    sheetName: sheet.getName(),
    totalUpdated: updatedList.length,
    updatedList: updatedList
  };
}

/**
 * ============================================================================
 * FITUR 04: SCANNER SHEET CENTRAL STORAGE & CENTRAL KITCHEN
 * ============================================================================
 * Membaca langsung isi sheet "CENTRAL STORAGE" dan "CENTRAL KITCHEN"
 * dari spreadsheet aktif tanpa perlu download -> convert JSON -> .gs lagi!
 */
function scanCentralSheetsDirectly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // Cari sheet target (case-insensitive & toleran terhadap spasi / underscore)
  var targetSheets = [
    { key: "CENTRAL KITCHEN", regex: /central.*kitchen/i, foundSheet: null, actualName: "" },
    { key: "CENTRAL STORAGE", regex: /central.*storage/i, foundSheet: null, actualName: "" }
  ];

  for (var s = 0; s < sheets.length; s++) {
    var sName = sheets[s].getName().trim();
    for (var t = 0; t < targetSheets.length; t++) {
      if (!targetSheets[t].foundSheet && targetSheets[t].regex.test(sName)) {
        targetSheets[t].foundSheet = sheets[s];
        targetSheets[t].actualName = sName;
      }
    }
  }

  var scannedDatasets = [];
  var allDiscoveredPeriods = [];
  var periodSet = {};
  var totalItemCount = 0;
  var missingSheets = [];

  for (var i = 0; i < targetSheets.length; i++) {
    var target = targetSheets[i];
    if (!target.foundSheet) {
      missingSheets.push(target.key);
      continue;
    }

    var sheet = target.foundSheet;
    var range = sheet.getDataRange();
    if (!range || range.getNumRows() < 2) {
      missingSheets.push(target.key + " (Sheet kosong atau < 2 baris)");
      continue;
    }

    var grid = range.getValues();
    var displayGrid = range.getDisplayValues();
    var scanRes = parseScannedGrid_(grid, displayGrid, target.actualName, target.key);

    if (scanRes.items.length > 0) {
      totalItemCount += scanRes.items.length;
      scanRes.periodCols.forEach(function (p) {
        if (!periodSet[p]) {
          periodSet[p] = true;
          allDiscoveredPeriods.push(p);
        }
      });
      scannedDatasets.push(scanRes);
    } else {
      missingSheets.push(target.key + " (Tidak ditemukan baris item valid)");
    }
  }

  if (scannedDatasets.length === 0) {
    var availableSheetNames = sheets.map(function (sh) { return sh.getName(); }).join(", ");
    throw new Error(
      "Gagal menemukan data valid di sheet CENTRAL STORAGE atau CENTRAL KITCHEN. " +
      "Sheet yang tersedia di file ini: [" + availableSheetNames + "]. " +
      "Pastikan ada sheet bernama 'CENTRAL STORAGE' atau 'CENTRAL KITCHEN'."
    );
  }

  return {
    success: true,
    scannedAt: new Date().toISOString(),
    spreadsheetName: ss.getName(),
    totalDatasets: scannedDatasets.length,
    totalItems: totalItemCount,
    allPeriods: allDiscoveredPeriods,
    missingSheets: missingSheets,
    datasets: scannedDatasets
  };
}

/**
 * Parser internal untuk mengekstrak kolom dan baris dari 2D sheet array
 */
function parseScannedGrid_(grid, displayGrid, sheetName, defaultCategory) {
  var headerRowIdx = -1;
  var itemColIdx = -1;
  var gramasiColIdx = -1;
  var kategoriColIdx = -1;
  var periodCols = [];

  // Periksa 15 baris pertama untuk mencari baris header
  for (var r = 0; r < Math.min(grid.length, 15); r++) {
    var row = grid[r];
    for (var c = 0; c < row.length; c++) {
      var cellText = String(row[c] || "").trim().toUpperCase();
      if (cellText === "ITEM" || cellText === "NAMA ITEM" || cellText === "NAMA BAHAN" || cellText === "BAHAN") {
        headerRowIdx = r;
        itemColIdx = c;
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (headerRowIdx === -1) {
    return {
      sheetName: sheetName,
      kategori: defaultCategory,
      items: [],
      periodCols: [],
      error: "Kolom header 'ITEM' tidak ditemukan"
    };
  }

  var headerRow = grid[headerRowIdx];
  for (var c = 0; c < headerRow.length; c++) {
    var colName = String(headerRow[c] || "").trim().toUpperCase();
    if (colName === "GRAMASI" || colName === "SATUAN" || colName === "UNIT") {
      gramasiColIdx = c;
    } else if (colName === "KATEGORI" || colName === "CATEGORY") {
      kategoriColIdx = c;
    } else if (colName.indexOf("PL UPDATE") !== -1 || colName.indexOf("PL CENTRAL") !== -1) {
      var cleanCol = colName
        .replace(/_\d+$/, "")
        .replace(/\s+/g, " ")
        .replace("2 JULI 2027", "2 JULI 2026")
        .trim();
      periodCols.push({ colIdx: c, name: cleanCol });
    }
  }

  var items = [];
  for (var r = headerRowIdx + 1; r < grid.length; r++) {
    var row = grid[r];
    var rawItem = row[itemColIdx];
    if (rawItem === null || rawItem === undefined || typeof rawItem === "number") continue;
    var itemName = String(rawItem).replace(/\s+/g, " ").trim();
    if (!itemName || /^\d+$/.test(itemName)) continue;

    var rawGram = gramasiColIdx !== -1 ? row[gramasiColIdx] : "-";
    var gramasi = String(rawGram || "-").replace(/\s+/g, " ").trim().toUpperCase();

    var rawKat = kategoriColIdx !== -1 ? row[kategoriColIdx] : "";
    var kategori = String(rawKat || defaultCategory).trim().toUpperCase();

    var itemObj = {
      ITEM: itemName,
      KATEGORI: kategori,
      GRAMASI: gramasi
    };

    var hasAnyPrice = false;
    for (var p = 0; p < periodCols.length; p++) {
      var pInfo = periodCols[p];
      var rawVal = row[pInfo.colIdx];
      var dispVal = displayGrid && displayGrid[r] ? displayGrid[r][pInfo.colIdx] : "";
      var cleanPrice = parseCleanPrice_(rawVal, dispVal);
      if (cleanPrice !== null && cleanPrice > 0) {
        itemObj[pInfo.name] = cleanPrice;
        hasAnyPrice = true;
      }
    }

    items.push(itemObj);
  }

  var uniquePeriods = [];
  var seenP = {};
  periodCols.forEach(function (p) {
    if (!seenP[p.name]) {
      seenP[p.name] = true;
      uniquePeriods.push(p.name);
    }
  });

  return {
    id: "scanned-" + defaultCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: sheetName,
    sheetName: sheetName,
    kategori: defaultCategory,
    headerRow: headerRowIdx + 1,
    itemCount: items.length,
    periodCols: uniquePeriods,
    items: items,
    sampleItems: items.slice(0, 5)
  };
}

function parseCleanPrice_(val, dispVal) {
  if (val === null || val === undefined || val === "" || val === 0) return null;
  if (typeof val === "number") {
    return isFinite(val) && val > 0 ? Number(val.toFixed(3)) : null;
  }
  var s = String(dispVal || val).trim();
  if (!s) return null;
  var cleaned = s
    .replace(/[Rp\s]/gi, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  var num = Number(cleaned);
  return isFinite(num) && num > 0 ? Number(num.toFixed(3)) : null;
}

/**
 * Menyimpan dataset hasil scan ke UserProperties agar tersimpan permanen
 */
function saveScannedInventoryAsCustomPresets(payload) {
  if (!payload || !Array.isArray(payload.presets)) {
    throw new Error("Payload tidak valid.");
  }
  var serialized = JSON.stringify(payload.presets);
  try {
    PropertiesService.getDocumentProperties().setProperty("CUSTOM_REF_JSON_PRESETS", serialized);
  } catch (e) {}
  PropertiesService.getUserProperties().setProperty("CUSTOM_REF_JSON_PRESETS", serialized);
  return { success: true, count: payload.presets.length };
}

/**
 * Mereset cache preset kustom agar kembali ke bawaan DataPembanding.gs
 */
function clearCustomReferencePresets() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty("CUSTOM_REF_JSON_PRESETS");
  } catch (e) {}
  PropertiesService.getUserProperties().deleteProperty("CUSTOM_REF_JSON_PRESETS");
  return { success: true };
}

/**
 * ============================================================================
 * EKSEKUSI AUTO UPDATE DATA PEMBANDING (JSON & .GS) DARI SHEET LIVE
 * ============================================================================
 * Memindai sheet CENTRAL KITCHEN & CENTRAL STORAGE, lalu secara otomatis:
 * 1. Mengupdate data pembanding in-memory & DocumentProperties di Spreadsheet.
 * 2. Meng-generate kode DataPembanding.gs (format ringkas hemat token).
 * 3. Meng-generate file central-kitchen.json dan central-storage.json.
 */
function updateDataPembandingFromLiveScan() {
  var scanRes = scanCentralSheetsDirectly();
  if (!scanRes || !scanRes.datasets || scanRes.datasets.length === 0) {
    throw new Error("Tidak ada dataset yang berhasil discan dari sheet Central Storage / Kitchen.");
  }

  var liveDatasets = [];
  var kitchenJsonObj = null;
  var storageJsonObj = null;

  for (var i = 0; i < scanRes.datasets.length; i++) {
    var ds = scanRes.datasets[i];
    var isKitchen = ds.kategori.indexOf("KITCHEN") !== -1;
    var baseName = isKitchen ? "Central Kitchen" : "Central Storage";
    var fileSlug = isKitchen ? "central-kitchen" : "central-storage";

    var jsonExport = {
      metadata: {
        tool: "Audit Data Tools",
        version: "2.5.0",
        sourceSheet: ds.sheetName,
        rowCount: ds.itemCount,
        columnCount: ds.periodCols.length + 3,
        exportedAt: scanRes.scannedAt,
        hasHeader: true,
        format: "array-of-objects"
      },
      data: ds.items
    };

    if (isKitchen) {
      kitchenJsonObj = jsonExport;
    } else {
      storageJsonObj = jsonExport;
    }

    liveDatasets.push({
      id: "inv-" + fileSlug,
      name: baseName,
      period: ds.sheetName + " (" + ds.itemCount + " Item Live)",
      defaultSelected: true,
      description: "Hasil scan live dari sheet " + ds.sheetName + " (" + ds.itemCount + " Item)",
      data: ds.items,
      isLiveUpdated: true,
      updatedAt: scanRes.scannedAt
    });
  }

  // 1. Ambil snapshot data pembanding yang lama sebelum ditimpa untuk dijadikan history
  var previousSnapshot = null;
  try {
    var prevRaw = PropertiesService.getDocumentProperties().getProperty("CUSTOM_REF_JSON_PRESETS") ||
                   PropertiesService.getUserProperties().getProperty("CUSTOM_REF_JSON_PRESETS");
    if (prevRaw) {
      previousSnapshot = JSON.parse(prevRaw);
    }
  } catch (e) {}

  var currentTimestamp = new Date();
  var tsSuffix = formatTimestampForFilename_(currentTimestamp);

  var historyRecord = null;
  if (previousSnapshot && Array.isArray(previousSnapshot) && previousSnapshot.length > 0) {
    historyRecord = {
      timestamp: currentTimestamp.toISOString(),
      timestampSuffix: tsSuffix,
      totalDatasets: previousSnapshot.length,
      itemCount: previousSnapshot.reduce(function (sum, d) { return sum + (d.data ? d.data.length : 0); }, 0),
      summary: "History backup sebelum update " + tsSuffix,
      datasets: previousSnapshot
    };

    var historyList = [];
    try {
      var rawHist = PropertiesService.getDocumentProperties().getProperty("DATA_PEMBANDING_HISTORY");
      if (rawHist) {
        var parsedHist = JSON.parse(rawHist);
        if (Array.isArray(parsedHist)) historyList = parsedHist;
      }
    } catch (e) {}

    historyList.unshift(historyRecord);
    if (historyList.length > 10) historyList = historyList.slice(0, 10);

    try {
      PropertiesService.getDocumentProperties().setProperty("DATA_PEMBANDING_HISTORY", JSON.stringify(historyList));
    } catch (e) {}
  }

  // 2. Simpan permanen dataset terbaru ke DocumentProperties & UserProperties
  var serialized = JSON.stringify(liveDatasets);
  try {
    PropertiesService.getDocumentProperties().setProperty("CUSTOM_REF_JSON_PRESETS", serialized);
  } catch (e) {}
  try {
    PropertiesService.getUserProperties().setProperty("CUSTOM_REF_JSON_PRESETS", serialized);
  } catch (e) {}

  // Generate kode lengkap DataPembanding.gs
  var generatedGsCode = generateCompactGsCodeFromDatasets_(scanRes.datasets, scanRes.scannedAt);

  return {
    success: true,
    scannedAt: scanRes.scannedAt,
    timestampSuffix: tsSuffix,
    totalItems: scanRes.totalItems,
    totalDatasets: scanRes.totalDatasets,
    datasets: scanRes.datasets,
    livePresets: liveDatasets,
    kitchenJson: kitchenJsonObj ? JSON.stringify(kitchenJsonObj, null, 2) : "",
    storageJson: storageJsonObj ? JSON.stringify(storageJsonObj, null, 2) : "",
    dataPembandingGs: generatedGsCode,
    historyBackup: historyRecord
  };
}

/**
 * Format timestamp untuk penamaan file history (contoh: 20261110-083500)
 */
function formatTimestampForFilename_(d) {
  var date = d || new Date();
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var yyyy = date.getFullYear();
  var MM = pad(date.getMonth() + 1);
  var dd = pad(date.getDate());
  var HH = pad(date.getHours());
  var mm = pad(date.getMinutes());
  var ss = pad(date.getSeconds());
  return yyyy + MM + dd + "-" + HH + mm + ss;
}

/**
 * Mengambil daftar riwayat snapshot data pembanding dari DocumentProperties
 */
function getDataPembandingHistoryList() {
  try {
    var rawHist = PropertiesService.getDocumentProperties().getProperty("DATA_PEMBANDING_HISTORY");
    if (rawHist) {
      var parsed = JSON.parse(rawHist);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Generator internal untuk membuat kode DataPembanding.gs hemat token
 */
function generateCompactGsCodeFromDatasets_(scannedDatasets, scannedAt) {
  var blocks = [];
  var presetEntries = [];

  for (var i = 0; i < scannedDatasets.length; i++) {
    var ds = scannedDatasets[i];
    var isKitchen = ds.kategori.indexOf("KITCHEN") !== -1;
    var prefix = isKitchen ? "CENTRAL_KITCHEN" : "CENTRAL_STORAGE";
    var fileName = isKitchen ? "central-kitchen.json" : "central-storage.json";

    var periodsVar = prefix + "_PERIODS";
    var rowsVar = prefix + "_ROWS";

    var compactRows = ds.items.map(function (it) {
      var row = [it.ITEM, it.GRAMASI || "-"];
      ds.periodCols.forEach(function (col) {
        var val = it[col];
        row.push(val && val > 0 ? val : 0);
      });
      return row;
    });

    var rowLines = compactRows.map(function (r) { return "  " + JSON.stringify(r); });

    blocks.push(
      "// ----------------------------------------------------------------------------\n" +
      "// SUMBER: 02-data-pembanding/" + fileName + " (" + ds.sheetName + " — " + ds.items.length + " Item)\n" +
      "// Format Baris: [ITEM, GRAMASI, ...hargaSesuaiUrutanPeriods]\n" +
      "// ----------------------------------------------------------------------------\n" +
      "var " + periodsVar + " = " + JSON.stringify(ds.periodCols) + ";\n\n" +
      "var " + rowsVar + " = [\n" +
      rowLines.join(",\n") +
      "\n];"
    );

    presetEntries.push("    {\n" +
      "      id: " + JSON.stringify(isKitchen ? "inv-central-kitchen" : "inv-central-storage") + ",\n" +
      "      name: " + JSON.stringify(isKitchen ? "Central Kitchen" : "Central Storage") + ",\n" +
      "      period: " + JSON.stringify(ds.sheetName + " (" + ds.items.length + " Item)") + ",\n" +
      "      defaultSelected: true,\n" +
      "      description: " + JSON.stringify("Hasil scan live dari sheet " + ds.sheetName) + ",\n" +
      "      data: unpackCompactInventory(" + JSON.stringify(ds.kategori) + ", " + periodsVar + ", " + rowsVar + ")\n" +
      "    }"
    );
  }

  return "/**\n" +
    " * ============================================================================\n" +
    " * FOLDER 02 — DATA PEMBANDING INVENTORY (DataPembanding.gs)\n" +
    " * ============================================================================\n" +
    " * Dihasilkan otomatis oleh Scanner Live / Converter Parser:\n" +
    " * Terakhir Diupdate: " + (scannedAt || new Date().toISOString()) + "\n" +
    " * ============================================================================\n" +
    " */\n\n" +
    "/**\n" +
    " * Mengubah matriks ringkas [ITEM, GRAMASI, ...harga] menjadi array objek standar\n" +
    " * untuk konsumsi Sidebar & mesin Pembanding HPP.\n" +
    " */\n" +
    "function unpackCompactInventory(kategori, periodCols, compactRows) {\n" +
    "  var result = [];\n" +
    "  for (var i = 0; i < compactRows.length; i++) {\n" +
    "    var r = compactRows[i];\n" +
    "    var obj = {\n" +
    "      ITEM: r[0],\n" +
    "      KATEGORI: kategori,\n" +
    "      GRAMASI: r[1]\n" +
    "    };\n" +
    "    for (var c = 0; c < periodCols.length; c++) {\n" +
    "      var val = r[c + 2];\n" +
    "      if (val !== null && val !== undefined && val > 0) {\n" +
    "        obj[periodCols[c]] = val;\n" +
    "      }\n" +
    "    }\n" +
    "    result.push(obj);\n" +
    "  }\n" +
    "  return result;\n" +
    "}\n\n" +
    blocks.join("\n\n") + "\n\n" +
    "/**\n" +
    " * Mengembalikan daftar dataset pembanding yang tersedia untuk dipilih di Sidebar\n" +
    " * (Mendukung Multi-Select: bisa centang 1 atau lebih dari 1 dataset sekaligus).\n" +
    " */\n" +
    "function getBuiltInReferenceDatasets() {\n" +
    "  return [\n" +
    presetEntries.join(",\n") + "\n" +
    "  ];\n" +
    "}\n";
}
