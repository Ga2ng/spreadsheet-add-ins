const fs = require('fs');
const vm = require('vm');

const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');
const pView = fs.readFileSync('03-sidebar-ui/PembandingView.html', 'utf8');
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

const docElements = {};
function fakeEl(id) {
  if (!docElements[id]) {
    docElements[id] = { id, textContent: "", innerHTML: "", className: "", classList: { add: ()=>{}, remove: ()=>{} } };
  }
  return docElements[id];
}

const ctx = vm.createContext({
  console: console,
  document: { getElementById: fakeEl, querySelectorAll: () => [] },
  SpreadsheetApp: { getActiveSpreadsheet: () => mockSpreadsheet },
  PropertiesService: {
    getDocumentProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} }),
    getUserProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} })
  },
  Date: Date,
  Math: Math,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isFinite: isFinite,
  isNaN: isNaN,
  Intl: Intl
});
ctx.window = ctx;

// Run Code.gs
vm.runInContext(codeGs, ctx);

// Run PembandingView.html script
const pScript = pView.substring(pView.indexOf('<script>') + 8, pView.lastIndexOf('</script>'));
vm.runInContext(pScript, ctx);

// Ambil presets live dari backend
const livePresets = ctx.getAvailableReferenceJsonPresets();
console.log('Live presets fetched for Menu 02:', livePresets.map(p => ({ name: p.name, items: p.data.length })));

ctx.availableJsonPresets = livePresets;
ctx.initDefaultCheckedDatasets();
ctx.rebuildMergedInventoryFromSelected();

console.log('Total normalized items in Menu 02:', ctx.normalizedRefItems.length);
console.log('Discovered period columns:', ctx.discoveredPeriodNames.slice(-3));

// Test 1 row in Menu 02 Pembanding HPP
const testRow = ["fillet paha", 1000, "gr", 1000, 48000, 48.0, 48000, 0];
const compResult = ctx.buildSingleComparisonRow(1, testRow);

console.log('\nHasil perbandingan Menu 02:');
console.log('Bahan:', compResult.bahan);
console.log('Matched Ref:', compResult.matchedRef ? compResult.matchedRef.itemName : 'NOT FOUND');
console.log('Overall Status:', compResult.overallStatus);
console.log('Note:', compResult.noteText);
console.log('Values:', compResult.values);

