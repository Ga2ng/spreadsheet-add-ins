/**
 * ============================================================================
 * INVENTORY OUTLET PARSER (01-code-backend/InventoryOutletParser.gs)
 * ============================================================================
 * Bertanggung jawab mem-parsing data sheet atau JSON inventori outlet menjadi:
 * 1. Objek data standar untuk pembanding dinamis (Menu 02, Menu 05, Menu 06).
 * 2. Kode file .gs utuh (DataInventoryOutlet.gs) yang siap di-copas manual oleh user.
 * ============================================================================
 */

/**
 * Scan sheet inventori outlet yang aktif atau sesuai nama yang diberikan.
 * Mengembalikan array item dan kode .gs yang siap di-copas.
 */
function scanActiveSheetToInventoryOutlet(customSheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Tidak ada spreadsheet yang sedang aktif.");

  var targetSheet = null;
  if (customSheetName) {
    targetSheet = ss.getSheetByName(customSheetName);
  }
  if (!targetSheet) {
    targetSheet = ss.getActiveSheet();
  }
  if (!targetSheet) {
    throw new Error("Sheet inventori outlet tidak ditemukan.");
  }

  var sName = targetSheet.getName().trim();
  var lastRow = targetSheet.getLastRow();
  var lastCol = targetSheet.getLastColumn();

  if (lastRow < 2 || lastCol < 2) {
    throw new Error("Sheet '" + sName + "' tidak memiliki data yang cukup untuk discan.");
  }

  var grid = targetSheet.getRange(1, 1, lastRow, lastCol).getValues();
  var displayGrid = targetSheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();

  var parsed = parseInventoryOutletGrid_(grid, displayGrid, sName);

  var gsCode = generateInventoryOutletGsCode_(parsed);
  parsed.gsCode = gsCode;

  // Simpan snapshot ke DocumentProperties agar langsung aktif di sesi spreadsheet ini
  try {
    PropertiesService.getDocumentProperties().setProperty(
      "INVENTORY_OUTLET_DATA",
      JSON.stringify(parsed)
    );
  } catch (e) {}

  return parsed;
}

/**
 * Mengubah string teks JSON inventori outlet menjadi objek standar & kode .gs
 */
function convertJsonToInventoryOutlet(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    throw new Error("Teks JSON tidak boleh kosong.");
  }

  var raw = JSON.parse(jsonString);
  var meta = raw.metadata || {};
  var rows = Array.isArray(raw) ? raw : (raw.data || []);

  var sName = meta.sourceSheet || "INVENTORY OUTLET";
  var outletName = "OUTLET";
  var periode = "TERBARU";

  var mOutlet = sName.match(/inventory\s+([a-z0-9\s]+?)(?:\s+(?:okt|nov|des|jan|feb|mar|apr|mei|jun|jul|ags|sep|\d{4})|$)/i);
  if (mOutlet && mOutlet[1]) {
    outletName = mOutlet[1].trim().toUpperCase();
  } else if (/ciamso/i.test(sName)) {
    outletName = "CIAMSO SBY";
  }

  var mPeriod = sName.match(/(okt(?:ober)?|nov(?:ember)?|des(?:ember)?|jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|ags(?:ustus)?|sep(?:tember)?)\s*(\d{2,4})?/i);
  if (mPeriod) {
    periode = (mPeriod[1] + (mPeriod[2] ? " " + mPeriod[2] : "")).toUpperCase();
  }

  var items = [];
  var idCounter = 1;

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r || typeof r !== "object") continue;

    var keys = Object.keys(r);
    var nameVal = r[keys[0]];
    var qtyVal = keys.length > 1 ? r[keys[1]] : null;
    var unitVal = keys.length > 2 ? r[keys[2]] : null;
    var priceVal = keys.length > 3 ? r[keys[3]] : null;

    // Lewati baris header jika nama mengandung "Nama Barang" atau "Item"
    if (String(nameVal).toLowerCase().indexOf("nama barang") !== -1 || String(priceVal).toLowerCase().indexOf("price") !== -1) {
      continue;
    }
    if (!nameVal || typeof nameVal !== "string" || !nameVal.trim()) continue;

    var price = typeof priceVal === "number" ? priceVal : parseFloat(String(priceVal || "").replace(/[^\d.-]/g, ""));
    if (isNaN(price)) price = 0;

    var unit = unitVal ? String(unitVal).trim().toUpperCase() : "PORSI";

    items.push({
      id: "out-" + (idCounter++),
      name: nameVal.trim(),
      unit: unit,
      price: price,
      qty: (qtyVal !== null && qtyVal !== undefined && !isNaN(Number(qtyVal))) ? Number(qtyVal) : null
    });
  }

  var result = {
    outletName: outletName,
    periode: periode,
    sourceSheet: sName,
    updatedAt: new Date().toISOString().split("T")[0],
    totalItems: items.length,
    items: items
  };

  var gsCode = generateInventoryOutletGsCode_(result);
  result.gsCode = gsCode;

  try {
    PropertiesService.getDocumentProperties().setProperty(
      "INVENTORY_OUTLET_DATA",
      JSON.stringify(result)
    );
  } catch (e) {}

  return result;
}

