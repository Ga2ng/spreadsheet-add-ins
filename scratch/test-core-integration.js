const fs = require('fs');
const vm = require('vm');

const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');
const kitchenJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-kitchen.json', 'utf8'));
const storageJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-storage.json', 'utf8'));

function jsonToSheetGrid(jsonObj, startRow = 2, startCol = 2) {
  const rows = jsonObj.data || [];
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const grid = [];
  for (let r = 0; r < startRow - 1; r++) {
    grid.push(new Array(keys.length + startCol).fill(""));
  }
  const headerRow = new Array(startCol - 1).fill("").concat(keys);
  grid.push(headerRow);
  for (const row of rows) {
    const rowVals = new Array(startCol - 1).fill("").concat(keys.map(k => row[k]));
    grid.push(rowVals);
  }
  return grid;
}

const mockKitchenGrid = jsonToSheetGrid(kitchenJson, 2, 2);
const mockStorageGrid = jsonToSheetGrid(storageJson, 2, 3);

// Tambah 1 item baru di mock Kitchen untuk membuktikan data baru langsung muncul!
const newRow = new Array(mockKitchenGrid[1].length).fill(0);
newRow[1] = 999; // NO
newRow[2] = "ITEM BARU LIVE 2026"; // ITEM
newRow[3] = "CENTRAL KITCHEN"; // KATEGORI
newRow[4] = "PACK"; // GRAMASI
newRow[newRow.length - 1] = 99999; // Harga terbaru
mockKitchenGrid.push(newRow);

const mockSheets = [
  {
    getName: () => "CENTRAL KITCHEN",
    getDataRange: () => ({
      getNumRows: () => mockKitchenGrid.length,
      getValues: () => mockKitchenGrid,
      getDisplayValues: () => mockKitchenGrid.map(r => r.map(c => String(c || "")))
    })
  },
  {
    getName: () => "CENTRAL STORAGE",
    getDataRange: () => ({
      getNumRows: () => mockStorageGrid.length,
      getValues: () => mockStorageGrid,
      getDisplayValues: () => mockStorageGrid.map(r => r.map(c => String(c || "")))
    })
  }
];

const mockSpreadsheet = {
  getName: () => "Spreadsheet Uji Coba HPP",
  getSheets: () => mockSheets,
  getSheetByName: (name) => mockSheets.find(s => s.getName().toUpperCase() === name.toUpperCase()) || null
};

let storedProps = {};

const sandbox = {
  console: console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSpreadsheet
  },
  PropertiesService: {
    getDocumentProperties: () => ({
      getProperty: (k) => storedProps[k] || null,
      setProperty: (k, v) => { storedProps[k] = v; },
      deleteProperty: (k) => { delete storedProps[k]; }
    }),
    getUserProperties: () => ({
      getProperty: (k) => storedProps[k] || null,
      setProperty: (k, v) => { storedProps[k] = v; },
      deleteProperty: (k) => { delete storedProps[k]; }
    })
  },
  Date: Date,
  Math: Math,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  isFinite: isFinite,
  isNaN: isNaN,
  JSON: JSON
};

vm.runInNewContext(codeGs, sandbox);

// Panggil getAvailableReferenceJsonPresets()
console.log('Testing getAvailableReferenceJsonPresets() with live sheet detection...');
const presets = sandbox.getAvailableReferenceJsonPresets();
console.log('Presets loaded count:', presets.length);
presets.forEach(p => {
  console.log(`- ${p.name} | Items: ${p.data.length} | LiveScanned: ${p.isLiveScanned}`);
});

const foundNew = presets[0].data.find(it => it.ITEM === "ITEM BARU LIVE 2026");
console.log('Item Baru Live ditemukan di Menu 02 presets?:', Boolean(foundNew), foundNew ? foundNew.ITEM : '-');

