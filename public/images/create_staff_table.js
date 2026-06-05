const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('hopital.db');

console.log('🚀 Création de la table staff (personnel de santé)...\n');

db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    profession TEXT NOT NULL,
    specialty TEXT,
    department TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cabinet_number TEXT,
    consultation_days TEXT,
    biography TEXT,
    photo_url TEXT,
    experience_years INTEGER,
    languages TEXT,
    is_active INTEGER DEFAULT 1
)`, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
        return;
    }
    console.log('✅ Table staff créée');

    // Vérifier si des données existent déjà
    db.get('SELECT COUNT(*) as count FROM staff', [], (err, row) => {
        if (row.count === 0) {
            const staffData = [
                // Médecins
                ['Dr. Sophie Martin', 'Médecin', 'Cardiologie', 'Cardiologie', 'sophie.martin@mce.fr', '01 88 88 88 01', 'B201', 'Lun, Mer, Ven', 'Cardiologue interventionnelle avec 12 ans d\'expérience. Spécialisée dans les maladies cardiaques et la prévention.', '/doctor1.jpg', 12, 'Français, Anglais'],
                ['Dr. Jean Dupont', 'Médecin', 'Chirurgie robotique', 'Chirurgie', 'jean.dupont@mce.fr', '01 88 88 88 02', 'B105', 'Mar, Jeu', 'Chirurgien spécialisé en robotique Da Vinci. Plus de 500 opérations réalisées.', '/doctor2.jpg', 15, 'Français, Anglais, Espagnol'],
                ['Dr. Claire Bernard', 'Médecin', 'Neurologie', 'Neurologie', 'claire.bernard@mce.fr', '01 88 88 88 03', 'C310', 'Lun, Mar, Jeu', 'Neurologue spécialisée dans les troubles du mouvement et la sclérose en plaques.', '/doctor3.jpg', 8, 'Français, Allemand'],
                ['Dr. Thomas Petit', 'Médecin', 'Pédiatrie', 'Pédiatrie', 'thomas.petit@mce.fr', '01 88 88 88 04', 'A115', 'Lun au Ven', 'Pédiatre depuis 10 ans, passionné par le développement de l\'enfant.', '/doctor4.jpg', 10, 'Français, Anglais'],
                ['Dr. Amina Diallo', 'Médecin', 'Gynécologie', 'Gynécologie', 'amina.diallo@mce.fr', '01 88 88 88 05', 'D208', 'Mar, Mer, Sam', 'Gynécologue obstétricienne, spécialisée dans le suivi de grossesse.', '/doctor5.jpg', 14, 'Français, Anglais, Wolof'],
                
                // Infirmiers
                ['Isabelle Leroy', 'Infirmier', 'Soins intensifs', 'Urgences', 'isabelle.leroy@mce.fr', '01 88 88 88 10', 'Urgences', 'Roulement 3x8', 'Infirmière en soins intensifs depuis 8 ans. Formée aux urgences vitales.', '/nurse1.jpg', 8, 'Français'],
                ['Nicolas Dubois', 'Infirmier', 'Bloc opératoire', 'Chirurgie', 'nicolas.dubois@mce.fr', '01 88 88 88 11', 'Bloc B', 'Lun, Mar, Mer', 'IBODE - Infirmier de bloc opératoire spécialisé en robotique.', '/nurse2.jpg', 6, 'Français, Anglais'],
                ['Sophie Lambert', 'Infirmier', 'Pédiatrie', 'Pédiatrie', 'sophie.lambert@mce.fr', '01 88 88 88 12', 'A120', 'Lun au Ven', 'Infirmière puéricultrice, adore travailler avec les enfants.', '/nurse3.jpg', 5, 'Français'],
                
                // Autres professionnels
                ['Marie Curie', 'Radiologue', 'Imagerie médicale', 'Radiologie', 'marie.curie@mce.fr', '01 88 88 88 20', 'E001', 'Lun, Mer, Jeu', 'Spécialiste en IRM 7T et nouvelles technologies d\'imagerie.', '/radio1.jpg', 9, 'Français, Anglais'],
                ['Philippe Durand', 'Kinésithérapeute', 'Rééducation', 'Médecine physique', 'philippe.durand@mce.fr', '01 88 88 88 21', 'F110', 'Lun au Sam', 'Kiné spécialisé en rééducation post-opératoire et sportive.', '/physio1.jpg', 11, 'Français'],
                ['Laura Vincent', 'Psychologue', 'Psychologie clinique', 'Santé mentale', 'laura.vincent@mce.fr', '01 88 88 88 22', 'G205', 'Mar, Jeu, Ven', 'Psychologue clinicienne spécialisée dans l\'accompagnement des patients chroniques.', '/psycho1.jpg', 7, 'Français, Anglais']
            ];

            const stmt = db.prepare(`INSERT INTO staff (full_name, profession, specialty, department, email, phone, cabinet_number, consultation_days, biography, experience_years, languages) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            staffData.forEach(staff => {
                stmt.run(staff, function(err) {
                    if (err) console.error('❌ Erreur insertion:', err.message);
                    else console.log(`   ✅ Ajouté: ${staff[0]} (${staff[1]})`);
                });
            });
            stmt.finalize();
            setTimeout(() => console.log('\n🎉 11 professionnels de santé ajoutés !'), 500);
        } else {
            console.log(`📊 ${row.count} professionnels déjà dans la base`);
        }
    });
});

setTimeout(() => db.close(), 1500);