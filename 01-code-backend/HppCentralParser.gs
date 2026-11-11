/**
 * ============================================================================
 * FITUR 07: PARSER HPP CENTRAL KITCHEN (01-code-backend/HppCentralParser.gs)
 * ============================================================================
 * Membaca data secara real-time dari sheet "HPP CENTRAL OKTOBER 26".
 * Target: Membaca 58 Preparation Menu secara akurat.
 *
 * Aturan Deteksi Preparation:
 * 1. Nama menu PASTI FULL UPPERCASE (tidak mengandung huruf kecil a-z).
 * 2. Catatan di bawah nama menu (seperti "1 resep = 12 liter", "1 liter = 66 porsi",
 *    "1 porsi = 15 ml", "mentah = 71 gr", "matang = 45-50 gr") otomatis diabaikan
 *    dan TIDAK dimasukkan ke nama preparation.
 * 3. Logika scan loop mencari baris summary yang berisi HPP / Selling Price,
 *    lalu mencari ke atas untuk mengambil nama preparation FULL UPPERCASE terdekat.
 * ============================================================================
 */

/**
 * Memeriksa apakah teks pada kolom Preparetion adalah nama menu valid (FULL UPPERCASE).
 */
function isUppercasePreparation_(text) {
  if (!text) return false;
  var str = String(text).trim();
  if (!str) return false;

  // 1. Abaikan jika mengandung tanda sama dengan "=" (catatan porsi/resep)
  if (str.indexOf("=") !== -1) return false;

  // 2. Abaikan keyword header atau summary
  if (/^(total|subtotal|sub\s*total|grand\s*total|preparetion|preparation|menu|resep|no\.?|bahan|nama\s*bahan)$/i.test(str)) {
    return false;
  }

  // 3. Wajib memiliki huruf
  var lettersOnly = str.replace(/[^A-Za-z]/g, "");
  if (lettersOnly.length < 2) return false;

  // 4. Wajib TIDAK ADA huruf kecil sama sekali (FULL UPPERCASE)
  if (/[a-z]/.test(str)) return false;

  return true;
}

/**
 * Membaca & mem-parse sheet HPP CENTRAL OKTOBER 26 secara real-time.
 */
