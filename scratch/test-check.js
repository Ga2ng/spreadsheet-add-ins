const fs = require('fs');

// Baca Code.gs
const codeGs = fs.readFileSync('01-code-backend/Code.gs', 'utf8');

console.log('Code.gs length:', codeGs.length);

