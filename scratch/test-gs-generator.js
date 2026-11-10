const fs = require('fs');

const kitchenJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-kitchen.json', 'utf8'));
const storageJson = JSON.parse(fs.readFileSync('02-data-pembanding/central-storage.json', 'utf8'));

function generateCompactGsCode(scannedDatasets) {
  // scannedDatasets = [{ name: "CENTRAL KITCHEN", kategori: "CENTRAL KITCHEN", periodCols: [...], items: [...] }]
  const blocks = [];
  const presetEntries = [];

  for (const ds of scannedDatasets) {
    const isKitchen = ds.kategori.indexOf("KITCHEN") !== -1;
    const prefix = isKitchen ? "CENTRAL_KITCHEN" : "CENTRAL_STORAGE";
    const fileName = isKitchen ? "central-kitchen.json" : "central-storage.json";

    const periodsVar = `${prefix}_PERIODS`;
    const rowsVar = `${prefix}_ROWS`;

    // Convert items to compact rows: [ITEM, GRAMASI, ...prices]
    const compactRows = ds.items.map(it => {
      const row = [it.ITEM, it.GRAMASI || "-"];
      ds.periodCols.forEach(col => {
        const val = it[col];
        row.push(val && val > 0 ? val : 0);
      });
      return row;
    });

    const rowLines = compactRows.map(r => "  " + JSON.stringify(r));

    blocks.push(
      `// ----------------------------------------------------------------------------\n` +
      `// SUMBER: 02-data-pembanding/${fileName} (${ds.sheetName} — ${ds.items.length} Item)\n` +
      `// Format Baris: [ITEM, GRAMASI, ...hargaSesuaiUrutanPeriods]\n` +
      `// ----------------------------------------------------------------------------\n` +
      `var ${periodsVar} = ${JSON.stringify(ds.periodCols)};\n\n` +
      `var ${rowsVar} = [\n` +
      rowLines.join(",\n") +
      `\n];`
    );

    presetEntries.push(`    {
      id: ${JSON.stringify(isKitchen ? "inv-central-kitchen" : "inv-central-storage")},
      name: ${JSON.stringify(isKitchen ? "Central Kitchen" : "Central Storage")},
      period: ${JSON.stringify(`${ds.sheetName} (${ds.items.length} Item)`)},
      defaultSelected: true,
      description: ${JSON.stringify(`Hasil scan live dari sheet ${ds.sheetName}`)},
      data: unpackCompactInventory(${JSON.stringify(ds.kategori)}, ${periodsVar}, ${rowsVar})
    }`);
  }

  return `/**
 * ============================================================================
 * FOLDER 02 — DATA PEMBANDING INVENTORY (DataPembanding.gs)
 * ============================================================================
 * Dihasilkan otomatis oleh Scanner Live / Converter Parser:
 * Terakhir Diupdate: ${new Date().toISOString()}
 * ============================================================================
 */

/**
 * Mengubah matriks ringkas [ITEM, GRAMASI, ...harga] menjadi array objek standar
 * untuk konsumsi Sidebar & mesin Pembanding HPP.
 */
function unpackCompactInventory(kategori, periodCols, compactRows) {
  var result = [];
  for (var i = 0; i < compactRows.length; i++) {
    var r = compactRows[i];
    var obj = {
      ITEM: r[0],
      KATEGORI: kategori,
      GRAMASI: r[1]
    };
    for (var c = 0; c < periodCols.length; c++) {
      var val = r[c + 2];
      if (val !== null && val !== undefined && val > 0) {
        obj[periodCols[c]] = val;
      }
    }
    result.push(obj);
  }
  return result;
}

${blocks.join("\n\n")}

/**
 * Mengembalikan daftar dataset pembanding yang tersedia untuk dipilih di Sidebar
 * (Mendukung Multi-Select: bisa centang 1 atau lebih dari 1 dataset sekaligus).
 */
function getBuiltInReferenceDatasets() {
  return [
${presetEntries.join(",\n")}
  ];
}
`;
}

// Test with kitchen and storage
const mockDatasets = [
  {
    name: "CENTRAL KITCHEN",
    sheetName: "CENTRAL KITCHEN",
    kategori: "CENTRAL KITCHEN",
    periodCols: ["PL UPDATE 15 OKTOBER 2026", "PL CENTRAL 15 OKTOBER 2026"],
    items: [
      { ITEM: "ANGKAK", GRAMASI: "GR", "PL UPDATE 15 OKTOBER 2026": 68, "PL CENTRAL 15 OKTOBER 2026": 78.2 },
      { ITEM: "AYAM CHARSIU", GRAMASI: "PORSI", "PL UPDATE 15 OKTOBER 2026": 11635, "PL CENTRAL 15 OKTOBER 2026": 13380.25 }
    ]
  },
  {
    name: "CENTRAL STORAGE",
    sheetName: "CENTRAL STORAGE",
    kategori: "CENTRAL STORAGE",
    periodCols: ["PL UPDATE 15 OKTOBER 2026", "PL CENTRAL 15 OKTOBER 2026"],
    items: [
      { ITEM: "ABON 500 gr", GRAMASI: "PCK", "PL UPDATE 15 OKTOBER 2026": 70500, "PL CENTRAL 15 OKTOBER 2026": 77550 }
    ]
  }
];

const code = generateCompactGsCode(mockDatasets);
console.log('Sample Generated Code:\n', code.substring(0, 500) + '...');

