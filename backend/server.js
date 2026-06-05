// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const basicAuth = require('express-basic-auth');
const db = require('./database');
const multer = require('multer');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORT DES FONCTIONS MAILER
const { sendConfirmation, sendNewsletterEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ========== Configuration Telegram ==========
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
let bot = null;
if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    console.log('🤖 Bot Telegram actif');
} else {
    console.warn('⚠️ Telegram non configuré (token ou chatId manquant)');
}
async function sendTelegramNotification(title, details, chatId = null) {
    if (!bot) return;
    const targetChatId = chatId || TELEGRAM_CHAT_ID;
    try {
        await bot.sendMessage(targetChatId, `🔔 *${title}*\n\n${details}`, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Erreur Telegram:', err.message);
    }
}

// ========== Configuration multer pour l'upload d'images et CV ==========
const uploadDir = path.join(__dirname, 'frontend', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const cvUploadDir = path.join(__dirname, 'frontend', 'uploads', 'cv');
if (!fs.existsSync(cvUploadDir)) fs.mkdirSync(cvUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'actu-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    else cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier uploadé' });
    res.json({ imageUrl: '/uploads/' + req.file.filename });
});

const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, cvUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'cv-' + uniqueSuffix + ext);
    }
});
const cvUpload = multer({ storage: cvStorage, limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/upload/cv', cvUpload.single('cv'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier CV uploadé' });
    res.json({ cvUrl: '/uploads/cv/' + req.file.filename });
});

// ========== Authentification ==========
const SECRET_KEY = 'mce_secret_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Non authentifié' });
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
}

// ========== Création des tables ==========
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        profession TEXT NOT NULL,
        specialty TEXT,
        department TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        photo_url TEXT,
        password TEXT NOT NULL,
        telegram_chat_id TEXT,
        is_active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS newsletter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        recipient_count INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS availabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER,
        date TEXT,
        time_slot TEXT,
        is_booked INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        email TEXT,
        phone TEXT,
        specialty TEXT,
        date TEXT,
        time TEXT,
        message TEXT,
        doctor_id INTEGER,
        teleconsultation_link TEXT,
        reminder_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        patient_id INTEGER,
        admin_viewed INTEGER DEFAULT 0,
        doctor_viewed INTEGER DEFAULT 0,
        teleconsultation_validated INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS actualites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        ordre INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS site_contents (
        page TEXT,
        key TEXT,
        value TEXT,
        PRIMARY KEY (page, key)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS job_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department TEXT,
        contract_type TEXT,
        location TEXT,
        description TEXT,
        requirements TEXT,
        salary_range TEXT,
        active INTEGER DEFAULT 1,
        posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        deadline TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        job_title TEXT,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT,
        cv_url TEXT,
        applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS specialties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        ordre INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_type TEXT,
        sender_id INTEGER,
        sender_name TEXT,
        receiver_type TEXT,
        receiver_id INTEGER,
        receiver_name TEXT,
        subject TEXT,
        message TEXT,
        reply_to_id INTEGER,
        is_read INTEGER DEFAULT 0,
        sent_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS etablissement_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titre TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        ordre INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS partenaires (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        commentaire TEXT,
        ordre INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS paiements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        montant REAL NOT NULL,
        methode TEXT NOT NULL,
        telephone TEXT,
        email_client TEXT,
        nom_client TEXT,
        statut TEXT DEFAULT 'en_attente',
        code_confirmation TEXT,
        date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
        facture_url TEXT,
        appointment_id INTEGER
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS config_paiement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cle TEXT UNIQUE NOT NULL,
        valeur TEXT NOT NULL
    )`);
    db.run(`INSERT OR IGNORE INTO config_paiement (cle, valeur) VALUES 
        ('iban', 'FR76 1234 5678 9012 3456 7890 123'),
        ('bic', 'BNPAFRPP'),
        ('titulaire', 'Medical Center Elizabeth'),
        ('mobile_money_info', 'Orange Money : 01 23 45 67 89 / MTN : 05 67 89 12 34'),
        ('carte_info', 'Paiement sécurisé par carte bancaire (Visa/Mastercard)')
    `);
    db.run(`CREATE TABLE IF NOT EXISTS tarifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL,
        prestation TEXT NOT NULL,
        prix TEXT NOT NULL,
        description TEXT,
        ordre INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS resultats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        type TEXT,
        description TEXT,
        file_url TEXT,
        is_published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        published_at DATETIME,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Ajout des colonnes manquantes pour les anciennes bases
    db.run(`ALTER TABLE appointments ADD COLUMN admin_viewed INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
    });
    db.run(`ALTER TABLE appointments ADD COLUMN doctor_viewed INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.error(err);
    });
    db.run(`ALTER TABLE staff ADD COLUMN telegram_chat_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('telegram_chat_id existe déjà');
    });
    db.run(`ALTER TABLE patients ADD COLUMN is_active INTEGER DEFAULT 1`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('is_active déjà présente');
        else console.log('✅ Colonne is_active ajoutée à patients');
    });
    db.run(`ALTER TABLE appointments ADD COLUMN teleconsultation_validated INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('teleconsultation_validated déjà présente');
        else console.log('✅ Colonne teleconsultation_validated ajoutée aux rendez-vous');
    });
    db.run(`ALTER TABLE appointments ADD COLUMN is_paid INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('is_paid déjà présente');
        else console.log('✅ Colonne is_paid ajoutée aux rendez-vous');
    });
    db.run(`ALTER TABLE appointments ADD COLUMN facture_url TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('facture_url déjà présente');
        else console.log('✅ Colonne facture_url ajoutée aux rendez-vous');
    });
    db.run(`ALTER TABLE paiements ADD COLUMN appointment_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) console.log('appointment_id déjà présente');
        else console.log('✅ Colonne appointment_id ajoutée aux paiements');
    });

    console.log('✅ Toutes les tables sont vérifiées/créées');
});

// Ajout de colonnes supplémentaires si absentes
db.run(`ALTER TABLE applications ADD COLUMN cv_url TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('✅ Colonne cv_url vérifiée/ajoutée');
});
db.run(`ALTER TABLE job_offers ADD COLUMN deadline TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.log('deadline existe déjà');
    else console.log('✅ Colonne deadline ajoutée');
});
db.run(`ALTER TABLE appointments ADD COLUMN patient_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.log('patient_id existe déjà');
    else console.log('✅ Colonne patient_id ajoutée aux rendez-vous');
});