function parseHppCentralOktober26(options) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // 1. Cari Sheet Target "HPP CENTRAL OKTOBER 26"
  var targetSheet = null;
  var targetName = "HPP CENTRAL OKTOBER 26";

  for (var i = 0; i < sheets.length; i++) {
    var sName = sheets[i].getName().trim();
    if (sName.toUpperCase() === targetName) {
      targetSheet = sheets[i];
      break;
    }
  }

  // Fallback: cari dengan regex toleran jika penulisan sedikit berbeda
  if (!targetSheet) {
    var reg = /hpp.*central.*okt.*26/i;
    for (var j = 0; j < sheets.length; j++) {
      if (reg.test(sheets[j].getName().trim())) {
        targetSheet = sheets[j];
        break;
      }
    }
  }

  // Fallback kedua: jika sheet aktif memiliki nama HPP Central
  if (!targetSheet) {
    var activeSheet = ss.getActiveSheet();
    var aName = activeSheet.getName().trim().toUpperCase();
    if (aName.indexOf("HPP CENTRAL") !== -1 || aName.indexOf("CENTRAL OKTOBER") !== -1) {
      targetSheet = activeSheet;
    }
  }

  if (!targetSheet) {
    var sheetList = sheets.map(function (s) { return s.getName(); }).join(", ");
    throw new Error(
      "Sheet '" + targetName + "' tidak ditemukan di spreadsheet ini! " +
      "Pastikan ada tab sheet bernama '" + targetName + "'. Sheet yang tersedia: [" + sheetList + "]"
    );
  }

  var range = targetSheet.getDataRange();
  if (!range || range.getNumRows() < 2) {
    throw new Error("Sheet '" + targetSheet.getName() + "' kosong atau memiliki kurang dari 2 baris.");
  }

  var rawVals = range.getValues();
  var dispVals = range.getDisplayValues();
  var numRows = range.getNumRows();
  var numCols = range.getNumColumns();

  // 2. Deteksi Baris Header (dalam 20 baris pertama)
  var colNo = -1;
  var colPrep = -1;
  var colBahan = -1;
  var colGramasi = -1;
  var colSatuan = -1;
  var colKemasan = -1;
  var colHargaKemasan = -1;
  var colProcessing = -1;
  var colPorsi = -1;
  var colHpp = -1;
  var colSelling = -1;
  var headerRowIdx = -1;

  for (var r = 0; r < Math.min(20, numRows); r++) {
    var row = rawVals[r];
    for (var c = 0; c < numCols; c++) {
      var val = String(row[c] || "").trim().toLowerCase();
      if (!val) continue;

      if (/^no\.?$/i.test(val)) colNo = c;
      if (/preparetion|preparation|menu|resep/i.test(val)) colPrep = c;
      if (/^bahan|^nama\s*bahan/i.test(val)) colBahan = c;
      if (/^gramasi|^qty|^berat/i.test(val)) colGramasi = c;
      if (/^satuan|^unit/i.test(val)) colSatuan = c;
      if (/kemasan/i.test(val) && !/harga/i.test(val)) colKemasan = c;
      if (/harga\s*[\/\\]?\s*kemasan/i.test(val)) colHargaKemasan = c;
      if (/processing/i.test(val)) colProcessing = c;
      if (/^porsi|^portion/i.test(val)) colPorsi = c;
      if (/^hpp$/i.test(val) || /^hpp\s*[\/\\]/i.test(val)) colHpp = c;
      if (/price\s*selling|selling\s*price|selling/i.test(val)) colSelling = c;
    }

    if (colPrep !== -1 && (colHpp !== -1 || colSelling !== -1)) {
      headerRowIdx = r;
      break;
    }
  }

  // Fallback indeks kolom jika header tidak ditemukan
  if (colPrep === -1 || colHpp === -1) {
    if (numCols >= 13) {
      colNo = 0;
      colPrep = 1;
      colBahan = 2;
      colGramasi = 3;
      colSatuan = 4;
      colKemasan = 5;
      colHargaKemasan = 6;
      colProcessing = 9;
      colPorsi = 10;
      colHpp = 11;
      colSelling = 12;
      headerRowIdx = 0;
    } else {
      colPrep = 1;
      colHpp = numCols - 2;
      colSelling = numCols - 1;
      headerRowIdx = 0;
    }
  }

  // 3. Scan Loop: Cari baris summary (HPP & Price Selling), lalu cari nama menu FULL UPPERCASE di atasnya
  var results = [];
  var lastProcessedRow = headerRowIdx >= 0 ? headerRowIdx : 0;
  var startScanRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 1;

  for (var r = startScanRow; r < numRows; r++) {
    var rowRaw = rawVals[r];
    var rowDisp = dispVals[r];
    if (!rowRaw || rowRaw.length === 0) continue;

    var hppRaw = colHpp >= 0 ? rowRaw[colHpp] : null;
    var hppDisp = colHpp >= 0 ? rowDisp[colHpp] : "";
    var sellingRaw = colSelling >= 0 ? rowRaw[colSelling] : null;
    var sellingDisp = colSelling >= 0 ? rowDisp[colSelling] : "";

    var hppNum = parseHppCleanPrice_(hppRaw, hppDisp);
    var sellingNum = parseHppCleanPrice_(sellingRaw, sellingDisp);

    // Jika pada baris ini terdapat nilai HPP > 0 atau Selling Price > 0
    if ((hppNum !== null && hppNum > 0) || (sellingNum !== null && sellingNum > 0)) {
      var foundPrep = "";
      var foundNo = null;
      var notes = [];
      var porsiNum = colPorsi >= 0 ? parseHppCleanPrice_(rowRaw[colPorsi], rowDisp[colPorsi]) : null;

      // Cari KE ATAS (Upward Scan) dari baris r-1 sampai lastProcessedRow untuk menemukan judul menu FULL UPPERCASE
      for (var up = r - 1; up >= lastProcessedRow; up--) {
        var upPrep = colPrep >= 0 ? String(dispVals[up][colPrep] || rawVals[up][colPrep] || "").trim() : "";
        var upNo = colNo >= 0 ? String(dispVals[up][colNo] || rawVals[up][colNo] || "").trim() : "";

        if (upPrep) {
          if (isUppercasePreparation_(upPrep)) {
            foundPrep = upPrep;
            if (upNo) {
              var mNo = upNo.match(/\d+/);
              if (mNo) foundNo = parseInt(mNo[0], 10);
            }
            break; // Berhenti karena judul menu FULL UPPERCASE terdekat telah ditemukan!
          } else {
            // Ini adalah catatan (mengandung huruf kecil / tanda sama dengan)
            notes.unshift(upPrep);
            // Ekstrak porsi dari catatan jika di baris summary kolom porsi belum terisi
            if (!porsiNum) {
              var pMatch = upPrep.match(/(\d+[\.,]?\d*)\s*porsi/i);
              if (pMatch) {
                porsiNum = parseFloat(pMatch[1].replace(",", "."));
              }
            }
          }
        }
      }

      // Jika judul ditemukan, bersihkan prefix nomor (misal "1. AYAM CHARSIU" -> 1 dan "AYAM CHARSIU")
      if (foundPrep) {
        var mPrefix = foundPrep.match(/^(\d+)[\.\s]+(.*)/);
        if (mPrefix) {
          if (!foundNo) foundNo = parseInt(mPrefix[1], 10);
          foundPrep = mPrefix[2].trim();
        }

        var marginNominal = (sellingNum && hppNum) ? (sellingNum - hppNum) : null;
        var marginPct = (sellingNum && hppNum && sellingNum > 0) ? Math.round(((sellingNum - hppNum) / sellingNum) * 100) : null;

        results.push({
          no: foundNo || (results.length + 1),
          preparation: foundPrep,
          notes: notes,
          porsi: porsiNum || 1,
          hpp: hppNum,
          hppDisplay: hppDisp || formatHppIDR_(hppNum),
          sellingPrice: sellingNum,
          sellingPriceDisplay: sellingDisp || formatHppIDR_(sellingNum),
          marginNominal: marginNominal,
          marginPercent: marginPct,
          sheetRow: r + 1, // 1-based row di Google Sheets
          cellHpp: (colHpp >= 0 ? colNumberToLetter_(colHpp + 1) : "") + (r + 1),
          cellSelling: (colSelling >= 0 ? colNumberToLetter_(colSelling + 1) : "") + (r + 1)
        });

        lastProcessedRow = r;
      } else if (results.length > 0 && !sellingNum && hppNum) {
        // Antisipasi jika baris HPP dan Selling Price berada di baris berbeda yang berdekatan
        var lastItem = results[results.length - 1];
        if (lastItem && !lastItem.sellingPrice && sellingNum) {
          lastItem.sellingPrice = sellingNum;
          lastItem.sellingPriceDisplay = sellingDisp || formatHppIDR_(sellingNum);
        }
      }
    }
  }

  // 4. Hitung Statistik Ringkasan
  var totalHppSum = 0;
  var totalSellingSum = 0;
  var validHppCount = 0;
  var validSellingCount = 0;

  for (var k = 0; k < results.length; k++) {
    if (results[k].hpp > 0) {
      totalHppSum += results[k].hpp;
      validHppCount++;
    }
    if (results[k].sellingPrice > 0) {
      totalSellingSum += results[k].sellingPrice;
      validSellingCount++;
    }
  }

  var stats = {
    totalMenu: results.length,
    expectedTotal: 58,
    isComplete: results.length === 58,
    avgHpp: validHppCount > 0 ? Math.round(totalHppSum / validHppCount) : 0,
    avgSellingPrice: validSellingCount > 0 ? Math.round(totalSellingSum / validSellingCount) : 0
  };

  var payloadSnapshot = {
    sourceSheet: targetSheet.getName(),
    parsedAt: new Date().toISOString(),
    totalMenu: results.length,
    expectedTotal: 58,
    stats: stats,
    data: results,
    gsCode: generateHppCentralOktDataGsCode_({
      sourceSheet: targetSheet.getName(),
      parsedAt: new Date().toISOString(),
      data: results
    })
  };

  // Simpan ke DocumentProperties agar bisa digunakan pembanding nanti
  try {
    PropertiesService.getDocumentProperties().setProperty(
      "HPP_CENTRAL_OKTOBER_26_DATA",
      JSON.stringify(payloadSnapshot)
    );
  } catch (e) {}

  return payloadSnapshot;
}

/**
 * Mengambil data HPP Central Oktober 26 yang tersimpan di DocumentProperties
 */
function getSavedHppCentralOktober26Data() {
  try {
    var raw = PropertiesService.getDocumentProperties().getProperty("HPP_CENTRAL_OKTOBER_26_DATA");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * Helper pembersih nilai harga khusus HPP
 */
function parseHppCleanPrice_(val, dispVal) {
  if (val === null || val === undefined || val === "") {
    if (!dispVal) return null;
    val = dispVal;
  }
  if (typeof val === "number") {
    return isFinite(val) && val > 0 ? Number(val.toFixed(2)) : null;
  }
  var s = String(val).trim();
  if (!s || s === "-" || s === "Rp -") return null;

  var cleaned = s
    .replace(/[Rp\s]/gi, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  var num = Number(cleaned);
  return isFinite(num) && num > 0 ? Number(num.toFixed(2)) : null;
}

/**
 * Helper format rupiah
 */
function formatHppIDR_(num) {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}
