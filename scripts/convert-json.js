/**
 * ============================================================================
 * PARSER & CONVERTER JSON -> APPS SCRIPT HEMAT TOKEN (scripts/convert-json.js)
 * ============================================================================
 * Fungsi Utama:
 *   Mengonversi file JSON mentah hasil ekspor Parser (seperti central-kitchen.json
 *   & central-storage.json di folder 02-data-pembanding/) menjadi kode Apps Script
 *   "02-data-pembanding/DataPembanding.gs" yang:
 *   1. Sangat Hemat Token AI (ukuran turun ~85% dari 333 KB -> ~43 KB!)
 *   2. Semua harga string ("Rp 11.635", "Rp 72.500,00") sudah di-parse jadi Number murni.
 *   3. Baris kosong / typo angka (ITEM: null / ITEM: 15) & kolom duplikat (_2) otomatis dibuang.
 *   4. Nama kolom bulan ("PL UPDATE ...", "PL CENTRAL ...") cukup ditulis 1x di header schema,
 *      sedangkan ribuan nilai harganya disimpan sebagai matriks 1-baris-per-item lalu
 *      di-unpack otomatis oleh fungsi Apps Script getBuiltInReferenceDatasets().
 *
 * Cara Pakai di Terminal:
 *   - Convert semua file JSON di 02-data-pembanding/:
 *       npm run convert
 *   - Convert sambil menunjuk nama file JSON tertentu:
 *       npm run convert central-kitchen.json
 *       npm run convert central-storage.json
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "02-data-pembanding");
const outGsPath = path.join(dataDir, "DataPembanding.gs");
const distClaspDir = path.join(rootDir, "dist-clasp");

/**
 * Mengubah nilai harga mentah ("Rp 11.635", "Rp 46.000,00", "Rp 16,80", 66.5, "Rp0", null)
 * menjadi angka murni (Number) atau null jika kosong / 0.
 */
function parseCleanPrice(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") {
    return isFinite(val) && val > 0 ? Number(val.toFixed(3)) : null;
  }
  const s = String(val).trim();
  if (!s) return null;
  const cleaned = s
    .replace(/[Rp\s]/gi, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  return isFinite(num) && num > 0 ? Number(num.toFixed(3)) : null;
}

/**
 * Membersihkan nama kolom bulan/periode:
 * - Menghapus spasi ganda ("PL UPDATE 2  MEI 2026" -> "PL UPDATE 2 MEI 2026")
 * - Menghapus suffix duplikat ("_2", "_3")
 * - Memperbaiki typo tahun "2 JULI 2027" -> "2 JULI 2026"
 */
function normalizePeriodHeader(rawKey) {
  return String(rawKey || "")
    .toUpperCase()
    .replace(/_\d+$/, "")
    .replace(/\s+/g, " ")
    .replace("2 JULI 2027", "2 JULI 2026")
    .trim();
}

/**
 * Memproses 1 file JSON mentah menjadi schema kolom + matriks baris yang hemat token
 */