// ========== Routes API ==========

// Newsletter
app.get('/api/newsletter/count', (req, res) => {
    db.get(`SELECT COUNT(*) as count FROM newsletter WHERE is_active = 1`, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row ? row.count : 0 });
    });
});
app.get('/api/newsletter/export', (req, res) => {
    db.all(`SELECT email FROM newsletter WHERE is_active = 1`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ emails: rows.map(r => r.email) });
    });
});
app.get('/api/newsletter/subscribers', (req, res) => {
    db.all(`SELECT id, email, subscribed_at, is_active FROM newsletter ORDER BY subscribed_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return res.status(400).json({ error: 'Email invalide' });
    db.run(`INSERT OR IGNORE INTO newsletter (email) VALUES (?)`, [email], function(err) {
        if (err) return res.status(500).json({ error: 'Erreur serveur' });
        if (this.changes === 0) return res.status(409).json({ error: 'Cet email est déjà inscrit' });
        res.json({ success: true, message: 'Inscription réussie !' });
    });
});
app.post('/api/newsletter/send', async (req, res) => {
    const { subject, content } = req.body;
    if (!subject || !content) return res.status(400).json({ error: 'Sujet et contenu requis' });
    db.all(`SELECT email FROM newsletter WHERE is_active = 1`, [], async (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur base de données' });
        const emails = rows.map(r => r.email);
        if (emails.length === 0) return res.status(400).json({ error: 'Aucun abonné' });
        let successCount = 0, errorCount = 0;
        for (const email of emails) {
            try {
                await sendNewsletterEmail(email, subject, content);
                successCount++;
            } catch (e) {
                errorCount++;
            }
        }
        db.run(`INSERT INTO newsletter_campaigns (subject, content, recipient_count) VALUES (?, ?, ?)`, [subject, content, successCount]);
        res.json({ success: true, total: emails.length, successCount, errorCount });
    });
});

// Spécialités
app.get('/api/specialties', (req, res) => {
    db.all(`SELECT * FROM specialties ORDER BY ordre ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/specialties', (req, res) => {
    const { name, description, ordre, active } = req.body;
    if (!name) return res.status(400).json({ error: "Nom requis" });
    db.run(`INSERT INTO specialties (name, description, ordre, active) VALUES (?, ?, ?, ?)`,
        [name, description || null, ordre || 0, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/specialties/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, ordre, active } = req.body;
    db.run(`UPDATE specialties SET name=?, description=?, ordre=?, active=? WHERE id=?`,
        [name, description, ordre, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Spécialité modifiée" });
        });
});
app.delete('/api/specialties/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM specialties WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Spécialité supprimée" });
    });
});

