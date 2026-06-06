// update-api-url.js
const fs = require('fs');
const path = require('path');

const NEW_API_URL = 'https://hopital-mce-site.onrender.com';

const oldPatterns = [
  'http://localhost:3000',
  'http://localhost:5000',
  '/api',
  'https://late-water-4f06.blandinelamadekota.workers.dev',
  'https://*.workers.dev',
];

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      callback(fullPath);
    }
  }
}

function replaceUrls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  oldPatterns.forEach(pattern => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(['"\`])${escaped}(/?)`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${NEW_API_URL}$2`);
      modified = true;
    }
  });

  const relativeRegex = /(['"\`])\/(api|admin|login|register|patients|doctors|appointments|messages)(\/?['"\`])/g;
  if (relativeRegex.test(content)) {
    content = content.replace(relativeRegex, (match, p1, p2, p3) => {
      return `${p1}${NEW_API_URL}/${p2}${p3}`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modifié : ${filePath}`);
  }
}

console.log('🔄 Recherche des URLs...');
walkDir(srcDir, replaceUrls);
console.log('🎉 Terminé. Exécute maintenant "npm run build".');