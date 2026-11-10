const fs = require('fs');
const vm = require('vm');

const dpContent = fs.readFileSync('02-data-pembanding/DataPembanding.gs', 'utf8');
const pView = fs.readFileSync('03-sidebar-ui/PembandingView.html', 'utf8');
const rView = fs.readFileSync('03-sidebar-ui/ReplaceHppView.html', 'utf8');

// Fake DOM
const elements = {};
function fakeEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      value: "",
      textContent: "",
      innerHTML: "",
      className: "",
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      disabled: false,
      checked: true
    };
  }
  return elements[id];
}

const doc = {
  getElementById: (id) => fakeEl(id),
  querySelectorAll: () => []
};

const ctx = vm.createContext({
  console: console,
  document: doc,
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

// Run DataPembanding.gs
vm.runInContext(dpContent, ctx);

// Run PembandingView.html script
const pScript = pView.substring(pView.indexOf('<script>') + 8, pView.lastIndexOf('</script>'));
vm.runInContext(pScript, ctx);

// Run ReplaceHppView.html script
const rScript = rView.substring(rView.indexOf('<script>') + 8, rView.lastIndexOf('</script>'));
vm.runInContext(rScript, ctx);

// Initialize presets and normalize ref items
const presets = ctx.getBuiltInReferenceDatasets();
let combined = [];
presets.forEach(p => p.data.forEach(r => combined.push(r)));
ctx.normalizedRefItems = ctx.normalizeInventoryItems(combined);
ctx.availableJsonPresets = presets;

console.log('Normalized items loaded:', ctx.normalizedRefItems.length);

// Call initReplaceHppView
ctx.initReplaceHppView();

// Test loadSample14RowsRecipeHpp
ctx.loadSample14RowsRecipeHpp();

console.log('Candidates generated:', ctx.repHppCandidateList.length);
ctx.repHppCandidateList.forEach(c => {
  console.log(`[${c.cellAddress}] ${c.bahan} -> Ref: ${c.matchedItemName} | Lama: ${c.oldPrice} -> Baru: ${c.newPrice} | Delta: ${c.delta} | Replace? ${c.canReplace}`);
});