/**
 * Parser grid internal untuk mendeteksi kolom Nama Barang, QTY, Unit, Price dari Sheet
 */
function parseInventoryOutletGrid_(grid, displayGrid, defaultSheetName) {
  var headerRow = -1;
  var colName = -1;
  var colQty = -1;
  var colUnit = -1;
  var colPrice = -1;

  // 1. Cari baris header
  for (var r = 0; r < Math.min(15, grid.length); r++) {
    for (var c = 0; c < grid[r].length; c++) {
      var val = String(grid[r][c] || "").toLowerCase().trim();
      if (/nama\s*barang|nama\s*item|nama\s*bahan|product|item\s*name/i.test(val)) {
        colName = c;
        headerRow = r;
      }
      if (/qty|kuantitas|jumlah/i.test(val)) colQty = c;
      if (/unit|satuan/i.test(val)) colUnit = c;
      if (/price|harga|harga\s*beli|harga\s*kemasan/i.test(val)) colPrice = c;
    }
    if (colName !== -1 && (colPrice !== -1 || colUnit !== -1)) {
      break;
    }
  }

  // Fallback jika header tidak terdeteksi jelas
  if (colName === -1) colName = 0;
  if (colUnit === -1) colUnit = 2;
  if (colPrice === -1) colPrice = 3;
  if (headerRow === -1) headerRow = 0;

  var items = [];
  var idCounter = 1;

  for (var rowIdx = headerRow + 1; rowIdx < grid.length; rowIdx++) {
    var rawName = String(grid[rowIdx][colName] || "").trim();
    if (!rawName || /^(total|grand\s*total|subtotal)$/i.test(rawName)) continue;

    // Bersihkan nama dari header yang berulang
    if (/nama\s*barang|nama\s*item/i.test(rawName)) continue;

    var rawUnit = colUnit >= 0 ? String(grid[rowIdx][colUnit] || "").trim().toUpperCase() : "PORSI";
    if (!rawUnit) rawUnit = "PORSI";

    var rawPrice = colPrice >= 0 ? grid[rowIdx][colPrice] : 0;
    var dispPrice = colPrice >= 0 && displayGrid[rowIdx] ? displayGrid[rowIdx][colPrice] : "";
    var priceNum = 0;

    if (typeof rawPrice === "number") {
      priceNum = rawPrice;
    } else {
      var cleanP = String(dispPrice || rawPrice || "").replace(/[^\d,\.-]/g, "");
      if (cleanP.indexOf(",") !== -1 && cleanP.indexOf(".") !== -1) {
        cleanP = cleanP.replace(/\./g, "").replace(",", ".");
      } else if (cleanP.indexOf(",") !== -1) {
        cleanP = cleanP.replace(",", ".");
      }
      priceNum = parseFloat(cleanP);
      if (isNaN(priceNum)) priceNum = 0;
    }

    var rawQty = colQty >= 0 ? grid[rowIdx][colQty] : null;
    var qtyNum = (typeof rawQty === "number") ? rawQty : parseFloat(String(rawQty || "").replace(/[^\d.-]/g, ""));
    if (isNaN(qtyNum)) qtyNum = null;

    items.push({
      id: "out-" + (idCounter++),
      name: rawName,
      unit: rawUnit,
      price: priceNum,
      qty: qtyNum
    });
  }

  var sName = defaultSheetName || "INVENTORY OUTLET";
  var outletName = "OUTLET";
  var periode = "TERBARU";

  var mOutlet = sName.match(/inventory\s+([a-z0-9\s]+?)(?:\s+(?:okt|nov|des|jan|feb|mar|apr|mei|jun|jul|ags|sep|\d{4})|$)/i);
  if (mOutlet && mOutlet[1]) {
    outletName = mOutlet[1].trim().toUpperCase();
  } else if (/ciamso/i.test(sName)) {
    outletName = "CIAMSO SBY";
  }

  var mPeriod = sName.match(/(okt(?:ober)?|nov(?:ember)?|des(?:ember)?|jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|ags(?:ustus)?|sep(?:tember)?)\s*(\d{2,4})?/i);
  if (mPeriod) {
    periode = (mPeriod[1] + (mPeriod[2] ? " " + mPeriod[2] : "")).toUpperCase();
  }

  return {
    outletName: outletName,
    periode: periode,
    sourceSheet: sName,
    updatedAt: new Date().toISOString().split("T")[0],
    totalItems: items.length,
    items: items
  };
}

