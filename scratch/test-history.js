const fs = require('fs');
const path = require('path');

function getTimestampString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}-${HH}${mm}${ss}`;
}

const dataDir = path.resolve('02-data-pembanding');
const historyDir = path.join(dataDir, 'history');

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

console.log('Timestamp:', getTimestampString());
console.log('History dir created:', historyDir);

