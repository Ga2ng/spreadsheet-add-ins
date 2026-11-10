const fs = require('fs');
const vm = require('vm');

const dpContent = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');
const pView = fs.readFileSync('03-sidebar-ui/PembandingView.html', 'utf8');

const ctx = vm.createContext({
  console: console,
  Math: Math,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  Intl: Intl
});
ctx.window = ctx;

vm.runInContext(dpContent, ctx);

const scriptStart = pView.indexOf('<script>');
const scriptEnd = pView.lastIndexOf('</script>');
const scriptContent = pView.substring(scriptStart + 8, scriptEnd);

vm.runInContext(scriptContent, ctx);

const presets = ctx.getBuiltInReferenceDatasets();
let combined = [];
presets.forEach(p => {
  p.data.forEach(r => combined.push(r));
});

const normItems = ctx.normalizeInventoryItems(combined);
console.log('Total ref items:', normItems.length);

const testRows = [
  ["AYAM CHARSIU REGULER", "fillet paha", 1000, "gr", 1000, 48000, 48.0, 48000],
  ["", "jahe", 15, "gr", 1000, 24000, 24.0, 360],
  ["", "angkak", 30, "gr", 1000, 68000, 68.0, 2040],
  ["", "madu", 135, "gr", 1000, 49000, 49.0, 6615],
  ["", "minyak wijen", 45, "gr", 620, 44000, 70.97, 3194],
  ["", "saos tiram", 15, "gr", 770, 52000, 67.53, 1013],
  ["", "powder ngohiong", 15, "gr", 1000, 117000, 117.0, 1755],
  ["", "gula", 15, "gr", 1000, 17500, 17.5, 263],
  ["", "bawang putih kupas", 5, "gr", 1000, 36000, 36.0, 180],
  ["", "vitzin", 30, "gr", 1000, 49584, 49.58, 1488],
  ["", "knorr", 15, "gr", 1000, 90100, 90.1, 1352],
  ["", "garam ", 15, "gr", 1000, 19000, 19.0, 285],
  ["", "minyak goreng ", 300, "ml", 18000, 349000, 19.39, 5817],
  ["", "lada", 1, "gr", 770, 98000, 127.27, 127]
];

ctx.normalizedRefItems = normItems;
ctx.activeTablePeriodCols = [
  "PL UPDATE 11 AGUSTUS 2026",
  "PL CENTRAL 11 AGUSTUS 2026",
  "PL UPDATE 15 OKTOBER 2026",
  "PL CENTRAL 15 OKTOBER 2026"
];

console.log('\n--- HASIL MATCHING MENU 02 DENGAN 14 RESEP ---');
testRows.forEach((r, idx) => {
  let standardRow;
  if (r[1] && typeof r[1] === 'string' && isNaN(Number(r[1]))) {
    standardRow = [r[1], r[2], r[3], r[4], r[5], r[6], r[7], 0];
  } else {
    standardRow = r;
  }

  const res = ctx.buildSingleComparisonRow(idx + 1, standardRow);
  const matched = res.matchedRef;
  const colVal = res.values[ctx.activeTablePeriodCols.indexOf("PL CENTRAL 15 OKTOBER 2026")];
  console.log(`${idx+1}. [${res.bahan}] -> ${matched ? matched.itemName : 'NOT FOUND'} (${res.overallStatus}) | HPP Kemasan: ${res.hargaKemasanHpp} | Ref Unit: ${matched ? matched.gramasiUnit : '-'} | PL CENTRAL 15 OKT: ${colVal}`);
});
