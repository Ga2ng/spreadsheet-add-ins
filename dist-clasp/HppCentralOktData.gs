/**
 * ============================================================================
 * DATA BACKEND: HPP CENTRAL KITCHEN (01-code-backend/HppCentralOktData.gs)
 * ============================================================================
 * Menyimpan data acuan HPP_CENTRAL_OKT_DATA dari sheet "HPP CENTRAL OKTOBER 26".
 *
 * Fungsi Utama:
 * 1. Basis Data Pembanding: Menjadi acuan HPP dan Selling Price untuk seluruh fitur.
 * 2. Searchable di Menu 07: Bisa langsung dicari per menu di Menu 07 tanpa perlu
 *    scan berulang-ulang.
 * 3. Auto-Cache: Saat scanner Menu 07 dijalankan, snapshot terbaru otomatis disimpan
 *    di DocumentProperties dan bisa langsung diekspor sebagai HPP_CENTRAL_OKT_DATA.gs.
 * ============================================================================
 */

/**
 * Data Utama HPP Central Kitchen Oktober 26
 * (Otomatis dimutakhirkan saat scan di Menu 07)
 */
var HPP_CENTRAL_OKT_DATA = [
  {
    no: 1,
    preparation: "AYAM CHARSIU REGULER",
    notes: [],
    porsi: 7,
    hpp: 11421.78,
    hppDisplay: "Rp 11.421,78",
    sellingPrice: 13135.04,
    sellingPriceDisplay: "Rp 13.135,04",
    marginNominal: 1713.26,
    marginPercent: 13,
    sheetRow: 16
  },
  {
    no: 2,
    preparation: "AYAM CHARSIU PROMO",
    notes: ["mentah = 71 gr", "matang = 45-50 gr"],
    porsi: 14,
    hpp: 4741.16,
    hppDisplay: "Rp 4.741,16",
    sellingPrice: 5452.33,
    sellingPriceDisplay: "Rp 5.452,33",
    marginNominal: 711.17,
    marginPercent: 13,
    sheetRow: 32
  },
  {
    no: 3,
    preparation: "KUAH KALDU WIP",
    notes: ["1 resep = 12 liter", "1 liter = 66 porsi", "1 porsi = 15 ml"],
    porsi: 792,
    hpp: 199.72,
    hppDisplay: "Rp 199,72",
    sellingPrice: 229.68,
    sellingPriceDisplay: "Rp 229,68",
    marginNominal: 29.96,
    marginPercent: 13,
    sheetRow: 48
  }
];

/**
 * Mengambil dataset HPP Central Oktober 26.
 * Memprioritaskan snapshot terbaru dari DocumentProperties (hasil scan live),
 * fallback ke variabel HPP_CENTRAL_OKT_DATA.
 */
function getHppCentralOktData() {
  try {
    var raw = PropertiesService.getDocumentProperties().getProperty("HPP_CENTRAL_OKTOBER_26_DATA");
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    sourceSheet: "HPP CENTRAL OKTOBER 26",
    parsedAt: new Date().toISOString(),
    totalMenu: HPP_CENTRAL_OKT_DATA.length,
    expectedTotal: 58,
    stats: {
      totalMenu: HPP_CENTRAL_OKT_DATA.length,
      expectedTotal: 58,
      isComplete: HPP_CENTRAL_OKT_DATA.length === 58
    },
    data: HPP_CENTRAL_OKT_DATA
  };
}

/**
 * Mencari data menu di HPP Central berdasarkan kata kunci pencarian.
 * Digunakan langsung di Menu 07 dan fitur pembanding lainnya.
 * query: string (nama menu / preparation, case-insensitive)
 */
function searchHppCentralMenu(query) {
  var dataset = getHppCentralOktData();
  var list = dataset.data || [];
  if (!query || !String(query).trim()) {
    return {
      query: "",
      totalMatches: list.length,
      matches: list
    };
  }

  var q = String(query).trim().toLowerCase();
  var matches = list.filter(function (it) {
    var name = String(it.preparation || "").toLowerCase();
    return name.indexOf(q) !== -1;
  });

  return {
    query: query,
    totalMatches: matches.length,
    matches: matches
  };
}

/**
 * Membuat kode Apps Script (.gs) dari hasil scan data HPP Central.
 * Format ini hemat token dan langsung siap digunakan sebagai file .gs.
 */
function generateHppCentralOktDataGsCode_(payload) {
  var dataArr = payload.data || [];
  var lines = [];

  lines.push("/**");
  lines.push(" * ============================================================================");
  lines.push(" * DATA BACKEND: HPP_CENTRAL_OKT_DATA.gs");
  lines.push(" * Sumber: " + (payload.sourceSheet || "HPP CENTRAL OKTOBER 26"));
  lines.push(" * Total Menu: " + dataArr.length + " / 58 Preparation");
  lines.push(" * Timestamp: " + (payload.parsedAt || new Date().toISOString()));
  lines.push(" * ============================================================================");
  lines.push(" */");
  lines.push("");
  lines.push("var HPP_CENTRAL_OKT_DATA = " + JSON.stringify(dataArr, null, 2) + ";");
  lines.push("");
  lines.push("function getHppCentralOktData() {");
  lines.push("  return {");
  lines.push("    sourceSheet: " + JSON.stringify(payload.sourceSheet || "HPP CENTRAL OKTOBER 26") + ",");
  lines.push("    parsedAt: " + JSON.stringify(payload.parsedAt || new Date().toISOString()) + ",");
  lines.push("    totalMenu: " + dataArr.length + ",");
  lines.push("    expectedTotal: 58,");
  lines.push("    data: HPP_CENTRAL_OKT_DATA");
  lines.push("  };");
  lines.push("}");

  return lines.join("\n");
}