// Actualités
app.get('/api/actualites', (req, res) => {
    db.all(`SELECT * FROM actualites ORDER BY ordre ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/actualites', (req, res) => {
    const { titre, description, image_url, ordre, active } = req.body;
    if (!titre || !description) return res.status(400).json({ error: "Titre et description requis" });
    db.run(`INSERT INTO actualites (titre, description, image_url, ordre, active) VALUES (?, ?, ?, ?, ?)`,
        [titre, description, image_url || null, ordre || 0, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/actualites/:id', (req, res) => {
    const { id } = req.params;
    const { titre, description, image_url, ordre, active } = req.body;
    db.run(`UPDATE actualites SET titre=?, description=?, image_url=?, ordre=?, active=? WHERE id=?`,
        [titre, description, image_url, ordre, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Actualité modifiée" });
        });
});
app.delete('/api/actualites/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM actualites WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Actualité supprimée" });
    });
});

// Authentification admin
app.use('/admin', basicAuth({ users: { 'admin': 'nexus2026' }, challenge: true, realm: 'Acces reserve a l administration' }));

// Fichiers statiques
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'frontend/uploads')));
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// Liste des médecins (depuis staff)
app.get('/api/doctors', (req, res) => {
    db.all("SELECT id, full_name as name, specialty FROM staff WHERE profession = 'Médecin' AND is_active = 1", (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur interne" });
        res.json(rows);
    });
});

// ========== Disponibilités ==========
app.get('/api/availability/:doctorId/:date', (req, res) => {
    const { doctorId, date } = req.params;
    db.all(`SELECT time_slot FROM availabilities WHERE doctor_id = ? AND date = ? AND is_booked = 0`, [doctorId, date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.time_slot));
    });
});

app.get('/api/availabilities/calendar', (req, res) => {
    db.all(`
        SELECT a.*, s.full_name as doctor_name 
        FROM availabilities a 
        JOIN staff s ON a.doctor_id = s.id 
        WHERE s.profession = 'Médecin' 
        ORDER BY a.date, a.doctor_id
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/availabilities', (req, res) => {
    const { doctor_id, date, time_slot } = req.body;
    if (!doctor_id || !date || !time_slot) return res.status(400).json({ error: "Champs manquants" });
    db.get(`SELECT id FROM staff WHERE id = ? AND profession = 'Médecin' AND is_active = 1`, [doctor_id], (err, staffRow) => {
        if (err || !staffRow) return res.status(400).json({ error: "Médecin invalide" });
        db.run(`INSERT OR IGNORE INTO availabilities (doctor_id, date, time_slot, is_booked) VALUES (?, ?, ?, 0)`, 
            [doctor_id, date, time_slot], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Créneau ajouté", id: this.lastID });
            });
    });
});

app.delete('/api/availabilities/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT is_booked FROM availabilities WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Non trouvé" });
        if (row.is_booked === 1) return res.status(409).json({ error: "Créneau déjà réservé" });
        db.run(`DELETE FROM availabilities WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Créneau supprimé" });
        });
    });
});

// ========== Rendez-vous (public) ==========
app.post('/api/appointments',
    body('fullname').notEmpty().withMessage('Nom requis').trim().escape(),
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('phone').optional().isString().withMessage('Téléphone invalide'),
    body('date').isDate().withMessage('Date invalide'),
    body('time').notEmpty().withMessage('Créneau requis'),
    body('specialty').optional().trim(),
    body('doctorId').optional().isInt(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        const { fullname, email, phone, specialty, date, time, message, doctorId } = req.body;
        const docId = doctorId || 1;
        const checkSlot = `SELECT id FROM availabilities WHERE doctor_id = ? AND date = ? AND time_slot = ? AND is_booked = 0`;
        db.get(checkSlot, [docId, date, time], (err, slot) => {
            if (err) return res.status(500).json({ error: "Erreur vérification" });
            if (!slot) return res.status(409).json({ error: "Créneau non disponible" });
            db.run(`UPDATE availabilities SET is_booked = 1 WHERE id = ?`, [slot.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "Erreur réservation" });
                const roomName = `Medical Center Elizabeth-rdv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const teleconsultationLink = `https://meet.jit.si/${roomName}`;
                db.get(`SELECT id FROM patients WHERE email = ?`, [email], (errPatient, patientRow) => {
                    const patientId = patientRow ? patientRow.id : null;
                    const insertSql = `INSERT INTO appointments (fullname, email, phone, specialty, date, time, message, doctor_id, teleconsultation_link, patient_id, teleconsultation_validated) VALUES (?,?,?,?,?,?,?,?,?,?,0)`;
                    db.run(insertSql, [fullname, email, phone, specialty, date, time, message, docId, teleconsultationLink, patientId], async function(insertErr) {
                        if (insertErr) {
                            console.error('Erreur insertion rendez-vous:', insertErr);
                            return res.status(500).json({ error: "Erreur enregistrement" });
                        }
                        sendConfirmation(email, fullname, date, time, specialty, teleconsultationLink).catch(console.error);
                        await sendTelegramNotification('📅 Nouveau rendez-vous', `👤 Patient: ${fullname}\n📧 Email: ${email}\n📅 Date: ${date} à ${time}\n👨‍⚕️ Médecin ID: ${docId}\n🔗 Lien visio: ${teleconsultationLink}`);
                        db.get(`SELECT telegram_chat_id FROM staff WHERE id = ? AND profession = 'Médecin'`, [docId], (err, doctor) => {
                            if (!err && doctor && doctor.telegram_chat_id) {
                                sendTelegramNotification('📅 Nouveau rendez-vous patient', `👤 ${fullname}\n📅 ${date} à ${time}\n🔗 Lien visio: ${teleconsultationLink}`, doctor.telegram_chat_id);
                            }
                        });
                        res.status(201).json({ message: "Rendez-vous enregistré avec succès", id: this.lastID, teleconsultationLink });
                    });
                });
            });
        });
    });

