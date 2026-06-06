// backend/server.js
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';
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
const cloudinary = require('cloudinary').v2;

// IMPORT DES FONCTIONS MAILER
const { sendConfirmation, sendNewsletterEmail } = require('./mailer');

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    // === RÉPONSES AUTOMATIQUES ===
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "👋 Bonjour ! Je suis l'assistant du Medical Center Elizabeth. Posez-moi une question ou utilisez /help pour voir les commandes.");
    });
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "Commandes disponibles :\n/start - Accueil\n/contact - Nous contacter\n/rdv - Prendre rendez-vous\n/site - Lien vers notre site web");
    });
    bot.onText(/\/contact/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "📞 Vous pouvez nous joindre par email à contact@medicalcenterelizabeth.fr ou par téléphone au +243 992 952 038.");
    });
    bot.onText(/\/rdv/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "📅 Pour prendre rendez-vous, utilisez notre formulaire en ligne : https://hopital-mce-site.onrender.com/#appointment");
    });
    bot.onText(/\/site/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "🌐 Notre site web : https://hopital-mce-site.onrender.com");
    });
    // Réponse générique à tout message texte (hors commandes)
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (text && !text.startsWith('/')) {
            bot.sendMessage(chatId, "✅ Merci pour votre message. Un conseiller vous répondra dans les plus brefs délais. En attendant, vous pouvez consulter notre site ou utiliser /help.");
        }
    });
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

// ========== Configuration multer pour upload temporaire (avant Cloudinary) ==========
const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'upload-' + uniqueSuffix + ext);
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

// Route d'upload vers Cloudinary (images)
app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'hopital-mce' });
        fs.unlink(req.file.path, (err) => err && console.error(err));
        res.json({ imageUrl: result.secure_url });
    } catch (err) {
        console.error('Erreur Cloudinary:', err);
        res.status(500).json({ error: 'Erreur lors de l\'upload vers le cloud' });
    }
});

