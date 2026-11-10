const fs = require('fs');

// Muat sample data mentah untuk mensimulasikan sheet.getDataRange().getValues()
const kitchenJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-kitchen.json', 'utf8'));
const storageJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-storage.json', 'utf8'));

// Ubah json array of objects menjadi 2D sheet array simulasi
function jsonToSheetGrid(jsonObj, startRow = 2, startCol = 2) {
  const rows = jsonObj.data || [];
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  
  // Buat grid dengan baris kosong sebelum startRow
  const grid = [];
  for (let r = 0; r < startRow - 1; r++) {
    grid.push(new Array(keys.length + startCol).fill(""));
  }
  
  // Header row
  const headerRow = new Array(startCol - 1).fill("").concat(keys);
  grid.push(headerRow);
  
  // Data rows
  for (const row of rows) {
    const rowVals = new Array(startCol - 1).fill("").concat(keys.map(k => row[k]));
    grid.push(rowVals);
  }
  return grid;
}

const mockKitchenGrid = jsonToSheetGrid(kitchenJson, 2, 2);
const mockStorageGrid = jsonToSheetGrid(storageJson, 2, 3);

// Fungsi scan yang akan diimplementasikan di Code.gs
function scanSheetData(grid, sheetName) {
  if (!grid || grid.length === 0) {
    return { error: "Sheet kosong" };
  }

  // 1. Cari baris header (periksa 10 baris pertama)
  let headerRowIdx = -1;
  let itemColIdx = -1;
  let gramasiColIdx = -1;
  let kategoriColIdx = -1;
  const periodCols = [];

  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cellText = String(row[c] || "").trim().toUpperCase();
      if (cellText === "ITEM" || cellText === "NAMA ITEM" || cellText === "NAMA BAHAN" || cellText === "BAHAN") {
        headerRowIdx = r;
        itemColIdx = c;
        break;
      }
    }
    if (headerRowIdx !== -1) break;
  }

  if (headerRowIdx === -1) {
    return { error: `Header kolom 'ITEM' tidak ditemukan di 15 baris pertama sheet ${sheetName}` };
  }

  const headerRow = grid[headerRowIdx];
  for (let c = 0; c < headerRow.length; c++) {
    const colName = String(headerRow[c] || "").trim().toUpperCase();
    if (colName === "GRAMASI" || colName === "SATUAN" || colName === "UNIT") {
      gramasiColIdx = c;
    } else if (colName === "KATEGORI" || colName === "CATEGORY") {
      kategoriColIdx = c;
    } else if (colName.includes("PL UPDATE") || colName.includes("PL CENTRAL")) {
      // Normalisasi header
      const cleanCol = colName
        .replace(/_\d+$/, "")
        .replace(/\s+/g, " ")
        .replace("2 JULI 2027", "2 JULI 2026")
        .trim();
      periodCols.push({ colIdx: c, name: cleanCol, rawName: colName });
    }
  }

  // 2. Ambil data baris
  const items = [];
  const defaultCategory = sheetName.toUpperCase().trim();

  function parsePrice(val) {
    if (val === null || val === undefined || val === "" || val === 0) return null;
    if (typeof val === "number") return isFinite(val) && val > 0 ? Number(val.toFixed(3)) : null;
    const s = String(val).trim();
    if (!s) return null;
    const cleaned = s.replace(/[Rp\s]/gi, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const num = Number(cleaned);
    return isFinite(num) && num > 0 ? Number(num.toFixed(3)) : null;
  }

  for (let r = headerRowIdx + 1; r < grid.length; r++) {
    const row = grid[r];
    const rawItem = row[itemColIdx];
    if (rawItem === null || rawItem === undefined || typeof rawItem === "number") continue;
    const itemName = String(rawItem).replace(/\s+/g, " ").trim();
    if (!itemName || /^\d+$/.test(itemName)) continue;

    const rawGram = gramasiColIdx !== -1 ? row[gramasiColIdx] : "-";
    const gramasi = String(rawGram || "-").replace(/\s+/g, " ").trim().toUpperCase();

    const rawKat = kategoriColIdx !== -1 ? row[kategoriColIdx] : "";
    const kategori = String(rawKat || defaultCategory).trim().toUpperCase();

    const itemObj = {
      ITEM: itemName,
      KATEGORI: kategori,
      GRAMASI: gramasi
    };

    let hasPrice = false;
    for (const p of periodCols) {
      const pVal = parsePrice(row[p.colIdx]);
      if (pVal !== null && pVal > 0) {
        itemObj[p.name] = pVal;
        hasPrice = true;
      }
    }

    items.push(itemObj);
  }

  return {
    sheetName: sheetName,
    headerRow: headerRowIdx + 1,
    itemCount: items.length,
    periodCols: periodCols.map(p => p.name),
    items: items
  };
}

console.log('Testing Kitchen Scan:');
const resKitchen = scanSheetData(mockKitchenGrid, 'CENTRAL KITCHEN');
console.log('Kitchen items:', resKitchen.itemCount, 'Periods:', resKitchen.periodCols.length);
console.log('Sample item 1:', resKitchen.items[0]);

console.log('\nTesting Storage Scan:');
const resStorage = scanSheetData(mockStorageGrid, 'CENTRAL STORAGE');
console.log('Storage items:', resStorage.itemCount, 'Periods:', resStorage.periodCols.length);
console.log('Sample item 1:', resStorage.items[0]);