// Récupération de tous les rendez-vous (admin)
app.get('/api/appointments', (req, res) => {
    db.all(`
        SELECT a.*, s.full_name as doctor_name, a.admin_viewed, a.doctor_viewed, a.teleconsultation_validated
        FROM appointments a 
        LEFT JOIN staff s ON a.doctor_id = s.id 
        ORDER BY a.date DESC, a.time DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { fullname, email, phone, specialty, date, time, message, doctor_id } = req.body;
    db.run(`UPDATE appointments SET fullname=?, email=?, phone=?, specialty=?, date=?, time=?, message=?, doctor_id=? WHERE id=?`,
        [fullname, email, phone, specialty, date, time, message, doctor_id, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Rendez-vous modifié", changes: this.changes });
        });
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT doctor_id, date, time FROM appointments WHERE id=?`, [id], (err, app) => {
        if (err || !app) return res.status(404).json({ error: "Rendez-vous non trouvé" });
        db.run(`DELETE FROM appointments WHERE id=?`, [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`UPDATE availabilities SET is_booked=0 WHERE doctor_id=? AND date=? AND time_slot=?`, [app.doctor_id, app.date, app.time], (updateErr) => {
                if (updateErr) console.error(updateErr);
                res.json({ message: "Rendez-vous supprimé" });
            });
        });
    });
});

app.put('/api/admin/appointments/:id/view', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE appointments SET admin_viewed = 1 WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ========== VALIDATION TÉLÉCONSULTATION (admin) ==========
app.put('/api/admin/appointments/:id/validate-teleconsultation', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE appointments SET teleconsultation_validated = 1 WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        res.json({ success: true, message: 'Téléconsultation validée' });
    });
});

// ========== Espace Médecin ==========
app.post('/api/doctor/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    db.get(`SELECT * FROM staff WHERE email = ? AND profession = 'Médecin' AND is_active = 1`, [email], (err, doctor) => {
        if (err || !doctor) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        if (!bcrypt.compareSync(password, doctor.password)) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const token = jwt.sign(
            { id: doctor.id, type: 'doctor', name: doctor.full_name, profession: doctor.profession },
            SECRET_KEY,
            { expiresIn: '7d' }
        );
        res.json({ success: true, token, doctor: { id: doctor.id, name: doctor.full_name, specialty: doctor.specialty, email: doctor.email } });
    });
});

app.get('/api/doctor/appointments', authenticateToken, (req, res) => {
    if (req.user.type !== 'doctor') return res.status(403).json({ error: 'Accès réservé aux médecins' });
    const doctorId = req.user.id;
    db.all(`
        SELECT a.*, s.full_name as doctor_name, a.admin_viewed, a.doctor_viewed, a.teleconsultation_validated
        FROM appointments a
        LEFT JOIN staff s ON a.doctor_id = s.id
        WHERE a.doctor_id = ?
        ORDER BY a.date DESC, a.time DESC
    `, [doctorId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/doctor/appointments/:id/view', authenticateToken, (req, res) => {
    if (req.user.type !== 'doctor') return res.status(403).json({ error: 'Accès réservé aux médecins' });
    const { id } = req.params;
    const doctorId = req.user.id;
    db.get(`SELECT id FROM appointments WHERE id = ? AND doctor_id = ?`, [id, doctorId], (err, app) => {
        if (err || !app) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        db.run(`UPDATE appointments SET doctor_viewed = 1 WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Rendez-vous marqué comme vu' });
        });
    });
});

// Statistiques
app.get('/api/stats', (req, res) => {
    db.get(`SELECT COUNT(*) as total FROM appointments`, [], (err, total) => {
        if (err) return res.status(500).json({ error: err });
        db.all(`SELECT date, COUNT(*) as nb FROM appointments GROUP BY date ORDER BY date`, (err, perDay) => {
            if (err) return res.status(500).json({ error: err });
            db.all(`SELECT s.full_name as name, COUNT(a.id) as nb FROM staff s LEFT JOIN appointments a ON s.id = a.doctor_id WHERE s.profession = 'Médecin' GROUP BY s.id`, (err, perDoctor) => {
                if (err) return res.status(500).json({ error: err });
                res.json({ total: total.total, perDay, perDoctor });
            });
        });
    });
});

// Événements
app.get('/api/events', (req, res) => {
    db.all(`SELECT * FROM events ORDER BY start_date DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/events', (req, res) => {
    const { title, description, start_date, end_date, active } = req.body;
    if (!title) return res.status(400).json({ error: "Titre requis" });
    db.run(`INSERT INTO events (title, description, start_date, end_date, active) VALUES (?,?,?,?,?)`,
        [title, description || null, start_date || null, end_date || null, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.delete('/api/events/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM events WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Événement supprimé" });
    });
});

// Contenu du site
app.get('/api/site-content/:page', (req, res) => {
    const page = req.params.page;
    db.all(`SELECT key, value FROM site_contents WHERE page = ?`, [page], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const content = {};
        rows.forEach(row => content[row.key] = row.value);
        res.json(content);
    });
});
app.put('/api/site-content/:page', (req, res) => {
    const page = req.params.page;
    const updates = req.body;
    if (typeof updates !== 'object') return res.status(400).json({ error: "Format invalide" });
    const queries = Object.entries(updates).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR REPLACE INTO site_contents (page, key, value) VALUES (?, ?, ?)`, [page, key, String(value)], err => err ? reject(err) : resolve());
        });
    });
    Promise.all(queries).then(() => res.json({ success: true })).catch(err => res.status(500).json({ error: err.message }));
});

// Offres d'emploi (public)
app.get('/api/jobs', (req, res) => {
    db.all('SELECT * FROM job_offers WHERE active = 1 ORDER BY posted_date DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});
app.get('/api/jobs/:id', (req, res) => {
    db.get('SELECT * FROM job_offers WHERE id = ? AND active = 1', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Offre non trouvée' });
        res.json(row);
    });
});

// Candidatures
app.post('/api/applications', (req, res) => {
    const { jobId, jobTitle, fullName, email, phone, message, cvUrl } = req.body;
    console.log('📥 Candidature reçue:', { jobId, jobTitle, fullName, email });
    db.run(`INSERT INTO applications (job_id, job_title, full_name, email, phone, message, cv_url, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [jobId, jobTitle, fullName, email, phone || '', message || '', cvUrl || null],
        async function(err) {
            if (err) {
                console.error('❌ Erreur insertion:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log(`✅ Nouvelle candidature pour ${jobTitle} - ${fullName}`);
            console.log('📤 Envoi Telegram...');
            try {
                await sendTelegramNotification(
                    '📄 Nouvelle candidature reçue',
                    `📋 Poste : ${jobTitle}\n👤 Candidat : ${fullName}\n📧 Email : ${email}\n📝 Message : ${message?.substring(0, 200) || 'Aucun message'}\n📎 CV : ${cvUrl || 'Non fourni'}`
                );
                console.log('✅ Telegram envoyé');
            } catch (telegramErr) {
                console.error('❌ Erreur Telegram:', telegramErr);
            }
            res.json({ success: true, id: this.lastID, message: 'Candidature envoyée avec succès' });
        });
});

// Admin - offres d'emploi
app.get('/api/admin/jobs', (req, res) => {
    db.all(`SELECT * FROM job_offers ORDER BY posted_date DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});
app.post('/api/admin/jobs', (req, res) => {
    const { title, department, contract_type, location, description, requirements, salary_range, active, deadline } = req.body;
    if (!title || !department || !contract_type || !location || !description || !requirements) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    db.run(
        `INSERT INTO job_offers (title, department, contract_type, location, description, requirements, salary_range, active, deadline) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, department, contract_type, location, description, requirements, salary_range || null, active !== undefined ? active : 1, deadline || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID, message: 'Offre ajoutée avec succès' });
        });
});
app.put('/api/admin/jobs/:id', (req, res) => {
    const { id } = req.params;
    const { title, department, contract_type, location, description, requirements, salary_range, active, deadline } = req.body;
    db.run(
        `UPDATE job_offers SET title=?, department=?, contract_type=?, location=?, description=?, requirements=?, salary_range=?, active=?, deadline=? WHERE id=?`,
        [title, department, contract_type, location, description, requirements, salary_range, active, deadline, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Offre modifiée avec succès' });
        });
});
app.delete('/api/admin/jobs/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM job_offers WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Offre supprimée avec succès' });
    });
});

