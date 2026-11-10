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
 * Mengambil seluruh daftar Data Pembanding JSON dari DataPembanding.gs
 */
function getAvailableReferenceJsonPresets() {
  var builtIn = [];
  if (typeof getBuiltInReferenceDatasets === "function") {
    builtIn = getBuiltInReferenceDatasets() || [];
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

  return builtIn.concat(customList);
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
