const fs = require('fs');
const vm = require('vm');

const dp = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');

const dummyEl = {
  textContent: '',
  innerHTML: '',
  classList: { add: () => {}, remove: () => {} },
  value: 'LATEST_CENTRAL',
  checked: true
};

const ctx = {
  window: {},
  document: { getElementById: () => dummyEl }
};
vm.createContext(ctx);
vm.runInContext(dp, ctx);

// Global Shared helpers
ctx.normalizeKey = function(txt) { return String(txt || '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
ctx.parseNum = function(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  var s = String(val).trim();
  if (!s) return null;
  var cleaned = s.replace(/[Rp\s]/gi, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  var n = Number(cleaned);
  return isFinite(n) ? n : null;
};
ctx.formatIDR = function(val, allowDecimals) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  if (allowDecimals && Math.abs(val - Math.round(val)) > 0.005) {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  }
  return new Intl.NumberFormat('id-ID').format(Math.round(val));
};
ctx.formatSignedIDR = function(val, allowDecimals) {
  if (val === null || val === undefined || isNaN(val)) return '-';
  var r = Math.round(val);
  if (r === 0) return '0';
  return (r > 0 ? '+' : '') + new Intl.NumberFormat('id-ID').format(r);
};
ctx.escapeHtml = function(s) { return s; };
ctx.colNumberToLetter = function(colNum) {
  var temp = Number(colNum);
  var letter = '';
  while (temp > 0) {
    var mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter || 'A';
};
ctx.showAuditStatus = function() {};
ctx.hasGoogleScriptRun = function() { return false; };

// Jalankan script dari PembandingView untuk mendapatkan similarity helper & inventory builder
const pemHtml = fs.readFileSync('03-sidebar-ui/PembandingView.html', 'utf8');
const scriptMatch1 = pemHtml.match(/<script>([\s\S]*?)<\/script>/);
vm.runInContext(scriptMatch1[1], ctx);

// Inisialisasi inventory
ctx.availableJsonPresets = ctx.getBuiltInReferenceDatasets();
ctx.selectedDatasetIds = {
  'inv-central-kitchen': true,
  'inv-central-storage': true
};
ctx.rebuildMergedInventoryFromSelected();

// Jalankan script dari ReplaceHppView
const repHtml = fs.readFileSync('03-sidebar-ui/ReplaceHppView.html', 'utf8');
const scriptMatch2 = repHtml.match(/<script>([\s\S]*?)<\/script>/);
vm.runInContext(scriptMatch2[1], ctx);

// Muat 14 baris sample
ctx.loadSample14RowsRecipeHpp();

console.log('=== TEST HASIL PREVIEW MENU 03 (REPLACE HARGA HPP) ===');
console.log('Total Kandidat:', ctx.repHppCandidateList.length);
ctx.repHppCandidateList.forEach((c) => {
  const isChecked = Boolean(ctx.repHppCheckedMap[c.rowIdx]);
  const matched = c.matchedItemName || 'TIDAK DITEMUKAN';
  const deltaStr = c.delta !== null ? (c.delta > 0 ? `+${c.delta}` : `${c.delta}`) : '-';
  console.log(`[#${c.rowNumber}] Sel ${c.cellAddress} | ${c.bahan.padEnd(20)} | Ref: ${matched.padEnd(25)} | Old: ${String(c.oldPrice).padStart(8)} ➔ New: ${String(c.newPrice).padStart(8)} | Delta: ${deltaStr.padStart(8)} | Checked: ${isChecked}`);
});

// Uji eksekusi backend di Code.gs
const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');
const vmBackend = require('vm');
let updatedCellsStore = {};
const backendCtx = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({
      getSheetByName: () => ({
        getName: () => 'HPP RESEP',
        getRange: (r, c) => ({
          setValue: (val) => { updatedCellsStore[`R${r}C${c}`] = val; }
        })
      }),
      getActiveSheet: () => ({
        getName: () => 'HPP RESEP',
        getRange: (r, c) => ({
          setValue: (val) => { updatedCellsStore[`R${r}C${c}`] = val; }
        })
      })
    })
  }
};
vmBackend.createContext(backendCtx);
vmBackend.runInContext(codeGs, backendCtx);

const testPayload = {
  sheetName: 'HPP RESEP',
  items: ctx.repHppCandidateList.filter(c => ctx.repHppCheckedMap[c.rowIdx] && c.canReplace).map(c => ({
    sheetRow: c.sheetRow,
    sheetCol: c.sheetCol,
    cellAddress: c.cellAddress,
    bahan: c.bahan,
    oldValue: c.oldPrice,
    newValue: c.newPrice
  }))
};

const res = backendCtx.applyReplaceHargaKemasanToSheet(testPayload);
console.log('\n=== TEST BACKEND APPLY REPLACE KE SHEET ===');
console.log('Status Success:', res.success);
console.log('Total Sel Di-replace:', res.totalUpdated);
console.log('Daftar Sel:', res.updatedList.map(u => `${u.cellAddress} (${u.bahan}) = ${u.newValue}`));