// Admin - candidatures
app.get('/api/admin/applications', (req, res) => {
    db.all(`SELECT * FROM applications ORDER BY applied_date DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Personnel (staff)
app.get('/api/staff', (req, res) => {
    const { search, profession, department } = req.query;
    let query = `SELECT * FROM staff WHERE is_active = 1`;
    let params = [];
    if (search) { query += ` AND (full_name LIKE ? OR profession LIKE ? OR specialty LIKE ? OR department LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }
    if (profession) { query += ` AND profession = ?`; params.push(profession); }
    if (department) { query += ` AND department = ?`; params.push(department); }
    query += ` ORDER BY profession, full_name`;
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});
app.get('/api/staff/professions', (req, res) => {
    db.all('SELECT DISTINCT profession FROM staff WHERE is_active = 1 ORDER BY profession', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.profession));
    });
});
app.get('/api/staff/departments', (req, res) => {
    db.all('SELECT DISTINCT department FROM staff WHERE is_active = 1 ORDER BY department', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.department));
    });
});
app.get('/api/staff/:id', (req, res) => {
    db.get('SELECT * FROM staff WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Personnel non trouvé' });
        res.json(row);
    });
});
app.post('/api/staff', (req, res) => {
    const { full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id } = req.body;
    if (!full_name || !profession || !department || !email || !password) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO staff (full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [full_name, profession, specialty || null, department, email, phone || null, photo_url || null, hashedPassword, telegram_chat_id || null], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/staff/:id', (req, res) => {
    const { full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id, is_active } = req.body;
    let sql = `UPDATE staff SET full_name=?, profession=?, specialty=?, department=?, email=?, phone=?, photo_url=?, telegram_chat_id=?, is_active=?`;
    let params = [full_name, profession, specialty || null, department, email, phone || null, photo_url || null, telegram_chat_id || null, is_active !== undefined ? is_active : 1];
    if (password && password.trim()) {
        params.push(bcrypt.hashSync(password, 10));
        sql += `, password=?`;
    }
    sql += ` WHERE id=?`;
    params.push(req.params.id);
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
app.delete('/api/staff/:id', (req, res) => {
    db.run('DELETE FROM staff WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Personnel supprimé' });
    });
});

