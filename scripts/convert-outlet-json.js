/**
 * scripts/convert-outlet-json.js
 * Membaca JSON inventory outlet (misal: inventory_ciamso_sby_Okt/*.json)
 * dan meng-generate file slot: 02-data-pembanding/DataInventoryOutlet.gs
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outGsPath = path.join(rootDir, '02-data-pembanding', 'DataInventoryOutlet.gs');
const distClaspPath = path.join(rootDir, 'dist-clasp', 'DataInventoryOutlet.gs');

// Cari file json di folder inventory_*
function findOutletJsonFile() {
  const dirs = fs.readdirSync(rootDir);
  for (const d of dirs) {
    if (d.toLowerCase().startsWith('inventory_')) {
      const fullDir = path.join(rootDir, d);
      if (fs.statSync(fullDir).isDirectory()) {
        const files = fs.readdirSync(fullDir);
        for (const f of files) {
          if (f.toLowerCase().endsWith('.json')) {
            return path.join(fullDir, f);
          }
        }
      }
    }
  }
  return null;
}

function parseOutletJson(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const meta = raw.metadata || {};
  const rows = raw.data || [];
  
  let sheetName = meta.sourceSheet || 'INVENTORY OUTLET';
  let outletName = 'CIAMSO SBY';
  let periode = 'OKTOBER 2026';
  
  if (/ciamso/i.test(sheetName)) {
    outletName = 'CIAMSO SBY';
  }
  if (/okt/i.test(sheetName)) {
    periode = 'OKTOBER 2026';
  }

  const items = [];
  let idCounter = 1;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const keys = Object.keys(r);
    const nameVal = r[keys[0]];
    const qtyVal = r[keys[1]];
    const unitVal = r[keys[2]];
    const priceVal = r[keys[3]];

    if (String(nameVal).toLowerCase().includes('nama barang') || String(priceVal).toLowerCase().includes('price')) {
      continue;
    }
    if (!nameVal || typeof nameVal !== 'string' || !nameVal.trim()) continue;

    let price = typeof priceVal === 'number' ? priceVal : parseFloat(String(priceVal || '').replace(/[^\d.-]/g, ''));
    if (isNaN(price)) price = 0;

    const unit = unitVal ? String(unitVal).trim().toUpperCase() : 'PORSI';

    items.push({
      id: 'out-' + (idCounter++),
      name: nameVal.trim(),
      unit: unit,
      price: price,
      qty: qtyVal !== null && qtyVal !== undefined ? Number(qtyVal) : null
    });
  }

  return {
    outletName,
    periode,
    sourceSheet: sheetName,
    updatedAt: new Date().toISOString().split('T')[0],
    totalItems: items.length,
    items
  };
}

function generateGsCode(payload) {
  const jsonItemsStr = JSON.stringify(payload.items, null, 2);

  return `/**
 * ============================================================================
 * DATA INVENTORY OUTLET (02-data-pembanding/DataInventoryOutlet.gs)
 * ============================================================================
 * Slot data inventory outlet yang bisa Anda ganti-ganti secara dinamis & fleksibel.
 *
 * Cara Mengganti Data Outlet:
 * 1. Gunakan menu Generator di Sidebar Add-on (atau jalankan 'npm run convert:outlet').
 * 2. Salin kode yang dihasilkan, lalu paste ke file ini (DataInventoryOutlet.gs) di Apps Script.
 * 3. Simpan (Ctrl+S).
 *
 * Otomatis Terhubung ke:
 * 1. Menu 02 (Pembanding HPP): Muncul sebagai pilihan dataset "Outlet: \${payload.outletName}"
 * 2. Menu 05 (Pembanding HPP Outlet): Sebagai data pembanding harga outlet
 * 3. Menu 06 (Replace Data): Sebagai acuan pencocokan & replace bahan
 * ============================================================================
 */

var DATA_INVENTORY_OUTLET = {
  outletName: ${JSON.stringify(payload.outletName)},
  periode: ${JSON.stringify(payload.periode)},
  sourceSheet: ${JSON.stringify(payload.sourceSheet)},
  updatedAt: ${JSON.stringify(payload.updatedAt)},
  totalItems: ${payload.totalItems},
  items: ${jsonItemsStr}
};

