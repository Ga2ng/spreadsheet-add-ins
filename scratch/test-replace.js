const fs = require('fs');
const vm = require('vm');

const dp = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');

const dummyEl = {
  textContent: '',
  innerHTML: '',
  classList: { add: () => {}, remove: () => {} },
  value: '',
  checked: true
};

const ctx = {
  window: {},
  document: { getElementById: () => dummyEl }
};
vm.createContext(ctx);
vm.runInContext(dp, ctx);

const pemHtml = fs.readFileSync('03-sidebar-ui/PembandingView.html', 'utf8');
const scriptMatch = pemHtml.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('No script tag found in PembandingView.html');

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

vm.runInContext(scriptMatch[1], ctx);

// Setup datasets
ctx.availableJsonPresets = ctx.getBuiltInReferenceDatasets();
ctx.selectedDatasetIds = {
  'inv-central-kitchen': true,
  'inv-central-storage': true
};
ctx.rebuildMergedInventoryFromSelected();

// Load sample 10 baris
ctx.loadSample10RowsHpp();

console.log('Testing Replace Harga Preview Candidates:');
console.log('Total Candidates:', ctx.replacePriceCandidateList.length);
ctx.replacePriceCandidateList.forEach(c => {
  const isChecked = Boolean(ctx.replaceCheckedRowMap[c.rowIdx]);
  console.log(`- Sel [${c.cellAddress}] ${c.bahan}: Old = ${c.oldPrice} ➔ New = ${c.newPrice} | Delta = ${c.delta} | CanReplace = ${c.canReplace} | Checked = ${isChecked}`);
});

// Uji fungsi backend di Code.gs
const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');
const vmBackend = require('vm');
const backendCtx = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({
      getSheetByName: () => ({
        getName: () => 'HPP RESEP',
        getRange: (r, c) => ({
          setValue: (val) => {}
        })
      }),
      getActiveSheet: () => ({
        getName: () => 'HPP RESEP',
        getRange: (r, c) => ({
          setValue: (val) => {}
        })
      })
    })
  }
};
vmBackend.createContext(backendCtx);
vmBackend.runInContext(codeGs, backendCtx);

const testPayload = {
  sheetName: 'HPP RESEP',
  items: ctx.replacePriceCandidateList.filter(c => ctx.replaceCheckedRowMap[c.rowIdx] && c.canReplace).map(c => ({
    sheetRow: c.sheetRow,
    sheetCol: c.sheetCol,
    cellAddress: c.cellAddress,
    bahan: c.bahan,
    oldValue: c.oldPrice,
    newValue: c.newPrice
  }))
};

const backendResult = backendCtx.applyReplaceHargaKemasanToSheet(testPayload);
console.log('\nBackend applyReplaceHargaKemasanToSheet result:');
console.log('Success:', backendResult.success);
console.log('Total Updated Cells:', backendResult.totalUpdated);
console.log('Updated Cells List:', backendResult.updatedList.map(u => `${u.cellAddress} (${u.bahan}): ${u.oldValue} ➔ ${u.newValue}`));
