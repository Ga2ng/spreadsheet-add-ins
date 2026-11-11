/**
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
 * 1. Menu 02 (Pembanding HPP): Muncul sebagai pilihan dataset "Outlet: ${payload.outletName}"
 * 2. Menu 05 (Pembanding HPP Outlet): Sebagai data pembanding harga outlet
 * 3. Menu 06 (Replace Data): Sebagai acuan pencocokan & replace bahan
 * ============================================================================
 */

var DATA_INVENTORY_OUTLET = {
  outletName: "CIAMSO SBY",
  periode: "OKTOBER 2026",
  sourceSheet: "INVENTORY CIAMSO SBY OKT",
  updatedAt: "2026-11-11",
  totalItems: 116,
  items: [
  {
    "id": "out-1",
    "name": "AYAM CHARSIU (PER VACUM @5 PORSI)",
    "unit": "PORSI",
    "price": 13814,
    "qty": null
  },
  {
    "id": "out-2",
    "name": "AYAM CHARSIU (PROMO) (PER VACUM @10 PORSI)",
    "unit": "PORSI",
    "price": 5112,
    "qty": null
  },
  {
    "id": "out-3",
    "name": "AYAM GRILL (PER VACUM @10 PORSI)",
    "unit": "PORSI",
    "price": 5674,
    "qty": null
  },
  {
    "id": "out-4",
    "name": "AYAM HAINAN (PER VACUM @8 PORSI)",
    "unit": "PORSI",
    "price": 10842,
    "qty": null
  },
  {
    "id": "out-5",
    "name": "AYAM JAMUR SHITAKE @90 GRAM/PORSI",
    "unit": "PORSI",
    "price": 8908,
    "qty": null
  },
  {
    "id": "out-6",
    "name": "AYAM SECHUAN @90 GRAM/PORSI",
    "unit": "PORSI",
    "price": 8843,
    "qty": null
  },
  {
    "id": "out-7",
    "name": "AYAM UNGKEP (PROMO) (PER VACUM @5 PORSI)",
    "unit": "PORSI",
    "price": 11968,
    "qty": null
  },
  {
    "id": "out-8",
    "name": "AYAM UNGKEP WIP (PER VACUM @8 PORSI)",
    "unit": "PORSI",
    "price": 7922,
    "qty": null
  },
  {
    "id": "out-9",
    "name": "BAWANG BOMBAY",
    "unit": "GRAM",
    "price": 35,
    "qty": null
  },
  {
    "id": "out-10",
    "name": "BAWANG MERAH GORENG @1.000 GR/ PACK",
    "unit": "GRAM",
    "price": 116,
    "qty": null
  },
  {
    "id": "out-11",
    "name": "BAWANG MERAH KUPAS",
    "unit": "GRAM",
    "price": 32,
    "qty": null
  },
  {
    "id": "out-12",
    "name": "BAWANG PRE",
    "unit": "GRAM",
    "price": 40,
    "qty": null
  },
  {
    "id": "out-13",
    "name": "BAWANG PUTIH GORENG @1.000GR/ PACK",
    "unit": "GRAM",
    "price": 105,
    "qty": null
  },
  {
    "id": "out-14",
    "name": "BAWANG PUTIH KUPAS",
    "unit": "GRAM",
    "price": 38,
    "qty": null
  },
  {
    "id": "out-15",
    "name": "BEEF SECHUAN @90 GRAM/PORSI",
    "unit": "PORSI",
    "price": 17275,
    "qty": null
  },
  {
    "id": "out-16",
    "name": "BEEF TRUFFLE NEW @50 GRAM/PORSI",
    "unit": "PORSI",
    "price": 10297,
    "qty": null
  },
  {
    "id": "out-17",
    "name": "BERAS @25.000 GR/ SAK",
    "unit": "GRAM",
    "price": 17,
    "qty": null
  },
  {
    "id": "out-18",
    "name": "BLACKPAPER GROUND @1.000 GR/ PACK",
    "unit": "GRAM",
    "price": 177,
    "qty": null
  },
  {
    "id": "out-19",
    "name": "BLACKPAPER SAUCE @35 GRAM/PORSI",
    "unit": "PORSI",
    "price": 1757,
    "qty": null
  },
  {
    "id": "out-20",
    "name": "BUMBU RACIK AYAM (@26GR/ PCS)",
    "unit": "PCS",
    "price": 2200,
    "qty": null
  },
  {
    "id": "out-21",
    "name": "CABE HIJAU BESAR",
    "unit": "GRAM",
    "price": 24,
    "qty": null
  },
  {
    "id": "out-22",
    "name": "CABE IJO BOTOL / JAPLAK",
    "unit": "GRAM",
    "price": 60,
    "qty": null
  },
  {
    "id": "out-23",
    "name": "CABE MERAH BESAR",
    "unit": "GRAM",
    "price": 44,
    "qty": null
  },
  {
    "id": "out-24",
    "name": "CABE RAWIT",
    "unit": "GRAM",
    "price": 60,
    "qty": null
  },
  {
    "id": "out-25",
    "name": "CHILI OIL @1.000 ML",
    "unit": "ML",
    "price": 31,
    "qty": null
  },
  {
    "id": "out-26",
    "name": "CHILI POWDER @1000 GR/ PACK",
    "unit": "GRAM",
    "price": 62,
    "qty": null
  },
  {
    "id": "out-27",
    "name": "CHILI SAUCE @5500 GR/ JIRIGEN",
    "unit": "GRAM",
    "price": 14,
    "qty": null
  },
  {
    "id": "out-28",
    "name": "COOKING CREAM @1000ML/ PACK",
    "unit": "ML",
    "price": 70,
    "qty": null
  },
  {
    "id": "out-29",
    "name": "CUKA @80 ML/BOTOL",
    "unit": "ML",
    "price": 63,
    "qty": null
  },
  {
    "id": "out-30",
    "name": "CURRY BLOCK @220GR/@44PORSI/PACK",
    "unit": "PORSI",
    "price": 1813,
    "qty": null
  },
  {
    "id": "out-31",
    "name": "DAGING LADA HITAM @40 GRAM/PORSI",
    "unit": "PORSI",
    "price": 8012,
    "qty": null
  },
  {
    "id": "out-32",
    "name": "DAUN BAWANG",
    "unit": "GRAM",
    "price": 30,
    "qty": null
  },
  {
    "id": "out-33",
    "name": "DAUN CARY @100 GRAM/PACK",
    "unit": "GRAM",
    "price": 150,
    "qty": null
  },
  {
    "id": "out-34",
    "name": "DAUN PISANG",
    "unit": "GRAM",
    "price": 16,
    "qty": null
  },
  {
    "id": "out-35",
    "name": "DAUN SALAM",
    "unit": "GRAM",
    "price": 67,
    "qty": null
  },
  {
    "id": "out-36",
    "name": "FF STRAICUT @2000GR/PACK",
    "unit": "GRAM",
    "price": 27,
    "qty": null
  },
  {
    "id": "out-37",
    "name": "FILLET DADA @25 GRAM/PORSI",
    "unit": "PORSI",
    "price": 1771,
    "qty": null
  },
  {
    "id": "out-38",
    "name": "GARAM @1000GR/PACK",
    "unit": "GRAM",
    "price": 21,
    "qty": null
  },
  {
    "id": "out-39",
    "name": "GOHYONG @5 PCS/PORSI",
    "unit": "PORSI",
    "price": 6839,
    "qty": null
  },
  {
    "id": "out-40",
    "name": "GULA PASIR CENTRAL @1000GR/PACK",
    "unit": "GRAM",
    "price": 18,
    "qty": null
  },
  {
    "id": "out-41",
    "name": "GYOZA @3PCS/PORSI",
    "unit": "PORSI",
    "price": 7875,
    "qty": null
  },
  {
    "id": "out-42",
    "name": "HAIR CAP @100PCS/PACK",
    "unit": "PACK",
    "price": 38500,
    "qty": null
  },
  {
    "id": "out-43",
    "name": "KECAP ASIN @600 ML/BOTOL",
    "unit": "ML",
    "price": 71,
    "qty": null
  },
  {
    "id": "out-44",
    "name": "KECAP IKAN @620 ML/BOTOL",
    "unit": "ML",
    "price": 55,
    "qty": null
  },
  {
    "id": "out-45",
    "name": "KECAP MANIS 5,7 KG @5.700 GRAM/JRG",
    "unit": "GRAM",
    "price": 27,
    "qty": null
  },
  {
    "id": "out-46",
    "name": "KEMIRI",
    "unit": "GRAM",
    "price": 58,
    "qty": null
  },
  {
    "id": "out-47",
    "name": "KERONGKONGAN",
    "unit": "GRAM",
    "price": 8,
    "qty": null
  },
  {
    "id": "out-48",
    "name": "KERTAS DIMSUM @500 PCS @PACK",
    "unit": "PCS",
    "price": 132,
    "qty": null
  },
  {
    "id": "out-49",
    "name": "KERUPUK",
    "unit": "PORSI",
    "price": 1050,
    "qty": null
  },
  {
    "id": "out-50",
    "name": "KNORR @1000 GR/PACK",
    "unit": "GRAM",
    "price": 99,
    "qty": null
  },
  {
    "id": "out-51",
    "name": "KRESEK CHILLER",
    "unit": "PACK",
    "price": 10450,
    "qty": null
  },
  {
    "id": "out-52",
    "name": "KULIT PANGSIT @20 PCS/PACK",
    "unit": "PCS",
    "price": 394,
    "qty": null
  },
  {
    "id": "out-53",
    "name": "KWETIAUW (@450 GR/PACK) @150 GR/PORSI",
    "unit": "GRAM",
    "price": 19,
    "qty": null
  },
  {
    "id": "out-54",
    "name": "LADA PUTIH @1000 GR/PACK",
    "unit": "GRAM",
    "price": 108,
    "qty": null
  },
  {
    "id": "out-55",
    "name": "MAYONAISE @1000 GR/PACK",
    "unit": "GRAM",
    "price": 28,
    "qty": null
  },
  {
    "id": "out-56",
    "name": "MIE @12 PORSI/PACK",
    "unit": "PORSI",
    "price": 1225,
    "qty": null
  },
  {
    "id": "out-57",
    "name": "MIE KERING GANDUM (@131 GRAM/PACK) @2 PORSI/PACK",
    "unit": "PORSI",
    "price": 2363,
    "qty": null
  },
  {
    "id": "out-58",
    "name": "MIE KERITING @12 PORSI/PACK",
    "unit": "PORSI",
    "price": 1619,
    "qty": null
  },
  {
    "id": "out-59",
    "name": "MINYAK AYAM @1000 ML/PACK",
    "unit": "ML",
    "price": 40,
    "qty": null
  },
  {
    "id": "out-60",
    "name": "MINYAK GORENG (@12.000 ML/CART) @1.000 ML/BOTOL",
    "unit": "ML",
    "price": 21,
    "qty": null
  },
  {
    "id": "out-61",
    "name": "MINYAK WIJEN @620 ML / BOTOL",
    "unit": "ML",
    "price": 78,
    "qty": null
  },
  {
    "id": "out-62",
    "name": "MIX VEGETABLE  (@1000 GR/PACK) (@30 GRAM/PORSI)",
    "unit": "GRAM",
    "price": 60,
    "qty": null
  },
  {
    "id": "out-63",
    "name": "PACKING DUCK WIP @5 SLICE/PORSI",
    "unit": "PORSI",
    "price": 19829,
    "qty": null
  },
  {
    "id": "out-64",
    "name": "PAO (@33 PCS /PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2864,
    "qty": null
  },
  {
    "id": "out-65",
    "name": "PISANG COKLAT (@10 PCS/PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2100,
    "qty": null
  },
  {
    "id": "out-66",
    "name": "PLASTIK 1 KG",
    "unit": "PACK",
    "price": 4400,
    "qty": null
  },
  {
    "id": "out-67",
    "name": "PLASTIK 1/2KG",
    "unit": "PACK",
    "price": 3300,
    "qty": null
  },
  {
    "id": "out-68",
    "name": "POHONG KREZZ @2 PORSI / PACK",
    "unit": "PORSI",
    "price": 5500,
    "qty": null
  },
  {
    "id": "out-69",
    "name": "POKCOY",
    "unit": "GRAM",
    "price": 12,
    "qty": null
  },
  {
    "id": "out-70",
    "name": "PONTIANAK SAUCE @40 GRAM/PORSI",
    "unit": "PORSI",
    "price": 1229,
    "qty": null
  },
  {
    "id": "out-71",
    "name": "PREMIX BAWANG @25 GRAM/PORSI",
    "unit": "PORSI",
    "price": 1831,
    "qty": null
  },
  {
    "id": "out-72",
    "name": "PREMIX KUAH KALDU @75 PORSI/PACK",
    "unit": "PORSI",
    "price": 649,
    "qty": null
  },
  {
    "id": "out-73",
    "name": "PREMIX MIE",
    "unit": "PORSI",
    "price": 1991,
    "qty": null
  },
  {
    "id": "out-74",
    "name": "PREMIX NASGOR",
    "unit": "PORSI",
    "price": 1133,
    "qty": null
  },
  {
    "id": "out-75",
    "name": "PREMIX NASI @130 GRAM/PACK (@4,33 GRAM/PORSI)",
    "unit": "PACK",
    "price": 7552,
    "qty": null
  },
  {
    "id": "out-76",
    "name": "RAJA RASA @600 ML/BOTOL",
    "unit": "ML",
    "price": 70,
    "qty": null
  },
  {
    "id": "out-77",
    "name": "RBC/CHICKEN KARAAGE/CHICKEN FILLET @90 GRAM/PORSI",
    "unit": "PORSI",
    "price": 7895.5,
    "qty": null
  },
  {
    "id": "out-78",
    "name": "SAMBAL BAWANG",
    "unit": "PORSI",
    "price": 602,
    "qty": null
  },
  {
    "id": "out-79",
    "name": "SAMBAL IJO",
    "unit": "PORSI",
    "price": 906,
    "qty": null
  },
  {
    "id": "out-80",
    "name": "SAMBAL TERASI @20 GRAM/PORSI",
    "unit": "PORSI",
    "price": 2517,
    "qty": null
  },
  {
    "id": "out-81",
    "name": "SANTAN @1000 ML/PACK",
    "unit": "ML",
    "price": 75,
    "qty": null
  },
  {
    "id": "out-82",
    "name": "SAUCE TOMAT (RIMBARIA) @500 GR/BOTOL",
    "unit": "GRAM",
    "price": 34,
    "qty": null
  },
  {
    "id": "out-83",
    "name": "SAWI",
    "unit": "GRAM",
    "price": 20,
    "qty": null
  },
  {
    "id": "out-84",
    "name": "SIOMAY AYAM (@25 PCS /PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-85",
    "name": "SIOMAY CRABSTICK (@25 PCS/PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-86",
    "name": "SIOMAY MOZARELLA (@25 PCS/PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-87",
    "name": "SIOMAY PEDAS (@25 PCS/PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-88",
    "name": "SUMPIT BAMBU WIGO",
    "unit": "PACK",
    "price": 7150,
    "qty": null
  },
  {
    "id": "out-89",
    "name": "TAHU SUTRA",
    "unit": "PORSI",
    "price": 400,
    "qty": null
  },
  {
    "id": "out-90",
    "name": "TELUR ASIN",
    "unit": "PCS",
    "price": 4725,
    "qty": null
  },
  {
    "id": "out-91",
    "name": "TELUR AYAM KAMPUNG",
    "unit": "PCS",
    "price": 3150,
    "qty": null
  },
  {
    "id": "out-92",
    "name": "TELUR AYAM KITCHEN",
    "unit": "PCS",
    "price": 1477,
    "qty": null
  },
  {
    "id": "out-93",
    "name": "TELUR PITAN @4 PORSI/PCS",
    "unit": "PORSI",
    "price": 2750,
    "qty": null
  },
  {
    "id": "out-94",
    "name": "TEMPE @10 PORSI / PAPAN",
    "unit": "PORSI",
    "price": 450,
    "qty": null
  },
  {
    "id": "out-95",
    "name": "TEPUNG TERIGU @1000 GR/PACK",
    "unit": "GRAM",
    "price": 14,
    "qty": null
  },
  {
    "id": "out-96",
    "name": "TERASI @20PCS/RENTENG",
    "unit": "PCS",
    "price": 468,
    "qty": null
  },
  {
    "id": "out-97",
    "name": "TERI KACANG @20 GRAM/PORSI",
    "unit": "PORSI",
    "price": 1583,
    "qty": null
  },
  {
    "id": "out-98",
    "name": "THINWALL 500ML @25 PCS/SLOP",
    "unit": "PCS",
    "price": 924,
    "qty": null
  },
  {
    "id": "out-99",
    "name": "THINWALL 750ML @25 PCS/SLOP",
    "unit": "PCS",
    "price": 1496,
    "qty": null
  },
  {
    "id": "out-100",
    "name": "TIM TAHU (@25 PCS/PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-101",
    "name": "TIMUN",
    "unit": "GRAM",
    "price": 12,
    "qty": null
  },
  {
    "id": "out-102",
    "name": "TIRAM PANDA (@770 ML/BOTOL)",
    "unit": "ML",
    "price": 74,
    "qty": null
  },
  {
    "id": "out-103",
    "name": "TOGE PANJANG",
    "unit": "GRAM",
    "price": 14,
    "qty": null
  },
  {
    "id": "out-104",
    "name": "TOMAT & TOMAT HIJAU",
    "unit": "GRAM",
    "price": 20,
    "qty": null
  },
  {
    "id": "out-105",
    "name": "TOMATO SAUCE (@25 SACHET/PACK)",
    "unit": "SACHET",
    "price": 221,
    "qty": null
  },
  {
    "id": "out-106",
    "name": "TOMATO SAUCE @5500 GRAM/JERIGEN",
    "unit": "GRAM",
    "price": 14,
    "qty": null
  },
  {
    "id": "out-107",
    "name": "TOPPING MIE AYAM @50 GR/PORSI",
    "unit": "PORSI",
    "price": 4601,
    "qty": null
  },
  {
    "id": "out-108",
    "name": "TOPPING NASGOR (3 SLICE FISHCAKE & 10 SLICE BAKSO IKAN/PORSI)",
    "unit": "PORSI",
    "price": 2351,
    "qty": null
  },
  {
    "id": "out-109",
    "name": "UDANG FRESH (@500 GR/PACK) @50 GR/PORSI",
    "unit": "GRAM",
    "price": 80,
    "qty": null
  },
  {
    "id": "out-110",
    "name": "UDANG KEJU (@25 PCS /PACK) @3 PCS/PORSI",
    "unit": "PCS",
    "price": 2835,
    "qty": null
  },
  {
    "id": "out-111",
    "name": "VITZIN (@1000GR / PACK)",
    "unit": "GRAM",
    "price": 49,
    "qty": null
  },
  {
    "id": "out-112",
    "name": "WAGYU (SANTORI) @100 GR/PORSI",
    "unit": "PORSI",
    "price": 25282,
    "qty": null
  },
  {
    "id": "out-113",
    "name": "WIJEN (@1000 GR/PACK)",
    "unit": "GRAM",
    "price": 70,
    "qty": null
  },
  {
    "id": "out-114",
    "name": "WONTON @25 PCS/PACK",
    "unit": "PCS",
    "price": 2258,
    "qty": null
  },
  {
    "id": "out-115",
    "name": "WORTEL",
    "unit": "GRAM",
    "price": 20,
    "qty": null
  },
  {
    "id": "out-116",
    "name": "WRAPPING ROLL",
    "unit": "ROLL",
    "price": 151250,
    "qty": null
  }
]
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

  return 'var DATA_INVENTORY_OUTLET = {\n' +
    '  outletName: ' + JSON.stringify(oName) + ',\n' +
    '  periode: ' + JSON.stringify(sPeriod) + ',\n' +
    '  sourceSheet: ' + JSON.stringify(sSheet) + ',\n' +
    '  updatedAt: ' + JSON.stringify(sDate) + ',\n' +
    '  totalItems: ' + payload.items.length + ',\n' +
    '  items: ' + jsonStr + '\n' +
    '};\n';
}