// Messagerie
app.post('/api/messages', async (req, res) => {
    const { sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id } = req.body;
    if (!sender_type || sender_id === undefined || !sender_name || !receiver_type || receiver_id === undefined || !subject || !message)
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    db.run(`INSERT INTO messages (sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id || null],
        async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            await sendTelegramNotification('📬 Nouveau message patient', `👤 De : ${sender_name}\n✉️ Sujet : ${subject}\n💬 Message : ${message.substring(0, 200)}${message.length > 200 ? '…' : ''}`);
            res.json({ success: true, id: this.lastID, message: 'Message envoyé avec succès' });
        });
});
app.get('/api/messages/:type/:id', (req, res) => {
    const { type, id } = req.params;
    db.all(`SELECT * FROM messages WHERE (sender_type = ? AND sender_id = ?) OR (receiver_type = ? AND receiver_id = ?) ORDER BY sent_date DESC`,
        [type, id, type, id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        });
});
app.put('/api/messages/:id/read', (req, res) => {
    db.run(`UPDATE messages SET is_read = 1 WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});
app.get('/api/messages/unread/:type/:id', (req, res) => {
    const { type, id } = req.params;
    db.get(`SELECT COUNT(*) as count FROM messages WHERE receiver_type = ? AND receiver_id = ? AND is_read = 0`, [type, id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ unread: row?.count || 0 });
    });
});
app.post('/api/messages/:id/reply', (req, res) => {
    const { id } = req.params;
    const { message, sender_name, sender_id, sender_type } = req.body;
    db.get(`SELECT * FROM messages WHERE id = ?`, [id], (err, original) => {
        if (err || !original) return res.status(404).json({ error: 'Message original non trouvé' });
        db.run(`INSERT INTO messages (sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sender_type, sender_id, sender_name, original.sender_type, original.sender_id, original.sender_name, `RE: ${original.subject}`, message, id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, message: 'Réponse envoyée' });
            });
    });
});

// ========== ESPACE PATIENT ==========
app.get('/api/patients', (req, res) => {
    db.all(`SELECT id, first_name, last_name, email FROM patients WHERE is_active = 1 ORDER BY last_name`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patient/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM patients WHERE email = ? AND is_active = 1`, [email], (err, patient) => {
        if (err || !patient) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        if (!bcrypt.compareSync(password, patient.password)) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const token = jwt.sign(
            { id: patient.id, type: 'patient', name: `${patient.first_name} ${patient.last_name}` },
            SECRET_KEY,
            { expiresIn: '7d' }
        );
        res.json({ success: true, token, patient: { id: patient.id, name: `${patient.first_name} ${patient.last_name}`, email: patient.email } });
    });
});

app.post('/api/patient/register', async (req, res) => {
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error: 'Prénom, nom, email et mot de passe requis' });
    }
    db.get(`SELECT id FROM patients WHERE email = ?`, [email], async (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run(`INSERT INTO patients (first_name, last_name, email, password, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [first_name, last_name, email, hashedPassword, phone || null],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`INSERT OR IGNORE INTO newsletter (email) VALUES (?)`, [email]);
                const token = jwt.sign(
                    { id: this.lastID, type: 'patient', name: `${first_name} ${last_name}` },
                    SECRET_KEY,
                    { expiresIn: '7d' }
                );
                res.status(201).json({ success: true, token, patient: { id: this.lastID, name: `${first_name} ${last_name}`, email } });
            });
    });
});

// MODIFICATION : Ajout de is_paid et facture_url dans la sélection
app.get('/api/patient/appointments', authenticateToken, (req, res) => {
    const patientId = req.user.id;
    db.all(`
        SELECT a.*, s.full_name as doctor_name, a.teleconsultation_validated, a.is_paid, a.facture_url
        FROM appointments a 
        LEFT JOIN staff s ON a.doctor_id = s.id 
        WHERE a.patient_id = ? 
        ORDER BY a.date DESC, a.time DESC
    `, [patientId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/patient/results', authenticateToken, (req, res) => {
    const patientId = req.user.id;
    db.all(`
        SELECT id, type, description, file_url, published_at
        FROM resultats 
        WHERE patient_id = ? AND is_published = 1 
        ORDER BY published_at DESC
    `, [patientId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/admin/results/pending', (req, res) => {
    db.all(`
        SELECT r.*, p.first_name, p.last_name, p.email 
        FROM resultats r 
        JOIN patients p ON r.patient_id = p.id 
        WHERE r.is_published = 0 
        ORDER BY r.created_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/admin/results/:id/publish', (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE resultats SET is_published = 1, published_at = CURRENT_TIMESTAMP WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/admin/results', (req, res) => {
    const { patient_id, type, description, file_url } = req.body;
    if (!patient_id || !type) {
        return res.status(400).json({ error: 'patient_id et type requis' });
    }
    db.run(`INSERT INTO resultats (patient_id, type, description, file_url, is_published) VALUES (?, ?, ?, ?, 0)`,
        [patient_id, type, description || null, file_url || null], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

app.get('/api/admin/patients', (req, res) => {
    db.all(`SELECT id, first_name, last_name, email, phone, created_at, is_active FROM patients ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT id, first_name, last_name, email, phone, created_at, is_active FROM patients WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Patient non trouvé' });
        res.json(row);
    });
});

app.post('/api/admin/patients', (req, res) => {
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error: 'Prénom, nom, email et mot de passe requis' });
    }
    db.get(`SELECT id FROM patients WHERE email = ?`, [email], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing) return res.status(409).json({ error: 'Cet email existe déjà' });
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run(`INSERT INTO patients (first_name, last_name, email, password, phone, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
            [first_name, last_name, email, hashedPassword, phone || null],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`INSERT OR IGNORE INTO newsletter (email) VALUES (?)`, [email]);
                res.status(201).json({ success: true, id: this.lastID });
            });
    });
});

app.put('/api/admin/patients/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, phone, password, is_active } = req.body;
    let sql = `UPDATE patients SET first_name=?, last_name=?, email=?, phone=?, is_active=?`;
    let params = [first_name, last_name, email, phone || null, is_active !== undefined ? is_active : 1];
    if (password && password.trim()) {
        params.push(bcrypt.hashSync(password, 10));
        sql += `, password=?`;
    }
    sql += ` WHERE id=?`;
    params.push(id);
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/admin/patients/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM patients WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// API Établissement
app.get('/api/etablissement', (req, res) => {
    db.all(`SELECT * FROM etablissement_photos ORDER BY ordre ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/etablissement', (req, res) => {
    const { titre, description, image_url, ordre, active } = req.body;
    if (!titre || !image_url) return res.status(400).json({ error: "Titre et image requis" });
    db.run(`INSERT INTO etablissement_photos (titre, description, image_url, ordre, active) VALUES (?, ?, ?, ?, ?)`,
        [titre, description || null, image_url, ordre || 0, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/etablissement/:id', (req, res) => {
    const { id } = req.params;
    const { titre, description, image_url, ordre, active } = req.body;
    db.run(`UPDATE etablissement_photos SET titre=?, description=?, image_url=?, ordre=?, active=? WHERE id=?`,
        [titre, description, image_url, ordre, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Photo modifiée" });
        });
});
app.delete('/api/etablissement/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM etablissement_photos WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Photo supprimée" });
    });
});

// API Partenaires
app.get('/api/partenaires', (req, res) => {
    db.all(`SELECT * FROM partenaires ORDER BY ordre ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/partenaires', (req, res) => {
    const { nom, description, image_url, commentaire, ordre, active } = req.body;
    if (!nom || !image_url) return res.status(400).json({ error: "Nom et image requis" });
    db.run(`INSERT INTO partenaires (nom, description, image_url, commentaire, ordre, active) VALUES (?, ?, ?, ?, ?, ?)`,
        [nom, description || null, image_url, commentaire || null, ordre || 0, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/partenaires/:id', (req, res) => {
    const { id } = req.params;
    const { nom, description, image_url, commentaire, ordre, active } = req.body;
    db.run(`UPDATE partenaires SET nom=?, description=?, image_url=?, commentaire=?, ordre=?, active=? WHERE id=?`,
        [nom, description, image_url, commentaire, ordre, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Partenaire modifié" });
        });
});
app.delete('/api/partenaires/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM partenaires WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Partenaire supprimé" });
    });
});

// API Paiements (simulation)
app.get('/api/paiement/config', (req, res) => {
    db.all(`SELECT cle, valeur FROM config_paiement`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const config = {};
        rows.forEach(row => config[row.cle] = row.valeur);
        res.json(config);
    });
});
app.put('/api/paiement/config', (req, res) => {
    const updates = req.body;
    const queries = Object.entries(updates).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR REPLACE INTO config_paiement (cle, valeur) VALUES (?, ?)`, [key, String(value)], err => err ? reject(err) : resolve());
        });
    });
    Promise.all(queries).then(() => res.json({ success: true })).catch(err => res.status(500).json({ error: err.message }));
});
app.post('/api/paiement/initier', async (req, res) => {
    const { montant, methode, telephone, email, nom } = req.body;
    if (!montant || !methode) return res.status(400).json({ error: 'Montant et méthode requis' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.run(`INSERT INTO paiements (montant, methode, telephone, email_client, nom_client, code_confirmation, statut) VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`,
        [montant, methode, telephone || null, email || null, nom || null, code], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            sendTelegramNotification('💳 Nouveau paiement initié', `ID: ${this.lastID}\nMontant: ${montant}€\nMéthode: ${methode}\nClient: ${nom || 'Anonyme'}`);
            res.json({ id: this.lastID, code, message: 'Paiement initié. Utilisez le code pour confirmer (simulation).' });
        });
});

// MODIFICATION : Lier le paiement au rendez-vous et mettre à jour la facture
app.post('/api/paiement/confirmer/:id', (req, res) => {
    const { id } = req.params;
    const { code } = req.body;
    db.get(`SELECT * FROM paiements WHERE id = ? AND code_confirmation = ?`, [id, code], (err, paiement) => {
        if (err || !paiement) return res.status(404).json({ error: 'Paiement ou code invalide' });
        if (paiement.statut !== 'en_attente') return res.status(400).json({ error: 'Déjà traité' });
        db.run(`UPDATE paiements SET statut = 'confirme', date_paiement = CURRENT_TIMESTAMP WHERE id = ?`, [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const factureUrl = `/factures/${id}.pdf`;
            db.run(`UPDATE paiements SET facture_url = ? WHERE id = ?`, [factureUrl, id]);
            sendTelegramNotification('✅ Paiement confirmé', `ID: ${id}\nMontant: ${paiement.montant}€\nClient: ${paiement.nom_client || 'Anonyme'}\nCode: ${code}`);
            
            // Lier la facture au rendez-vous si un appointment_id existe
            if (paiement.appointment_id) {
                db.run(`UPDATE appointments SET is_paid = 1, facture_url = ? WHERE id = ?`, [factureUrl, paiement.appointment_id]);
            }
            res.json({ success: true, facture_url: factureUrl, code });
        });
    });
});

app.get('/api/paiements', (req, res) => {
    db.all(`SELECT * FROM paiements ORDER BY date_paiement DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}
app.get('/factures/:id.pdf', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM paiements WHERE id = ?`, [id], (err, paiement) => {
        if (err || !paiement) return res.status(404).send('Facture non trouvée');
        const factureHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture MCE</title>
            <style>body{font-family: Arial; padding:20px;} h1{color:#0b6e8f;}</style></head>
            <body><div><h1>Medical Center Elizabeth (MCE)</h1><h2>Facture n° MCE-${paiement.id}</h2>
            <p><strong>Client :</strong> ${escapeHtml(paiement.nom_client || 'Anonyme')} (${escapeHtml(paiement.email_client || 'non renseigné')})</p>
            <p><strong>Montant :</strong> ${paiement.montant} €</p>
            <p><strong>Méthode :</strong> ${paiement.methode === 'mobile_money' ? 'Mobile Money' : 'Carte bancaire'}</p>
            <p><strong>Date :</strong> ${paiement.date_paiement}</p>
            <p><strong>Code :</strong> ${paiement.code_confirmation}</p><hr>
            <p>Medical Center Elizabeth - 33 Avenue de l'Innovation, Paris 75012</p></div></body></html>`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="facture_${paiement.id}.html"`);
        res.send(factureHtml);
    });
});

// API Tarifs
app.get('/api/tarifs', (req, res) => {
    db.all(`SELECT * FROM tarifs ORDER BY ordre ASC, service ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/tarifs', (req, res) => {
    const { service, prestation, prix, description, ordre, active } = req.body;
    if (!service || !prestation || !prix) return res.status(400).json({ error: 'Service, prestation et prix requis' });
    db.run(`INSERT INTO tarifs (service, prestation, prix, description, ordre, active) VALUES (?, ?, ?, ?, ?, ?)`,
        [service, prestation, prix, description || null, ordre || 0, active !== undefined ? active : 1], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});
app.put('/api/tarifs/:id', (req, res) => {
    const { id } = req.params;
    const { service, prestation, prix, description, ordre, active } = req.body;
    db.run(`UPDATE tarifs SET service=?, prestation=?, prix=?, description=?, ordre=?, active=? WHERE id=?`,
        [service, prestation, prix, description, ordre, active, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Tarif modifié" });
        });
});
app.delete('/api/tarifs/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM tarifs WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Tarif supprimé" });
    });
});

// ========== NOUVELLE ROUTE : Paiement patient pour un rendez-vous ==========
app.post('/api/patient/appointments/:id/pay', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') {
        return res.status(403).json({ error: 'Accès réservé aux patients' });
    }
    const appointmentId = req.params.id;
    const patientId = req.user.id;

    db.get(`SELECT * FROM appointments WHERE id = ? AND patient_id = ?`, [appointmentId, patientId], (err, appointment) => {
        if (err || !appointment) {
            return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        }
        if (appointment.is_paid) {
            return res.status(400).json({ error: 'Ce rendez-vous est déjà payé' });
        }

        // Montant fixe (vous pouvez adapter selon la spécialité ou les tarifs)
        const montant = 30.00;
        const methode = 'carte';
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        db.run(`INSERT INTO paiements (montant, methode, email_client, nom_client, code_confirmation, statut, appointment_id)
                VALUES (?, ?, ?, ?, ?, 'en_attente', ?)`,
            [montant, methode, appointment.email, appointment.fullname, code, appointmentId],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, id: this.lastID, code, montant });
            });
    });
});

// ========== Route de test Telegram ==========
app.get('/api/test-telegram', async (req, res) => {
    try {
        await sendTelegramNotification('Test MCE', 'Ceci est un message de test depuis le backend.');
        res.json({ success: true, message: 'Message envoyé' });
    } catch (err) {
        console.error('Erreur lors de l\'envoi:', err);
        res.status(500).json({ error: err.message });
    }
});
// Enregistrement des demandes de check-up
app.post('/api/checkup-requests', (req, res) => {
    const { fullname, email, phone, checkupType, date, timeSlot, message } = req.body;
    if (!fullname || !email || !phone || !date) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    // Ici vous pouvez stocker dans une table `checkup_requests` ou envoyer un email.
    // Pour l'instant, on simule un succès.
    console.log('Demande check-up reçue :', { fullname, email, phone, checkupType, date, timeSlot, message });
    res.json({ success: true, message: 'Demande enregistrée' });
});

// ========== 404 ==========
app.use((req, res) => {
    res.status(404).json({ error: "Route non trouvée" });
});

// ========== Démarrage ==========
app.listen(PORT, () => {
    console.log(`🏥 Medical Center Elizabeth (MCE) – http://localhost:${PORT}`);
});