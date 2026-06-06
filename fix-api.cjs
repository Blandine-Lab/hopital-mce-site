// fix-api.cjs - à exécuter avec node fix-api.cjs
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'https://hopital-mce-site.onrender.com/api';
const srcDir = path.join(__dirname, 'src');

// Créer config.js s'il n'existe pas
const configPath = path.join(srcDir, 'config.js');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, `export const API_BASE = '${API_BASE}';\n`);
  console.log('✅ config.js créé');
} else {
  let configContent = fs.readFileSync(configPath, 'utf8');
  if (!configContent.includes("export const API_BASE")) {
    configContent = `export const API_BASE = '${API_BASE}';\n` + configContent;
    fs.writeFileSync(configPath, configContent);
    console.log('✅ config.js mis à jour');
  } else {
    console.log('✅ config.js existe déjà');
  }
}

// Expression pour détecter les URLs erronées dans les fetch
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // 1. Remplacer les concaténations du genre: API_BASE + "https://hopital-mce-site.onrender.com/api/xxx"
  content = content.replace(/API_BASE\s*\+\s*["']https:\/\/hopital-mce-site\.onrender\.com\/api\/([^"']*)["']/g, (match, p1) => {
    return `API_BASE + "/${p1}"`;
  });
  
  // 2. Remplacer les URLs absolues mal écrites (sans API_BASE)
  content = content.replace(/fetch\(["']https:\/\/hopital-mce-site\.onrender\.com\/(?!api)([^"']*)["']/g, (match, p1) => {
    return `fetch(\`\${API_BASE}/${p1}\`)`;
  });
  content = content.replace(/fetch\(["']https:\/\/hopital-mce-site\.onrender\.com\/api\/([^"']*)["']/g, (match, p1) => {
    return `fetch(\`\${API_BASE}/${p1}\`)`;
  });
  
  // 3. Remplacer les chemins relatifs comme '/etablissement' (s'ils sont seuls)
  // Évite ceux qui sont déjà préfixés par API_BASE ou qui contiennent des points (fichiers statiques)
  content = content.replace(/fetch\(["']\/(?!api\/|uploads\/|.*\.)([^"']*)["']\)/g, (match, p1) => {
    return `fetch(\`\${API_BASE}/${p1}\`)`;
  });
  
  // 4. Vérifier si le fichier utilise API_BASE mais ne l'importe pas
  const hasApiBase = content.includes('API_BASE');
  const hasImport = content.includes("import { API_BASE } from '../config'");
  if (hasApiBase && !hasImport && !filePath.includes('config.js')) {
    // Ajouter l'import en haut du fichier (après les autres imports)
    const importLine = "import { API_BASE } from '../config';\n";
    if (content.startsWith('import')) {
      // Trouver la fin du bloc d'imports
      const lines = content.split('\n');
      let lastImportIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import')) lastImportIndex = i;
      }
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
    } else {
      content = importLine + content;
    }
    console.log(`📝 Import ajouté dans ${path.basename(filePath)}`);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modifié : ${path.relative(srcDir, filePath)}`);
  } else {
    console.log(`⏩ Inchangé : ${path.relative(srcDir, filePath)}`);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jsx|js)$/.test(entry.name) && !entry.name.includes('config.js')) {
      processFile(fullPath);
    }
  }
}

console.log('🔧 Correction des appels API...');
walkDir(srcDir);
console.log('🎉 Terminé. Lancez "npm run build" puis redéployez.');