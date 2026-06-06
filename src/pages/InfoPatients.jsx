// src/pages/InfoPatients.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://hopital-mce-site.onrender.com';

function InfoPatients() {
  const [footer, setFooter] = useState({});
  const [siteContent, setSiteContent] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/site-content/footer`)
      .then(res => res.json())
      .then(data => setFooter(data))
      .catch(err => console.error(err));
    fetch(`${API_BASE}/site-content/info`)
      .then(res => res.json())
      .then(data => setSiteContent(data))
      .catch(err => console.error(err));
  }, []);

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  const horaires = siteContent.horaires || 'Visiteurs : tous les jours de 14h à 19h et de 16h à 19h le week-end.';
  const repas = siteContent.repas || 'Service de restauration avec menus adaptés aux régimes spéciaux (sans sel, diabétique, etc.). Consultez notre diététicienne.';
  const parking = siteContent.parking || 'Parking visiteurs gratuit – places réservées aux personnes à mobilité réduite.';
  const regles = siteContent.regles || 'Port du masque recommandé, lavage des mains avant chaque visite. Interdiction de fumer.';
  const contact = siteContent.contact || 'Accueil des familles au standard : 01 88 88 88 88 ou service social : poste 1234.';

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Image en arrière-plan (visiteur.jpg dans public/) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/visiteur.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }}></div>

      {/* Overlay semi-transparent pour la lisibilité */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1
      }}></div>

      {/* Contenu */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1000px',
        margin: '2rem auto',
        padding: '0 1rem'
      }}>
        <h1 style={{ color: '#fff', marginBottom: '1rem', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Informations patients & visiteurs</h1>
        
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          
          <section style={{ marginBottom: '2rem', borderLeft: '4px solid #2ec4b6', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#0b6e8f', marginTop: 0 }}>🕒 Horaires de visite</h2>
            <p>{escapeHtml(horaires)}</p>
          </section>

          <section style={{ marginBottom: '2rem', borderLeft: '4px solid #ff9f1c', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#0b6e8f' }}>🍽️ Suggestions de repas pour patients</h2>
            <p>{escapeHtml(repas)}</p>
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0b6e8f' }}>Menu type (indications)</summary>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem' }}>
                <p><strong>Petit‑déjeuner :</strong> Thé, café, lait, pain complet, beurre, confiture, yaourt nature.</p>
                <p><strong>Déjeuner :</strong> Potage, protéine (viande/poisson/œuf), légumes cuits, féculent (riz/pâtes), fromage blanc, fruit frais.</p>
                <p><strong>Dîner :</strong> Soupe, plat végétarien, compote, infusion.</p>
                <p><em>Régimes spéciaux sur prescription médicale (sans sel, sans gluten, haché, etc.)</em></p>
              </div>
            </details>
          </section>

          <section style={{ marginBottom: '2rem', borderLeft: '4px solid #2ec4b6', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#0b6e8f' }}>🚗 Accès et parking</h2>
            <p>{escapeHtml(parking)}</p>
            <p>Adresse : {escapeHtml(footer.adresse || '33 Avenue de l\'Innovation, 75012 Paris')}</p>
            <p>Transports en commun : Métro ligne 8 – station Porte de Charenton, bus 46, 87.</p>
          </section>

          <section style={{ marginBottom: '2rem', borderLeft: '4px solid #e63946', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#0b6e8f' }}>🛡️ Règles et recommandations</h2>
            <p>{escapeHtml(regles)}</p>
            <ul>
              <li>Limiter le nombre de visiteurs à 2 par chambre.</li>
              <li>Ne pas apporter de fleurs dans les unités d’hématologie / réanimation (sauf autorisation).</li>
              <li>Respecter le repos des patients – parler à voix basse.</li>
              <li>Utiliser le gel hydroalcoolique mis à disposition.</li>
            </ul>
          </section>

          <section style={{ borderLeft: '4px solid #ff9f1c', paddingLeft: '1rem' }}>
            <h2 style={{ color: '#0b6e8f' }}>📞 Contacts utiles</h2>
            <p>{escapeHtml(contact)}</p>
            <p>Email contact : <a href={`mailto:${footer.email || 'contact@medicalcenterelizabeth.fr'}`}>{footer.email || 'contact@medicalcenterelizabeth.fr'}</a></p>
          </section>

          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem', background: '#eef2f6', borderRadius: '16px' }}>
            <p><i className="fas fa-heart" style={{ color: '#e63946' }}></i> Nous vous souhaitons un bon séjour et restons à votre écoute.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoPatients;