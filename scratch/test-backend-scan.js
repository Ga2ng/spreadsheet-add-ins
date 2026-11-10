const fs = require('fs');
const vm = require('vm');

// 1. Baca Code.gs dan DataPembanding.gs
const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');
const dataPembandingGs = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');
const kitchenJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-kitchen.json', 'utf8'));
const storageJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-storage.json', 'utf8'));

// Ubah json array of objects menjadi 2D sheet array simulasi
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

// Mock SpreadsheetApp
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

const sandbox = {
  console: console,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSpreadsheet
  },
  PropertiesService: {
    getUserProperties: () => ({
      getProperty: () => null,
      setProperty: () => {},
      deleteProperty: () => {}
    })
  },
  Date: Date,
  Math: Math,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  isFinite: isFinite,
  isNaN: isNaN
};

vm.runInNewContext(dataPembandingGs + "\n" + codeGs, sandbox);

console.log('Menjalankan scanCentralSheetsDirectly()...');
const scanResult = sandbox.scanCentralSheetsDirectly();

console.log('Hasil Scan:');
console.log('✓ Success:', scanResult.success);
console.log('✓ Total Datasets:', scanResult.totalDatasets);
console.log('✓ Total Items:', scanResult.totalItems);
console.log('✓ All Periods Count:', scanResult.allPeriods.length);
console.log('✓ Periods:', scanResult.allPeriods.slice(-4));

scanResult.datasets.forEach(ds => {
  console.log(`\n- [${ds.sheetName}] (${ds.kategori}): ${ds.itemCount} item, Header row: ${ds.headerRow}`);
  console.log('  Sample item:', ds.sampleItems[0].ITEM, '| Gramasi:', ds.sampleItems[0].GRAMASI);
});

