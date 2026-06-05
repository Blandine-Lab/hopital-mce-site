const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Choisissez un emplacement pour la base de données SQLite
// Par exemple, à la racine du backend
const dbPath = path.join(__dirname, 'mce.db');
const db = new sqlite3.Database(dbPath);

module.exports = db;