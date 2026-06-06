const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  // Supprime les lignes "const API_BASE = ..." (avec divers guillemets)
  content = content.replace(/^const API_BASE\s*=\s*["'].*?["'];?\s*$/gm, '');
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Nettoyé : ${path.relative(srcDir, filePath)}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.jsx$/.test(entry.name)) {
      cleanFile(fullPath);
    }
  }
}

console.log('🧹 Suppression des déclarations locales API_BASE...');
walkDir(srcDir);
console.log('🎉 Terminé. Lancez maintenant "npm run build".');