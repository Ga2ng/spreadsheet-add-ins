const fs = require('fs');
const vm = require('vm');

const dp = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');

const dummyEl = {
  textContent: '',
  innerHTML: '',
  classList: { add: () => {}, remove: () => {} },
  value: ''
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
ctx.showAuditStatus = function() {};
ctx.hasGoogleScriptRun = function() { return false; };

vm.runInContext(scriptMatch[1], ctx);

ctx.availableJsonPresets = ctx.getBuiltInReferenceDatasets();
ctx.selectedDatasetIds = {
  'inv-central-kitchen': true,
  'inv-central-storage': true
};
ctx.rebuildMergedInventoryFromSelected();

const sampleHpp = [
  ['FF @100gr', 100, 'gr', 2000, 44100, 22, 2205, 221],
  ['saus mushroom@30gr', 1, 'porsi', null, null, 1500, 1500, 150],
  ['waggyu santori', 2, 'porsi', 1, 25612, 25612, 51224, 5122],
  ['selada air', 10, 'gr', 1000, 13000, 13, 130, 13],
  ['tomat cherry', 10, 'gr', 1000, 90000, 90, 900, 90],
  ['margarine', 10, 'gr', 15000, 339900, 23, 227, 23],
  ['knor', 1, 'pinch', 1000, 99110, 99, 99, 10],
  ['minyak', 50, 'gr', 12000, 220000, 18.33, 917, 92],
  ['rosemarry fresh', 1, 'pcs', null, null, null, 200, 20],
  ['rice paper', 1, 'pcs', 500, 8000, 16, 16, 2]
];

ctx.activeTablePeriodCols = ctx.getActiveTablePeriodColumns();

console.log('Active Period Columns (Agustus - Terakhir):', ctx.activeTablePeriodCols.length);
ctx.activeTablePeriodCols.forEach((col, i) => {
  const isLastTwo = i >= ctx.activeTablePeriodCols.length - 2;
  console.log(`  ${i+1}. ${col} ${isLastTwo ? '★ (2 Kolom Terakhir)' : ''}`);
});

console.log('\nHASIL EVALUASI 10 BARIS HPP:');
sampleHpp.forEach((row, i) => {
  const res = ctx.buildSingleComparisonRow(i + 1, row);
  const matched = res.matchedRef ? res.matchedRef.itemName : 'NOT FOUND';
  const valCount = res.values.length;
  // res.values memiliki format [col1, col2, ..., colN, noteText]
  // 2 kolom terakhir harga adalah res.values[valCount - 3] dan res.values[valCount - 2]
  const last2Vals = [res.values[valCount - 3], res.values[valCount - 2]];
  console.log(`[#${i+1}] ${row[0]} -> Match: "${matched}" | HPP: ${res.hppComparePrice} | 2 Kolom Terakhir: [${last2Vals.join(', ')}] | Status: ${res.noteColorStatus} | Note: "${res.noteText}"`);
});