function parseSingleJsonFile(filePath) {
  const fileName = path.basename(filePath);
  const rawContent = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const meta = rawContent.metadata || {};
  const rawRows = Array.isArray(rawContent) ? rawContent : (rawContent.data || []);

  const defaultCategory = (
    meta.sourceSheet ||
    fileName.replace(/\.json$/i, "").replace(/[-_]/g, " ")
  )
    .toUpperCase()
    .trim();

  // 1. Kumpulkan seluruh kolom PL UPDATE / PL CENTRAL yang memiliki minimal 1 harga valid (> 0)
  const activePeriods = [];
  const activePeriodSet = new Set();

  // Pertama: urutkan sesuai urutan kemunculan di rawRows
  for (const row of rawRows) {
    if (!row || typeof row !== "object") continue;
    for (const [k, v] of Object.entries(row)) {
      const upperK = String(k).toUpperCase();
      if (upperK.includes("PL UPDATE") || upperK.includes("PL CENTRAL")) {
        const cleanVal = parseCleanPrice(v);
        if (cleanVal !== null && cleanVal > 0) {
          const cleanCol = normalizePeriodHeader(upperK);
          if (!activePeriodSet.has(cleanCol)) {
            activePeriodSet.add(cleanCol);
            activePeriods.push(cleanCol);
          }
        }
      }
    }
  }

  // 2. Proses setiap baris item valid menjadi tuple: [ITEM, GRAMASI, ...hargaPerPeriode]
  const compactRows = [];
  const sampleExpandedItems = [];
  let skippedEmptyCount = 0;

  for (const row of rawRows) {
    if (!row || typeof row !== "object") continue;

    const rawItem = row.ITEM !== undefined ? row.ITEM : (row["Nama Bahan"] || row["Bahan"]);
    if (rawItem === null || rawItem === undefined || typeof rawItem === "number") {
      skippedEmptyCount++;
      continue;
    }
    const itemName = String(rawItem).replace(/\s+/g, " ").trim();
    if (!itemName || /^\d+$/.test(itemName)) {
      skippedEmptyCount++;
      continue;
    }

    const rawGram = row.GRAMASI || row.Gramasi || row.SATUAN || row.Satuan || "-";
    const gramasi = String(rawGram || "-").replace(/\s+/g, " ").trim().toUpperCase();

    // Peta harga bersih untuk baris ini
    const priceMap = {};
    for (const [k, v] of Object.entries(row)) {
      const upperK = String(k).toUpperCase();
      if (upperK.includes("PL UPDATE") || upperK.includes("PL CENTRAL")) {
        const cleanCol = normalizePeriodHeader(upperK);
        const cleanVal = parseCleanPrice(v);
        if (cleanVal !== null && cleanVal > 0) {
          priceMap[cleanCol] = cleanVal;
        }
      }
    }

    const priceVector = activePeriods.map((col) =>
      priceMap[col] !== undefined ? priceMap[col] : 0
    );

    compactRows.push([itemName, gramasi, ...priceVector]);

    const isDemoTarget = /ANGKAK|AYAM CHARSIU|AYAM CUT|ABON|AMPLOP|WAGYU|TOMAT|MARGARINE|KNOR|MINYAK GORENG|ROSEMARRY|RICE PAPER PUTIH/i.test(
      itemName
    );
    if (sampleExpandedItems.length < 5 || isDemoTarget) {
      const sampleObj = {
        ITEM: itemName,
        KATEGORI: defaultCategory,
        GRAMASI: gramasi
      };
      activePeriods.forEach((col, i) => {
        if (priceVector[i] > 0) sampleObj[col] = priceVector[i];
      });
      sampleExpandedItems.push(sampleObj);
    }
  }

  const baseSlug = fileName
    .replace(/\.json$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const readableTitle = meta.sourceSheet
    ? meta.sourceSheet
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : fileName.replace(/\.json$/i, "");

  return {
    fileName,
    id: `inv-${baseSlug}`,
    name: readableTitle,
    category: defaultCategory,
    sourceSheet: meta.sourceSheet || readableTitle.toUpperCase(),
    sourceRange: meta.sourceRange || "-",
    itemCount: compactRows.length,
    skippedCount: skippedEmptyCount,
    periods: activePeriods,
    rows: compactRows,
    sampleExpandedItems
  };
}

function main() {
  const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

  // Validasi argumen jika user menjalankan: npm run convert <nama-file.json>
  if (cliArgs.length > 0) {
    for (const arg of cliArgs) {
      const withExt = arg.toLowerCase().endsWith(".json") ? arg : `${arg}.json`;
      const candidate = path.isAbsolute(arg)
        ? arg
        : fs.existsSync(path.join(dataDir, arg))
        ? path.join(dataDir, arg)
        : fs.existsSync(path.join(dataDir, withExt))
        ? path.join(dataDir, withExt)
        : path.join(rootDir, arg);

      if (!fs.existsSync(candidate)) {
        console.error(`❌ File JSON tidak ditemukan: ${arg}`);
        console.error(`   Pastikan file berada di dalam folder 02-data-pembanding/`);
        process.exit(1);
      }
    }
  }

  const allJsonInFolder = fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .sort()
    .map((f) => path.join(dataDir, f));

  if (allJsonInFolder.length === 0) {
    console.error("❌ Tidak ada file .json di dalam folder 02-data-pembanding/");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("🔄 CONVERT JSON -> APPS SCRIPT HEMAT TOKEN (DataPembanding.gs)");
  console.log("==================================================================");

  let totalRawBytes = 0;
  const parsedDatasets = allJsonInFolder.map((fp) => {
    totalRawBytes += fs.statSync(fp).size;
    const res = parseSingleJsonFile(fp);
    console.log(
      `✓ ${res.fileName} -> ${res.itemCount} item valid, ${res.periods.length} kolom periode aktif (skip ${res.skippedCount} baris invalid)`
    );
    return res;
  });

  // Bangun blok variabel untuk setiap dataset JSON
  const gsDatasetBlocks = [];
  const presetEntries = [];

  for (const ds of parsedDatasets) {
    const prefix = ds.fileName
      .replace(/\.json$/i, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_");

    const colsVar = `${prefix}_PERIODS`;
    const rowsVar = `${prefix}_ROWS`;

    const rowLines = ds.rows.map((r) => "  " + JSON.stringify(r));

    gsDatasetBlocks.push(
      `// ----------------------------------------------------------------------------\n` +
        `// SUMBER: 02-data-pembanding/${ds.fileName} (${ds.sourceSheet}!${ds.sourceRange} — ${ds.itemCount} Item)\n` +
        `// Format Baris: [ITEM, GRAMASI, ...hargaSesuaiUrutanPeriods]\n` +
        `// ----------------------------------------------------------------------------\n` +
        `var ${colsVar} = ${JSON.stringify(ds.periods)};\n\n` +
        `var ${rowsVar} = [\n` +
        rowLines.join(",\n") +
        `\n];`
    );

    presetEntries.push(`    {
      id: ${JSON.stringify(ds.id)},
      name: ${JSON.stringify(ds.name)},
      period: ${JSON.stringify(`${ds.sourceSheet} (${ds.itemCount} Item)`)},
      defaultSelected: true,
      description: ${JSON.stringify(`Hasil convert dari 02-data-pembanding/${ds.fileName}`)},
      data: unpackCompactInventory(${JSON.stringify(ds.category)}, ${colsVar}, ${rowsVar})
    }`);
  }

  const gsOutput = `/**
 * ============================================================================
 * FOLDER 02 — DATA PEMBANDING INVENTORY (DataPembanding.gs)
 * ============================================================================
 * Dihasilkan otomatis oleh converter parser:
 *   npm run convert
 *
 * Mengapa format ini sangat hemat token AI & cepat di Apps Script?
 * - Nama kolom periode ("PL UPDATE ...", "PL CENTRAL ...") hanya ditulis 1 KALI
 *   di variabel *_PERIODS (tidak diulang ribuan kali di setiap baris).
 * - Setiap baris di *_ROWS hanya berisi: [ITEM, GRAMASI, harga1, harga2, ...].
 * - Semua harga sudah di-parse menjadi Number murni (tanpa "Rp", titik ribuan, atau null).
 * - Saat Sidebar dibuka, fungsi unpackCompactInventory() otomatis mengubahnya
 *   kembali menjadi objek standar yang siap dibandingkan oleh Menu 02 Pembanding HPP.
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

${gsDatasetBlocks.join("\n\n")}

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

  fs.writeFileSync(outGsPath, gsOutput, "utf8");

  // Pastikan 03-sidebar-ui/PembandingView.html tetap ringan & bersih
  const pembandingPath = path.join(rootDir, "03-sidebar-ui", "PembandingView.html");
  if (fs.existsSync(pembandingPath)) {
    let pembandingHtml = fs.readFileSync(pembandingPath, "utf8");
    const startMarker = "  // Fallback bawaan jika dijalankan di luar Google Apps Script";
    const endMarker = "  // State Global";
    const sIdx = pembandingHtml.indexOf(startMarker);
    const eIdx = pembandingHtml.indexOf(endMarker);
    if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
      const compactFallback = `${startMarker} (di Apps Script, data lengkap dimuat dari DataPembanding.gs)
  var FALLBACK_JSON_PRESETS = [
${parsedDatasets
  .map(
    (ds) => `    {
      id: ${JSON.stringify(ds.id)},
      name: ${JSON.stringify(ds.name)},
      period: ${JSON.stringify(`${ds.sourceSheet} (${ds.itemCount} Item)`)},
      defaultSelected: true,
      data: ${JSON.stringify(ds.sampleExpandedItems)}
    }`
  )
  .join(",\n")}
  ];

`;
      pembandingHtml = pembandingHtml.substring(0, sIdx) + compactFallback + pembandingHtml.substring(eIdx);
      fs.writeFileSync(pembandingPath, pembandingHtml, "utf8");
    }
  }

  // Sinkronkan ke folder dist-clasp/ agar siap untuk 'npm run push'
  if (!fs.existsSync(distClaspDir)) {
    fs.mkdirSync(distClaspDir, { recursive: true });
  }

  const syncPairs = [
    { src: "00-manifest/appsscript.json", dest: "appsscript.json" },
    { src: "01-code-backend/Code.gs", dest: "Code.gs" },
    { src: "02-data-pembanding/DataPembanding.gs", dest: "DataPembanding.gs" },
    { src: "03-sidebar-ui/Sidebar.html", dest: "Sidebar.html" },
    { src: "03-sidebar-ui/PembandingView.html", dest: "PembandingView.html" },
    { src: "03-sidebar-ui/ReplaceHppView.html", dest: "ReplaceHppView.html" },
    { src: "03-sidebar-ui/ParserView.html", dest: "ParserView.html" }
  ];

  for (const pair of syncPairs) {
    const s = path.join(rootDir, pair.src);
    const d = path.join(distClaspDir, pair.dest);
    if (fs.existsSync(s)) {
      fs.copyFileSync(s, d);
    }
  }

  const rawKb = (totalRawBytes / 1024).toFixed(1);
  const outKb = (Buffer.byteLength(gsOutput, "utf8") / 1024).toFixed(1);
  const savedPct = Math.round((1 - Buffer.byteLength(gsOutput, "utf8") / totalRawBytes) * 100);

  console.log("------------------------------------------------------------------");
  console.log(`📉 Ukuran JSON Mentah : ${rawKb} KB`);
  console.log(`✨ Ukuran DataPembanding.gs : ${outKb} KB (Hemat ${savedPct}% ukuran & token AI!)`);
  console.log(`✅ File 02-data-pembanding/DataPembanding.gs & dist-clasp/ berhasil di-update!`);
  console.log("==================================================================");
}

main();
