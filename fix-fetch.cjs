const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://hopital-mce-site.onrender.com/api';
const srcDir = path.join(__dirname, 'src');

// Expression régulière pour capturer les fetch avec des URLs problématiques
const fetchPattern = /fetch\(\s*([`'"])((?:\/|\/\/|https?:\/\/[^\/]+\/)(?:[^`'"]*?))\1\s*\)/g;

function transformUrl(url) {
  // Si c'est déjà l'URL complète ou relative avec /api, on garde mais on remplace par variable
  if (url.startsWith('https://hopital-mce-site.onrender.com/api')) {
    const relativePath = url.replace('https://hopital-mce-site.onrender.com/api', '');
    return `${API_BASE_URL}${relativePath}`;
  }
  if (url.startsWith('/api/')) {
    return `${API_BASE_URL}${url}`;
  }
  // Routes simples comme /etablissement, /staff, etc.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${API_BASE_URL}${url}`;
  }
  return null;
}

function needsImport(content) {
  return content.includes('API_BASE_URL') && !content.includes("import { API_BASE_URL } from '../config'");
}

function addImport(content) {
  const importLine = "import { API_BASE_URL } from '../config';\n";
  // Ajoute après le dernier import ou en début de fichier
  const importRegex = /^import .+?;?\n/gm;
  let lastImport = null;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    lastImport = match.index + match[0].length;
  }
  if (lastImport) {
    return content.slice(0, lastImport) + importLine + content.slice(lastImport);
  } else {
    return importLine + content;
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let newContent = content.replace(fetchPattern, (match, quote, url) => {
    const newUrl = transformUrl(url);
    if (newUrl && newUrl !== url) {
      modified = true;
      return `fetch(\`${newUrl}\`)`;
    }
    return match;
  });
  if (modified && needsImport(newContent)) {
    newContent = addImport(newContent);
    console.log(`✅ Ajouté import et modifié : ${filePath}`);
  } else if (modified) {
    console.log(`✅ Modifié : ${filePath}`);
  } else {
    console.log(`⏩ Inchangé : ${filePath}`);
  }
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.jsx$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

console.log('🔧 Recherche et remplacement des fetch...');
walkDir(srcDir);
console.log('🎉 Terminé. Lancez maintenant "npm run build".');