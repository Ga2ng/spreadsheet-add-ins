const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('.');
const dataDir = path.join(rootDir, '02-data-pembanding');
const historyDir = path.join(dataDir, 'history');

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

function getTimestampSuffix(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${MM}${dd}-${HH}${mm}${ss}`;
}

const ts = getTimestampSuffix();
console.log('Testing history copy with ts:', ts);

// Cek file yang ada di 02-data-pembanding
const filesToBackup = ['DataPembanding.gs', 'central-kitchen.json', 'central-storage.json'];
filesToBackup.forEach(f => {
  const src = path.join(dataDir, f);
  if (fs.existsSync(src)) {
    const ext = path.extname(f);
    const base = path.basename(f, ext);
    const dest = path.join(historyDir, `${base}_${ts}${ext}`);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${f} -> history/${base}_${ts}${ext}`);
  }
});

const historyFiles = fs.readdirSync(historyDir);
console.log('Files currently in history folder:', historyFiles);

