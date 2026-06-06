const fs = require('fs');
const path = require('path');

const NEW_API_URL = 'https://hopital-mce-site.onrender.com';

const srcDir = path.join(__dirname, 'src');

// Liste des routes qui doivent être préfixées par /api/
const routesToFix = [
  'etablissement', 'staff', 'actualites', 'partenaires', 'specialties',
  'events', 'paiement/config', 'site-content/footer', 'tarifs',
  'newsletter/subscribers', 'doctors', 'availabilities', 'appointments',
  'checkup-requests', 'upload', 'messages', 'stats', 'jobs'
];

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
  let originalContent = content;
  let modified = false;

  // 1. Remplacer les URLs absolues locales
  content = content.replace(/http:\/\/localhost:3000/g, NEW_API_URL);
  content = content.replace(/http:\/\/localhost:5000/g, NEW_API_URL);
  content = content.replace(/https:\/\/late-water-4f06\.blandinelamadekota\.workers\.dev/g, NEW_API_URL);
  
  // 2. Remplacer les chemins relatifs comme '/etablissement' par 'https://.../api/etablissement'
  // On évite ceux qui commencent déjà par /api/ ou /uploads/
  for (const route of routesToFix) {
    // Pattern pour capturer '/route' dans les chaînes (guillemets ou apostrophes)
    const regex = new RegExp(`(['"\`])\/(${route})(['"\`])`, 'g');
    content = content.replace(regex, `$1${NEW_API_URL}/api/$2$3`);
  }

  // 3. Cas général : tout chemin commençant par '/' et ne contenant pas 'api' ni 'uploads'
  //    et qui n'est pas un fichier avec extension
  content = content.replace(/(['"\`])\/([^'"`]*?)(['"\`])/g, (match, p1, p2, p3) => {
    // Ignorer si c'est déjà /api/ ou /uploads/
    if (p2.startsWith('api/') || p2.startsWith('uploads/')) return match;
    // Ignorer les fichiers avec extension (images, js, css...)
    if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|pdf|css|js|json)$/i.test(p2)) return match;
    // Sinon, remplacer par l'URL complète avec /api/
    return `${p1}${NEW_API_URL}/api/${p2}${p3}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modifié : ${filePath}`);
  }
}

console.log('🔄 Recherche des URLs dans src/...');
walkDir(srcDir, replaceUrls);
console.log('🎉 Terminé. Exécute maintenant "npm run build".');