// Upload CV vers Cloudinary
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'cv-' + uniqueSuffix + ext);
    }
});
const cvUpload = multer({ storage: cvStorage, limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/upload/cv', cvUpload.single('cv'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier CV uploadé' });
    try {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'hopital-mce/cv',
            resource_type: 'auto'
        });
        fs.unlink(req.file.path, (err) => err && console.error(err));
        res.json({ cvUrl: result.secure_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur upload CV' });
    }
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

// ========== Création des tables (PostgreSQL) ==========
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
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
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS newsletter (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS newsletter_campaigns (
                id SERIAL PRIMARY KEY,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                recipient_count INTEGER
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS doctors (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                specialty TEXT NOT NULL
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS availabilities (
                id SERIAL PRIMARY KEY,
                doctor_id INTEGER,
                date TEXT,
                time_slot TEXT,
                is_booked INTEGER DEFAULT 0
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                patient_id INTEGER,
                admin_viewed INTEGER DEFAULT 0,
                doctor_viewed INTEGER DEFAULT 0,
                teleconsultation_validated INTEGER DEFAULT 0
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS actualites (
                id SERIAL PRIMARY KEY,
                titre TEXT NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT,
                ordre INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                start_date TEXT,
                end_date TEXT,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS site_contents (
                page TEXT,
                key TEXT,
                value TEXT,
                PRIMARY KEY (page, key)
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS job_offers (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                department TEXT,
                contract_type TEXT,
                location TEXT,
                description TEXT,
                requirements TEXT,
                salary_range TEXT,
                active INTEGER DEFAULT 1,
                posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                deadline TEXT
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                job_id INTEGER,
                job_title TEXT,
                full_name TEXT,
                email TEXT,
                phone TEXT,
                message TEXT,
                cv_url TEXT,
                applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending'
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS specialties (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                ordre INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
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
                sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS etablissement_photos (
                id SERIAL PRIMARY KEY,
                titre TEXT NOT NULL,
                description TEXT,
                image_url TEXT NOT NULL,
                ordre INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS partenaires (
                id SERIAL PRIMARY KEY,
                nom TEXT NOT NULL,
                description TEXT,
                image_url TEXT NOT NULL,
                commentaire TEXT,
                ordre INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS paiements (
                id SERIAL PRIMARY KEY,
                montant REAL NOT NULL,
                methode TEXT NOT NULL,
                telephone TEXT,
                email_client TEXT,
                nom_client TEXT,
                statut TEXT DEFAULT 'en_attente',
                code_confirmation TEXT,
                date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                facture_url TEXT,
                appointment_id INTEGER
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS config_paiement (
                id SERIAL PRIMARY KEY,
                cle TEXT UNIQUE NOT NULL,
                valeur TEXT NOT NULL
            )
        `);
        await db.query(`
            INSERT INTO config_paiement (cle, valeur) VALUES 
                ('iban', 'FR76 1234 5678 9012 3456 7890 123'),
                ('bic', 'BNPAFRPP'),
                ('titulaire', 'Medical Center Elizabeth'),
                ('mobile_money_info', 'Orange Money : 01 23 45 67 89 / MTN : 05 67 89 12 34'),
                ('carte_info', 'Paiement sécurisé par carte bancaire (Visa/Mastercard)')
            ON CONFLICT (cle) DO NOTHING
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS tarifs (
                id SERIAL PRIMARY KEY,
                service TEXT NOT NULL,
                prestation TEXT NOT NULL,
                prix TEXT NOT NULL,
                description TEXT,
                ordre INTEGER DEFAULT 0,
                active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS resultats (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES patients(id),
                type TEXT,
                description TEXT,
                file_url TEXT,
                is_published INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                published_at TIMESTAMP
            )
        `);

        // Ajout des colonnes manquantes (ALTER TABLE)
        try { await db.query(`ALTER TABLE appointments ADD COLUMN admin_viewed INTEGER DEFAULT 0`); } catch(e) {}
        try { await db.query(`ALTER TABLE appointments ADD COLUMN doctor_viewed INTEGER DEFAULT 0`); } catch(e) {}
        try { await db.query(`ALTER TABLE staff ADD COLUMN telegram_chat_id TEXT`); } catch(e) {}
        try {
            await db.query(`ALTER TABLE patients ADD COLUMN is_active INTEGER DEFAULT 1`);
            console.log('✅ Colonne is_active ajoutée à patients');
        } catch(e) { console.log('is_active déjà présente'); }
        try {
            await db.query(`ALTER TABLE appointments ADD COLUMN teleconsultation_validated INTEGER DEFAULT 0`);
            console.log('✅ Colonne teleconsultation_validated ajoutée aux rendez-vous');
        } catch(e) { console.log('teleconsultation_validated déjà présente'); }
        try {
            await db.query(`ALTER TABLE appointments ADD COLUMN is_paid INTEGER DEFAULT 0`);
            console.log('✅ Colonne is_paid ajoutée aux rendez-vous');
        } catch(e) { console.log('is_paid déjà présente'); }
        try {
            await db.query(`ALTER TABLE appointments ADD COLUMN facture_url TEXT`);
            console.log('✅ Colonne facture_url ajoutée aux rendez-vous');
        } catch(e) { console.log('facture_url déjà présente'); }
        try {
            await db.query(`ALTER TABLE paiements ADD COLUMN appointment_id INTEGER`);
            console.log('✅ Colonne appointment_id ajoutée aux paiements');
        } catch(e) { console.log('appointment_id déjà présente'); }
        try {
            await db.query(`ALTER TABLE applications ADD COLUMN cv_url TEXT`);
            console.log('✅ Colonne cv_url vérifiée/ajoutée');
        } catch(e) {}
        try {
            await db.query(`ALTER TABLE job_offers ADD COLUMN deadline TEXT`);
            console.log('✅ Colonne deadline ajoutée');
        } catch(e) { console.log('deadline existe déjà'); }
        try {
            await db.query(`ALTER TABLE appointments ADD COLUMN patient_id INTEGER`);
            console.log('✅ Colonne patient_id ajoutée aux rendez-vous');
        } catch(e) { console.log('patient_id existe déjà'); }

        console.log('✅ Toutes les tables sont vérifiées/créées');
    } catch (err) {
        console.error('Erreur lors de la création des tables:', err);
    }
})();

// ========== NOUVELLE ROUTE : Disponibilités des médecins pour le chat ==========
app.get('/api/chat/doctor-availability', async (req, res) => {
    const { doctorName } = req.query;
    if (!doctorName) return res.status(400).json({ error: 'Nom du médecin requis' });

    try {
        // Rechercher le médecin dans la table staff
        const doctorQuery = await db.query(
            `SELECT id, full_name FROM staff WHERE profession = 'Médecin' AND is_active = 1 AND (full_name ILIKE $1 OR specialty ILIKE $1)`,
            [`%${doctorName}%`]
        );
        if (doctorQuery.rowCount === 0) {
            return res.json({ reply: `Désolé, je n'ai pas trouvé de médecin correspondant à "${doctorName}".` });
        }
        const doctor = doctorQuery.rows[0];

        // Récupérer les créneaux disponibles pour les 7 prochains jours
        const today = new Date().toISOString().slice(0,10);
        const availabilityQuery = await db.query(
            `SELECT date, time_slot FROM availabilities WHERE doctor_id = $1 AND is_booked = 0 AND date >= $2 ORDER BY date, time_slot LIMIT 10`,
            [doctor.id, today]
        );

        if (availabilityQuery.rowCount === 0) {
            return res.json({ reply: `Le Dr ${doctor.full_name} n'a pas de créneaux disponibles pour le moment. Veuillez réessayer plus tard.` });
        }

        let slotsText = availabilityQuery.rows.map(s => `${s.date} à ${s.time_slot}`).join('\n- ');
        const reply = `✅ Voici les prochains créneaux disponibles pour le Dr ${doctor.full_name} :\n- ${slotsText}\n\nPour prendre rendez-vous, utilisez notre formulaire en ligne (lien en bas de la page).`;
        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur interne' });
    }
});

// ========== ROUTES API (suite) ==========

// Newsletter
app.get('/api/newsletter/count', async (req, res) => {
    try {
        const result = await db.query(`SELECT COUNT(*) as count FROM newsletter WHERE is_active = 1`);
        res.json({ count: result.rows[0]?.count || 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/newsletter/export', async (req, res) => {
    try {
        const result = await db.query(`SELECT email FROM newsletter WHERE is_active = 1`);
        res.json({ emails: result.rows.map(r => r.email) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/newsletter/subscribers', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, email, subscribed_at, is_active FROM newsletter ORDER BY subscribed_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return res.status(400).json({ error: 'Email invalide' });
    try {
        await db.query(`INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [email]);
        const check = await db.query(`SELECT id FROM newsletter WHERE email = $1`, [email]);
        if (check.rowCount === 0) return res.status(409).json({ error: 'Cet email est déjà inscrit' });
        res.json({ success: true, message: 'Inscription réussie !' });
    } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});
app.post('/api/newsletter/send', async (req, res) => {
    const { subject, content } = req.body;
    if (!subject || !content) return res.status(400).json({ error: 'Sujet et contenu requis' });
    try {
        const subs = await db.query(`SELECT email FROM newsletter WHERE is_active = 1`);
        const emails = subs.rows.map(r => r.email);
        if (emails.length === 0) return res.status(400).json({ error: 'Aucun abonné' });
        let successCount = 0, errorCount = 0;
        for (const email of emails) {
            try {
                await sendNewsletterEmail(email, subject, content);
                successCount++;
            } catch (e) { errorCount++; }
        }
        await db.query(`INSERT INTO newsletter_campaigns (subject, content, recipient_count) VALUES ($1, $2, $3)`, [subject, content, successCount]);
        res.json({ success: true, total: emails.length, successCount, errorCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Spécialités
app.get('/api/specialties', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM specialties ORDER BY ordre ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/specialties', async (req, res) => {
    const { name, description, ordre, active } = req.body;
    if (!name) return res.status(400).json({ error: "Nom requis" });
    try {
        const result = await db.query(
            `INSERT INTO specialties (name, description, ordre, active) VALUES ($1, $2, $3, $4) RETURNING id`,
            [name, description || null, ordre || 0, active !== undefined ? active : 1]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/specialties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, ordre, active } = req.body;
    try {
        await db.query(`UPDATE specialties SET name=$1, description=$2, ordre=$3, active=$4 WHERE id=$5`, [name, description, ordre, active, id]);
        res.json({ message: "Spécialité modifiée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/specialties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM specialties WHERE id=$1`, [id]);
        res.json({ message: "Spécialité supprimée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Actualités
app.get('/api/actualites', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM actualites ORDER BY ordre ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/actualites', async (req, res) => {
    const { titre, description, image_url, ordre, active } = req.body;
    if (!titre || !description) return res.status(400).json({ error: "Titre et description requis" });
    try {
        const result = await db.query(
            `INSERT INTO actualites (titre, description, image_url, ordre, active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [titre, description, image_url || null, ordre || 0, active !== undefined ? active : 1]
        );
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/actualites/:id', async (req, res) => {
    const { id } = req.params;
    const { titre, description, image_url, ordre, active } = req.body;
    try {
        await db.query(`UPDATE actualites SET titre=$1, description=$2, image_url=$3, ordre=$4, active=$5 WHERE id=$6`, [titre, description, image_url, ordre, active, id]);
        res.json({ message: "Actualité modifiée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/actualites/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM actualites WHERE id=$1`, [id]);
        res.json({ message: "Actualité supprimée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========== ADMIN : authentification personnalisée ==========
// On remplace basicAuth par un simple basicAuth avec les identifiants fournis
app.use('/admin', basicAuth({
    users: { 'adminmpombo@gmail.com': '@M@thurkayo21262578@@@@1' },
    challenge: true,
    realm: 'Accès réservé à l\'administration'
}));

// Liste des médecins
app.get('/api/doctors', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, full_name as name, specialty FROM staff WHERE profession = 'Médecin' AND is_active = 1`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Erreur interne" }); }
});

// Disponibilités
app.get('/api/availability/:doctorId/:date', async (req, res) => {
    const { doctorId, date } = req.params;
    try {
        const result = await db.query(`SELECT time_slot FROM availabilities WHERE doctor_id = $1 AND date = $2 AND is_booked = 0`, [doctorId, date]);
        res.json(result.rows.map(r => r.time_slot));
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/availabilities/calendar', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, s.full_name as doctor_name 
            FROM availabilities a 
            JOIN staff s ON a.doctor_id = s.id 
            WHERE s.profession = 'Médecin' 
            ORDER BY a.date, a.doctor_id
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/availabilities', async (req, res) => {
    const { doctor_id, date, time_slot } = req.body;
    if (!doctor_id || !date || !time_slot) return res.status(400).json({ error: "Champs manquants" });
    try {
        const doctorCheck = await db.query(`SELECT id FROM staff WHERE id = $1 AND profession = 'Médecin' AND is_active = 1`, [doctor_id]);
        if (doctorCheck.rowCount === 0) return res.status(400).json({ error: "Médecin invalide" });
        const result = await db.query(
            `INSERT INTO availabilities (doctor_id, date, time_slot, is_booked) VALUES ($1, $2, $3, 0) ON CONFLICT DO NOTHING RETURNING id`,
            [doctor_id, date, time_slot]
        );
        res.json({ message: "Créneau ajouté", id: result.rows[0]?.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/availabilities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const slot = await db.query(`SELECT is_booked FROM availabilities WHERE id = $1`, [id]);
        if (slot.rowCount === 0) return res.status(404).json({ error: "Non trouvé" });
        if (slot.rows[0].is_booked === 1) return res.status(409).json({ error: "Créneau déjà réservé" });
        await db.query(`DELETE FROM availabilities WHERE id = $1`, [id]);
        res.json({ message: "Créneau supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rendez-vous (public)
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
        try {
            const slot = await db.query(`SELECT id FROM availabilities WHERE doctor_id = $1 AND date = $2 AND time_slot = $3 AND is_booked = 0`, [docId, date, time]);
            if (slot.rowCount === 0) return res.status(409).json({ error: "Créneau non disponible" });
            await db.query(`UPDATE availabilities SET is_booked = 1 WHERE id = $1`, [slot.rows[0].id]);
            const roomName = `Medical Center Elizabeth-rdv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const teleconsultationLink = `https://meet.jit.si/${roomName}`;
            const patientRow = await db.query(`SELECT id FROM patients WHERE email = $1`, [email]);
            const patientId = patientRow.rows[0]?.id || null;
            const insertResult = await db.query(
                `INSERT INTO appointments (fullname, email, phone, specialty, date, time, message, doctor_id, teleconsultation_link, patient_id, teleconsultation_validated) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0) RETURNING id`,
                [fullname, email, phone, specialty, date, time, message, docId, teleconsultationLink, patientId]
            );
            sendConfirmation(email, fullname, date, time, specialty, teleconsultationLink).catch(console.error);
            await sendTelegramNotification('📅 Nouveau rendez-vous', `👤 Patient: ${fullname}\n📧 Email: ${email}\n📅 Date: ${date} à ${time}\n👨‍⚕️ Médecin ID: ${docId}\n🔗 Lien visio: ${teleconsultationLink}`);
            const doctor = await db.query(`SELECT telegram_chat_id FROM staff WHERE id = $1 AND profession = 'Médecin'`, [docId]);
            if (doctor.rows[0]?.telegram_chat_id) {
                sendTelegramNotification('📅 Nouveau rendez-vous patient', `👤 ${fullname}\n📅 ${date} à ${time}\n🔗 Lien visio: ${teleconsultationLink}`, doctor.rows[0].telegram_chat_id);
            }
            res.status(201).json({ message: "Rendez-vous enregistré avec succès", id: insertResult.rows[0].id, teleconsultationLink });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
);
app.get('/api/appointments', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, s.full_name as doctor_name, a.admin_viewed, a.doctor_viewed, a.teleconsultation_validated
            FROM appointments a 
            LEFT JOIN staff s ON a.doctor_id = s.id 
            ORDER BY a.date DESC, a.time DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { fullname, email, phone, specialty, date, time, message, doctor_id } = req.body;
    try {
        await db.query(`UPDATE appointments SET fullname=$1, email=$2, phone=$3, specialty=$4, date=$5, time=$6, message=$7, doctor_id=$8 WHERE id=$9`,
            [fullname, email, phone, specialty, date, time, message, doctor_id, id]);
        res.json({ message: "Rendez-vous modifié", changes: 1 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/appointments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const app = await db.query(`SELECT doctor_id, date, time FROM appointments WHERE id=$1`, [id]);
        if (app.rowCount === 0) return res.status(404).json({ error: "Rendez-vous non trouvé" });
        await db.query(`DELETE FROM appointments WHERE id=$1`, [id]);
        await db.query(`UPDATE availabilities SET is_booked=0 WHERE doctor_id=$1 AND date=$2 AND time_slot=$3`, [app.rows[0].doctor_id, app.rows[0].date, app.rows[0].time]);
        res.json({ message: "Rendez-vous supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/appointments/:id/view', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE appointments SET admin_viewed = 1 WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/appointments/:id/validate-teleconsultation', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`UPDATE appointments SET teleconsultation_validated = 1 WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        res.json({ success: true, message: 'Téléconsultation validée' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Espace Médecin
app.post('/api/doctor/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
    try {
        const doctor = await db.query(`SELECT * FROM staff WHERE email = $1 AND profession = 'Médecin' AND is_active = 1`, [email]);
        if (doctor.rowCount === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        const doc = doctor.rows[0];
        if (!bcrypt.compareSync(password, doc.password)) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        const token = jwt.sign({ id: doc.id, type: 'doctor', name: doc.full_name, profession: doc.profession }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ success: true, token, doctor: { id: doc.id, name: doc.full_name, specialty: doc.specialty, email: doc.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/doctor/appointments', authenticateToken, async (req, res) => {
    if (req.user.type !== 'doctor') return res.status(403).json({ error: 'Accès réservé aux médecins' });
    const doctorId = req.user.id;
    try {
        const result = await db.query(`
            SELECT a.*, s.full_name as doctor_name, a.admin_viewed, a.doctor_viewed, a.teleconsultation_validated
            FROM appointments a
            LEFT JOIN staff s ON a.doctor_id = s.id
            WHERE a.doctor_id = $1
            ORDER BY a.date DESC, a.time DESC
        `, [doctorId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/doctor/appointments/:id/view', authenticateToken, async (req, res) => {
    if (req.user.type !== 'doctor') return res.status(403).json({ error: 'Accès réservé aux médecins' });
    const { id } = req.params;
    const doctorId = req.user.id;
    try {
        const app = await db.query(`SELECT id FROM appointments WHERE id = $1 AND doctor_id = $2`, [id, doctorId]);
        if (app.rowCount === 0) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        await db.query(`UPDATE appointments SET doctor_viewed = 1 WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Statistiques
app.get('/api/stats', async (req, res) => {
    try {
        const total = await db.query(`SELECT COUNT(*) as total FROM appointments`);
        const perDay = await db.query(`SELECT date, COUNT(*) as nb FROM appointments GROUP BY date ORDER BY date`);
        const perDoctor = await db.query(`SELECT s.full_name as name, COUNT(a.id) as nb FROM staff s LEFT JOIN appointments a ON s.id = a.doctor_id WHERE s.profession = 'Médecin' GROUP BY s.id, s.full_name`);
        res.json({ total: total.rows[0]?.total || 0, perDay: perDay.rows, perDoctor: perDoctor.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Événements
app.get('/api/events', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM events ORDER BY start_date DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/events', async (req, res) => {
    const { title, description, start_date, end_date, active } = req.body;
    if (!title) return res.status(400).json({ error: "Titre requis" });
    try {
        const result = await db.query(`INSERT INTO events (title, description, start_date, end_date, active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [title, description || null, start_date || null, end_date || null, active !== undefined ? active : 1]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/events/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM events WHERE id = $1`, [id]);
        res.json({ message: "Événement supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Contenu du site
app.get('/api/site-content/:page', async (req, res) => {
    const page = req.params.page;
    try {
        const result = await db.query(`SELECT key, value FROM site_contents WHERE page = $1`, [page]);
        const content = {};
        result.rows.forEach(row => content[row.key] = row.value);
        res.json(content);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/site-content/:page', async (req, res) => {
    const page = req.params.page;
    const updates = req.body;
    if (typeof updates !== 'object') return res.status(400).json({ error: "Format invalide" });
    try {
        for (const [key, value] of Object.entries(updates)) {
            await db.query(`INSERT INTO site_contents (page, key, value) VALUES ($1, $2, $3) ON CONFLICT (page, key) DO UPDATE SET value = EXCLUDED.value`,
                [page, key, String(value)]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Offres d'emploi
app.get('/api/jobs', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM job_offers WHERE active = 1 ORDER BY posted_date DESC`);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/jobs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT * FROM job_offers WHERE id = $1 AND active = 1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Offre non trouvée' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/applications', async (req, res) => {
    const { jobId, jobTitle, fullName, email, phone, message, cvUrl } = req.body;
    console.log('📥 Candidature reçue:', { jobId, jobTitle, fullName, email });
    try {
        const result = await db.query(`INSERT INTO applications (job_id, job_title, full_name, email, phone, message, cv_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id`,
            [jobId, jobTitle, fullName, email, phone || '', message || '', cvUrl || null]);
        await sendTelegramNotification('📄 Nouvelle candidature reçue', `📋 Poste : ${jobTitle}\n👤 Candidat : ${fullName}\n📧 Email : ${email}\n📝 Message : ${message?.substring(0, 200) || 'Aucun message'}\n📎 CV : ${cvUrl || 'Non fourni'}`);
        res.json({ success: true, id: result.rows[0].id, message: 'Candidature envoyée avec succès' });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/jobs', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM job_offers ORDER BY posted_date DESC`);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/jobs', async (req, res) => {
    const { title, department, contract_type, location, description, requirements, salary_range, active, deadline } = req.body;
    if (!title || !department || !contract_type || !location || !description || !requirements) return res.status(400).json({ error: 'Tous les champs sont requis' });
    try {
        const result = await db.query(`INSERT INTO job_offers (title, department, contract_type, location, description, requirements, salary_range, active, deadline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [title, department, contract_type, location, description, requirements, salary_range || null, active !== undefined ? active : 1, deadline || null]);
        res.json({ success: true, id: result.rows[0].id, message: 'Offre ajoutée avec succès' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/jobs/:id', async (req, res) => {
    const { id } = req.params;
    const { title, department, contract_type, location, description, requirements, salary_range, active, deadline } = req.body;
    try {
        await db.query(`UPDATE job_offers SET title=$1, department=$2, contract_type=$3, location=$4, description=$5, requirements=$6, salary_range=$7, active=$8, deadline=$9 WHERE id=$10`,
            [title, department, contract_type, location, description, requirements, salary_range, active, deadline, id]);
        res.json({ success: true, message: 'Offre modifiée avec succès' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/jobs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM job_offers WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Offre supprimée avec succès' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/applications', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM applications ORDER BY applied_date DESC`);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Personnel (staff)
app.get('/api/staff', async (req, res) => {
    const { search, profession, department } = req.query;
    let query = `SELECT * FROM staff WHERE is_active = 1`;
    let params = [];
    if (search) { query += ` AND (full_name LIKE $${params.length+1} OR profession LIKE $${params.length+1} OR specialty LIKE $${params.length+1} OR department LIKE $${params.length+1})`; params.push(`%${search}%`); }
    if (profession) { query += ` AND profession = $${params.length+1}`; params.push(profession); }
    if (department) { query += ` AND department = $${params.length+1}`; params.push(department); }
    query += ` ORDER BY profession, full_name`;
    try {
        const result = await db.query(query, params);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/staff/professions', async (req, res) => {
    try {
        const result = await db.query(`SELECT DISTINCT profession FROM staff WHERE is_active = 1 ORDER BY profession`);
        res.json(result.rows.map(r => r.profession));
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/staff/departments', async (req, res) => {
    try {
        const result = await db.query(`SELECT DISTINCT department FROM staff WHERE is_active = 1 ORDER BY department`);
        res.json(result.rows.map(r => r.department));
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT * FROM staff WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Personnel non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/staff', async (req, res) => {
    const { full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id } = req.body;
    if (!full_name || !profession || !department || !email || !password) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        const result = await db.query(`INSERT INTO staff (full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1) RETURNING id`,
            [full_name, profession, specialty || null, department, email, phone || null, photo_url || null, hashedPassword, telegram_chat_id || null]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    const { full_name, profession, specialty, department, email, phone, photo_url, password, telegram_chat_id, is_active } = req.body;
    let sql = `UPDATE staff SET full_name=$1, profession=$2, specialty=$3, department=$4, email=$5, phone=$6, photo_url=$7, telegram_chat_id=$8, is_active=$9`;
    let params = [full_name, profession, specialty || null, department, email, phone || null, photo_url || null, telegram_chat_id || null, is_active !== undefined ? is_active : 1];
    if (password && password.trim()) {
        sql += `, password = $10`;
        params.push(bcrypt.hashSync(password, 10));
    }
    sql += ` WHERE id = $${params.length+1}`;
    params.push(id);
    try {
        await db.query(sql, params);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/staff/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM staff WHERE id = $1`, [id]);
        res.json({ message: 'Personnel supprimé' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Messagerie
app.post('/api/messages', async (req, res) => {
    const { sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id } = req.body;
    if (!sender_type || sender_id === undefined || !sender_name || !receiver_type || receiver_id === undefined || !subject || !message) return res.status(400).json({ error: 'Tous les champs sont requis' });
    try {
        const result = await db.query(`INSERT INTO messages (sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id || null]);
        await sendTelegramNotification('📬 Nouveau message patient', `👤 De : ${sender_name}\n✉️ Sujet : ${subject}\n💬 Message : ${message.substring(0, 200)}${message.length > 200 ? '…' : ''}`);
        res.json({ success: true, id: result.rows[0].id, message: 'Message envoyé avec succès' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/messages/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const result = await db.query(`SELECT * FROM messages WHERE (sender_type = $1 AND sender_id = $2) OR (receiver_type = $1 AND receiver_id = $2) ORDER BY sent_date DESC`, [type, id]);
        res.json(result.rows || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/messages/:id/read', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE messages SET is_read = 1 WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/messages/unread/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const result = await db.query(`SELECT COUNT(*) as count FROM messages WHERE receiver_type = $1 AND receiver_id = $2 AND is_read = 0`, [type, id]);
        res.json({ unread: result.rows[0]?.count || 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/messages/:id/reply', async (req, res) => {
    const { id } = req.params;
    const { message, sender_name, sender_id, sender_type } = req.body;
    try {
        const original = await db.query(`SELECT * FROM messages WHERE id = $1`, [id]);
        if (original.rowCount === 0) return res.status(404).json({ error: 'Message original non trouvé' });
        const orig = original.rows[0];
        const result = await db.query(`INSERT INTO messages (sender_type, sender_id, sender_name, receiver_type, receiver_id, receiver_name, subject, message, reply_to_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [sender_type, sender_id, sender_name, orig.sender_type, orig.sender_id, orig.sender_name, `RE: ${orig.subject}`, message, id]);
        res.json({ success: true, id: result.rows[0].id, message: 'Réponse envoyée' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ESPACE PATIENT
app.get('/api/patients', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, first_name, last_name, email FROM patients WHERE is_active = 1 ORDER BY last_name`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/patient/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await db.query(`SELECT * FROM patients WHERE email = $1 AND is_active = 1`, [email]);
        if (patient.rowCount === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        const pat = patient.rows[0];
        if (!bcrypt.compareSync(password, pat.password)) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        const token = jwt.sign({ id: pat.id, type: 'patient', name: `${pat.first_name} ${pat.last_name}` }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ success: true, token, patient: { id: pat.id, name: `${pat.first_name} ${pat.last_name}`, email: pat.email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/patient/register', async (req, res) => {
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password) return res.status(400).json({ error: 'Prénom, nom, email et mot de passe requis' });
    try {
        const existing = await db.query(`SELECT id FROM patients WHERE email = $1`, [email]);
        if (existing.rowCount > 0) return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await db.query(`INSERT INTO patients (first_name, last_name, email, password, phone, is_active) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id`,
            [first_name, last_name, email, hashedPassword, phone || null]);
        await db.query(`INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT DO NOTHING`, [email]);
        const token = jwt.sign({ id: result.rows[0].id, type: 'patient', name: `${first_name} ${last_name}` }, SECRET_KEY, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, patient: { id: result.rows[0].id, name: `${first_name} ${last_name}`, email } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/patient/appointments', authenticateToken, async (req, res) => {
    const patientId = req.user.id;
    try {
        const result = await db.query(`
            SELECT a.*, s.full_name as doctor_name, a.teleconsultation_validated, a.is_paid, a.facture_url
            FROM appointments a 
            LEFT JOIN staff s ON a.doctor_id = s.id 
            WHERE a.patient_id = $1 
            ORDER BY a.date DESC, a.time DESC
        `, [patientId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/patient/results', authenticateToken, async (req, res) => {
    const patientId = req.user.id;
    try {
        const result = await db.query(`SELECT id, type, description, file_url, published_at FROM resultats WHERE patient_id = $1 AND is_published = 1 ORDER BY published_at DESC`, [patientId]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/results/pending', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT r.*, p.first_name, p.last_name, p.email 
            FROM resultats r 
            JOIN patients p ON r.patient_id = p.id 
            WHERE r.is_published = 0 
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/results/:id/publish', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`UPDATE resultats SET is_published = 1, published_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/results', async (req, res) => {
    const { patient_id, type, description, file_url } = req.body;
    if (!patient_id || !type) return res.status(400).json({ error: 'patient_id et type requis' });
    try {
        const result = await db.query(`INSERT INTO resultats (patient_id, type, description, file_url, is_published) VALUES ($1, $2, $3, $4, 0) RETURNING id`,
            [patient_id, type, description || null, file_url || null]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/admin/patients', async (req, res) => {
    try {
        const result = await db.query(`SELECT id, first_name, last_name, email, phone, created_at, is_active FROM patients ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/patients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT id, first_name, last_name, email, phone, created_at, is_active FROM patients WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Patient non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/admin/patients', async (req, res) => {
    const { first_name, last_name, email, password, phone } = req.body;
    if (!first_name || !last_name || !email || !password) return res.status(400).json({ error: 'Prénom, nom, email et mot de passe requis' });
    try {
        const existing = await db.query(`SELECT id FROM patients WHERE email = $1`, [email]);
        if (existing.rowCount > 0) return res.status(409).json({ error: 'Cet email existe déjà' });
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await db.query(`INSERT INTO patients (first_name, last_name, email, password, phone, is_active) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id`,
            [first_name, last_name, email, hashedPassword, phone || null]);
        await db.query(`INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT DO NOTHING`, [email]);
        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/admin/patients/:id', async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, phone, password, is_active } = req.body;
    let sql = `UPDATE patients SET first_name=$1, last_name=$2, email=$3, phone=$4, is_active=$5`;
    let params = [first_name, last_name, email, phone || null, is_active !== undefined ? is_active : 1];
    if (password && password.trim()) { sql += `, password = $6`; params.push(bcrypt.hashSync(password, 10)); }
    sql += ` WHERE id = $${params.length+1}`; params.push(id);
    try {
        await db.query(sql, params);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/admin/patients/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM patients WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Établissement
app.get('/api/etablissement', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM etablissement_photos ORDER BY ordre ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/etablissement', async (req, res) => {
    const { titre, description, image_url, ordre, active } = req.body;
    if (!titre || !image_url) return res.status(400).json({ error: "Titre et image requis" });
    try {
        const result = await db.query(`INSERT INTO etablissement_photos (titre, description, image_url, ordre, active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [titre, description || null, image_url, ordre || 0, active !== undefined ? active : 1]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/etablissement/:id', async (req, res) => {
    const { id } = req.params;
    const { titre, description, image_url, ordre, active } = req.body;
    try {
        await db.query(`UPDATE etablissement_photos SET titre=$1, description=$2, image_url=$3, ordre=$4, active=$5 WHERE id=$6`, [titre, description, image_url, ordre, active, id]);
        res.json({ message: "Photo modifiée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/etablissement/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM etablissement_photos WHERE id=$1`, [id]);
        res.json({ message: "Photo supprimée" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Partenaires
app.get('/api/partenaires', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM partenaires ORDER BY ordre ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/partenaires', async (req, res) => {
    const { nom, description, image_url, commentaire, ordre, active } = req.body;
    if (!nom || !image_url) return res.status(400).json({ error: "Nom et image requis" });
    try {
        const result = await db.query(`INSERT INTO partenaires (nom, description, image_url, commentaire, ordre, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nom, description || null, image_url, commentaire || null, ordre || 0, active !== undefined ? active : 1]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/partenaires/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, description, image_url, commentaire, ordre, active } = req.body;
    try {
        await db.query(`UPDATE partenaires SET nom=$1, description=$2, image_url=$3, commentaire=$4, ordre=$5, active=$6 WHERE id=$7`, [nom, description, image_url, commentaire, ordre, active, id]);
        res.json({ message: "Partenaire modifié" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/partenaires/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM partenaires WHERE id=$1`, [id]);
        res.json({ message: "Partenaire supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Paiements
app.get('/api/paiement/config', async (req, res) => {
    try {
        const result = await db.query(`SELECT cle, valeur FROM config_paiement`);
        const config = {};
        result.rows.forEach(row => config[row.cle] = row.valeur);
        res.json(config);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/paiement/config', async (req, res) => {
    const updates = req.body;
    try {
        for (const [key, value] of Object.entries(updates)) {
            await db.query(`INSERT INTO config_paiement (cle, valeur) VALUES ($1, $2) ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur`, [key, String(value)]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/paiement/initier', async (req, res) => {
    const { montant, methode, telephone, email, nom } = req.body;
    if (!montant || !methode) return res.status(400).json({ error: 'Montant et méthode requis' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const result = await db.query(`INSERT INTO paiements (montant, methode, telephone, email_client, nom_client, code_confirmation, statut) VALUES ($1, $2, $3, $4, $5, $6, 'en_attente') RETURNING id`,
            [montant, methode, telephone || null, email || null, nom || null, code]);
        sendTelegramNotification('💳 Nouveau paiement initié', `ID: ${result.rows[0].id}\nMontant: ${montant}€\nMéthode: ${methode}\nClient: ${nom || 'Anonyme'}`);
        res.json({ id: result.rows[0].id, code, message: 'Paiement initié. Utilisez le code pour confirmer (simulation).' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/paiement/confirmer/:id', async (req, res) => {
    const { id } = req.params;
    const { code } = req.body;
    try {
        const paiement = await db.query(`SELECT * FROM paiements WHERE id = $1 AND code_confirmation = $2`, [id, code]);
        if (paiement.rowCount === 0) return res.status(404).json({ error: 'Paiement ou code invalide' });
        const p = paiement.rows[0];
        if (p.statut !== 'en_attente') return res.status(400).json({ error: 'Déjà traité' });
        await db.query(`UPDATE paiements SET statut = 'confirme', date_paiement = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        const factureUrl = `/factures/${id}.pdf`;
        await db.query(`UPDATE paiements SET facture_url = $1 WHERE id = $2`, [factureUrl, id]);
        sendTelegramNotification('✅ Paiement confirmé', `ID: ${id}\nMontant: ${p.montant}€\nClient: ${p.nom_client || 'Anonyme'}\nCode: ${code}`);
        if (p.appointment_id) {
            await db.query(`UPDATE appointments SET is_paid = 1, facture_url = $1 WHERE id = $2`, [factureUrl, p.appointment_id]);
        }
        res.json({ success: true, facture_url: factureUrl, code });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/paiements', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM paiements ORDER BY date_paiement DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}
app.get('/factures/:id.pdf', async (req, res) => {
    const id = req.params.id;
    try {
        const paiement = await db.query(`SELECT * FROM paiements WHERE id = $1`, [id]);
        if (paiement.rowCount === 0) return res.status(404).send('Facture non trouvée');
        const p = paiement.rows[0];
        const factureHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Facture MCE</title>
            <style>body{font-family: Arial; padding:20px;} h1{color:#0b6e8f;}</style></head>
            <body><div><h1>Medical Center Elizabeth (MCE)</h1><h2>Facture n° MCE-${p.id}</h2>
            <p><strong>Client :</strong> ${escapeHtml(p.nom_client || 'Anonyme')} (${escapeHtml(p.email_client || 'non renseigné')})</p>
            <p><strong>Montant :</strong> ${p.montant} €</p>
            <p><strong>Méthode :</strong> ${p.methode === 'mobile_money' ? 'Mobile Money' : 'Carte bancaire'}</p>
            <p><strong>Date :</strong> ${p.date_paiement}</p>
            <p><strong>Code :</strong> ${p.code_confirmation}</p><hr>
            <p>Medical Center Elizabeth - 33 Avenue de l'Innovation, Paris 75012</p></div></body></html>`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="facture_${p.id}.html"`);
        res.send(factureHtml);
    } catch (err) { res.status(500).send('Erreur'); }
});

// Tarifs
app.get('/api/tarifs', async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM tarifs ORDER BY ordre ASC, service ASC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/tarifs', async (req, res) => {
    const { service, prestation, prix, description, ordre, active } = req.body;
    if (!service || !prestation || !prix) return res.status(400).json({ error: 'Service, prestation et prix requis' });
    try {
        const result = await db.query(`INSERT INTO tarifs (service, prestation, prix, description, ordre, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [service, prestation, prix, description || null, ordre || 0, active !== undefined ? active : 1]);
        res.status(201).json({ id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/tarifs/:id', async (req, res) => {
    const { id } = req.params;
    const { service, prestation, prix, description, ordre, active } = req.body;
    try {
        await db.query(`UPDATE tarifs SET service=$1, prestation=$2, prix=$3, description=$4, ordre=$5, active=$6 WHERE id=$7`, [service, prestation, prix, description, ordre, active, id]);
        res.json({ message: "Tarif modifié" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/tarifs/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM tarifs WHERE id=$1`, [id]);
        res.json({ message: "Tarif supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Paiement patient pour un rendez-vous
app.post('/api/patient/appointments/:id/pay', authenticateToken, async (req, res) => {
    if (req.user.type !== 'patient') return res.status(403).json({ error: 'Accès réservé aux patients' });
    const appointmentId = req.params.id;
    const patientId = req.user.id;
    try {
        const appointment = await db.query(`SELECT * FROM appointments WHERE id = $1 AND patient_id = $2`, [appointmentId, patientId]);
        if (appointment.rowCount === 0) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
        const appt = appointment.rows[0];
        if (appt.is_paid) return res.status(400).json({ error: 'Ce rendez-vous est déjà payé' });
        const montant = 30.00;
        const methode = 'carte';
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const result = await db.query(`INSERT INTO paiements (montant, methode, email_client, nom_client, code_confirmation, statut, appointment_id) VALUES ($1, $2, $3, $4, $5, 'en_attente', $6) RETURNING id`,
            [montant, methode, appt.email, appt.fullname, code, appointmentId]);
        res.json({ success: true, id: result.rows[0].id, code, montant });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// Route de test Telegram
app.get('/api/test-telegram', async (req, res) => {
    try {
        await sendTelegramNotification('Test MCE', 'Ceci est un message de test depuis le backend.');
        res.json({ success: true, message: 'Message envoyé' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Enregistrement des demandes de check-up
app.post('/api/checkup-requests', (req, res) => {
    const { fullname, email, phone, checkupType, date, timeSlot, message } = req.body;
    if (!fullname || !email || !phone || !date) return res.status(400).json({ error: 'Champs obligatoires manquants' });
    console.log('Demande check-up reçue :', { fullname, email, phone, checkupType, date, timeSlot, message });
    res.json({ success: true, message: 'Demande enregistrée' });
});

// ========== FICHIERS STATIQUES ET FALLBACK ==========
if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    const frontendPath = path.join(__dirname, 'frontend');
    app.use(express.static(frontendPath));
    app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
    app.use('/admin', express.static(path.join(__dirname, 'admin')));
    app.use('/uploads', express.static(path.join(__dirname, 'frontend/uploads')));
    app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
    app.use((req, res) => {
        res.status(404).json({ error: "Route non trouvée" });
    });
}

// ========== Démarrage ==========
app.listen(PORT, () => {
    console.log(`🏥 Medical Center Elizabeth (MCE) – http://localhost:${PORT}`);
});