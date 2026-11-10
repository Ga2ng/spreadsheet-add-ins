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

console.log('Testing updateDataPembandingFromLiveScan()...');
const updateRes = sandbox.updateDataPembandingFromLiveScan();

console.log('Update result success:', updateRes.success);
console.log('Total items:', updateRes.totalItems);
console.log('Kitchen JSON length:', updateRes.kitchenJson.length);
console.log('Storage JSON length:', updateRes.storageJson.length);
console.log('DataPembanding.gs length:', updateRes.dataPembandingGs.length);
console.log('Stored in properties:', Object.keys(storedProps));

// Sekarang cek apakah getAvailableReferenceJsonPresets mengembalikan live presets!
const presets = sandbox.getAvailableReferenceJsonPresets();
console.log('getAvailableReferenceJsonPresets count:', presets.length);
console.log('Preset 1 name:', presets[0].name, 'period:', presets[0].period, 'isLiveUpdated:', presets[0].isLiveUpdated);