/**
 * Mengambil data inventory outlet aktif
 */
function getInventoryOutletData() {
  // 1. Cek penyimpanan cache DocumentProperties (jika ada snapshot hasil scan langsung)
  try {
    var raw = PropertiesService.getDocumentProperties().getProperty("INVENTORY_OUTLET_DATA");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Gunakan slot statis dari DATA_INVENTORY_OUTLET
  if (typeof DATA_INVENTORY_OUTLET !== "undefined" && DATA_INVENTORY_OUTLET && Array.isArray(DATA_INVENTORY_OUTLET.items)) {
    return DATA_INVENTORY_OUTLET;
  }

  return {
    outletName: "OUTLET",
    periode: "-",
    sourceSheet: "-",
    updatedAt: "",
    totalItems: 0,
    items: []
  };
}

/**
 * Mengonversi DATA_INVENTORY_OUTLET menjadi dataset yang kompatibel dengan Menu 02 (Pembanding HPP)
 */
function getInventoryOutletDatasetForMenu02() {
  var outletData = getInventoryOutletData();
  if (!outletData || !Array.isArray(outletData.items) || outletData.items.length === 0) {
    return null;
  }

  var oName = (outletData.outletName || "OUTLET").toUpperCase();
  var oPeriod = (outletData.periode || "TERBARU").toUpperCase();
  var priceHeader = "HARGA " + oName + " " + oPeriod;

  var mappedRows = outletData.items.map(function(it) {
    var row = {
      ITEM: it.name,
      KATEGORI: "OUTLET " + oName,
      GRAMASI: it.unit || "PORSI"
    };
    row[priceHeader] = it.price;
    return row;
  });

  return {
    id: "inv-outlet-" + oName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: "Outlet: " + oName,
    period: (outletData.sourceSheet || oName) + " (" + outletData.items.length + " Item)",
    defaultSelected: true,
    description: "Data inventory outlet " + oName + " (" + oPeriod + ") dari DataInventoryOutlet.gs",
    data: mappedRows
  };
}

/**
 * Generator helper untuk membuat kode .gs dari payload
 */
function generateInventoryOutletGsCode_(payload) {
  if (!payload || !Array.isArray(payload.items)) {
    throw new Error("Payload outlet tidak valid.");
  }
  var jsonStr = JSON.stringify(payload.items, null, 2);
  var oName = payload.outletName || "OUTLET";
  var sPeriod = payload.periode || "TERBARU";
  var sSheet = payload.sourceSheet || "INVENTORY OUTLET";
  var sDate = payload.updatedAt || new Date().toISOString().split("T")[0];

  return 'var DATA_INVENTORY_OUTLET = {\\n' +
    '  outletName: ' + JSON.stringify(oName) + ',\\n' +
    '  periode: ' + JSON.stringify(sPeriod) + ',\\n' +
    '  sourceSheet: ' + JSON.stringify(sSheet) + ',\\n' +
    '  updatedAt: ' + JSON.stringify(sDate) + ',\\n' +
    '  totalItems: ' + payload.items.length + ',\\n' +
    '  items: ' + jsonStr + '\\n' +
    '};\\n';
}
`;
}

function run() {
  const jsonFile = findOutletJsonFile();
  if (!jsonFile) {
    console.error('Tidak ditemukan file JSON di folder inventory_*');
    process.exit(1);
  }

  console.log('Membaca file outlet JSON:', jsonFile);
  const payload = parseOutletJson(jsonFile);
  console.log(`Ditemukan ${payload.totalItems} item untuk outlet ${payload.outletName} (${payload.periode})`);

  const gsCode = generateGsCode(payload);
  fs.writeFileSync(outGsPath, gsCode, 'utf8');
  console.log('Berhasil menulis:', outGsPath);

  if (fs.existsSync(path.dirname(distClaspPath))) {
    fs.writeFileSync(distClaspPath, gsCode, 'utf8');
    console.log('Berhasil sinkronkan ke:', distClaspPath);
  }
}

run();

