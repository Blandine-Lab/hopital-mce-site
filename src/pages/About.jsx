// src/pages/About.jsx
import { useState, useEffect } from 'react';

const API_BASE = '/api';

function About() {
  const [footer, setFooter] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/site-content/footer`)
      .then(res => res.json())
      .then(data => setFooter(data))
      .catch(err => console.error(err));
  }, []);

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Image en arrière-plan (optionnelle) – décommentez si vous avez une image about.jpg */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/about.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }}></div> */}

      {/* Overlay semi-transparent (si image) */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1
      }}></div> */}

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* En-tête */}
        <div style={{
          background: 'linear-gradient(95deg, #e6f4ff 0%, #ffffff 70%)',
          padding: '4rem 0 2rem',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <h1 style={{ fontSize: '2.8rem', color: '#0b6e8f', marginBottom: '1rem' }}>Nous connaître</h1>
            <p style={{ color: '#2c4b62', maxWidth: '700px', margin: '0 auto' }}>
              Découvrez qui nous sommes, nos valeurs et notre engagement pour une santé d’excellence.
            </p>
          </div>
        </div>

        {/* Section histoire & mission */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>Notre histoire</h2>
              <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#2c4b62' }}>
                Fondé en 2026, l’Hôpital Medical Center Elizabeth est né de la volonté de réinventer la médecine hospitalière en alliant technologies de pointe et humanité. Installé au cœur de Bukavu, notre établissement est rapidement devenu un centre de référence pour les soins de dernière génération.
              </p>
              <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>Notre mission</h2>
              <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#2c4b62' }}>
                Offrir une prise en charge personnalisée, rapide et innovante, accessible à tous. Nous plaçons le patient au centre de chaque décision, en nous appuyant sur l’intelligence artificielle, la robotique et une équipe médicale d’exception.
              </p>
              <p style={{ marginBottom: '1rem', lineHeight: '1.6', color: '#2c4b62' }}>
                Nous croyons que la technologie doit servir l’humain, et non l’inverse. C’est pourquoi chaque innovation est pensée pour améliorer l’expérience et les résultats de santé.
              </p>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <img src="/pht2.png" alt="Équipe Medical Center Elizabeth" style={{ maxWidth: '100%', borderRadius: '1.5rem', boxShadow: '0 20px 25px -12px rgba(0,0,0,0.08)' }} onError={(e) => { e.target.src = 'https://placehold.co/600x400/eef6fc/0b6e8f?text=Medical Center Elizabeth'; }} />
            </div>
          </div>
        </section>

        {/* Nos valeurs */}
        <section style={{ padding: '3rem 0', background: '#f9fcfd' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <h2 style={{ textAlign: 'center', color: '#0b6e8f', marginBottom: '2rem' }}>Nos valeurs fondatrices</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <i className="fas fa-hand-holding-heart" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3>Humanité</h3>
                <p>Respect, écoute et compassion envers chaque patient.</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <i className="fas fa-microchip" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3>Innovation</h3>
                <p>Adoption constante des avancées technologiques.</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <i className="fas fa-users" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3>Collaboration</h3>
                <p>Équipes pluridisciplinaires soudées autour du patient.</p>
              </div>
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                <i className="fas fa-chart-line" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3>Excellence</h3>
                <p>Recherche de la meilleure qualité de soins.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Chiffres clés */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <h2 style={{ textAlign: 'center', color: '#0b6e8f', marginBottom: '2rem' }}>Quelques chiffres</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', background: '#f0f7fc', borderRadius: '2rem', padding: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#0b6e8f' }}>150+</h3>
                <p>Spécialistes</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#0b6e8f' }}>98%</h3>
                <p>Patients satisfaits</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#0b6e8f' }}>24/7</h3>
                <p>Service d’urgence</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2.5rem', color: '#0b6e8f' }}>15+</h3>
                <p>Spécialités médicales</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer (identique à l'accueil, dynamique via API) */}
        <footer style={{ background: '#061e28', color: '#cfdfe9', padding: '3rem 0 1.5rem', marginTop: '2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <h4>Medical Center Elizabeth</h4>
              <p><i className="fas fa-map-marker-alt"></i> {escapeHtml(footer.adresse || '33 Avenue de l\'Innovation, Bukavu 75012')}</p>
              <p><i className="fas fa-phone-alt"></i> {escapeHtml(footer.telephone || '+33 (0)1 88 88 88 88')}</p>
              <p><i className="fas fa-clock"></i> {escapeHtml(footer.urgences || 'Urgences 24/7 - Accès permanent')}</p>
            </div>
            <div>
              <h4>Dernières technologies</h4>
              <ul style={{ listStyle: 'none' }}>
                {(footer.technologies || '').split('\n').filter(t => t.trim()).map((t, i) => <li key={i}>▪ {escapeHtml(t.trim())}</li>)}
              </ul>
            </div>
            <div>
              <h4>Liens utiles</h4>
              {(footer.liens || '').split('\n').filter(l => l.trim()).map((l, i) => {
                const [texte, url] = l.split('|');
                return <p key={i}><a href={url || '#'} style={{ color: '#cfdfe9', textDecoration: 'none' }}>{escapeHtml(texte)}</a></p>;
              })}
            </div>
            <div>
              <h4>Suivez-nous</h4>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '1.5rem' }}>
                {(footer.reseaux || '').split(',').map((icon, i) => <i key={i} className={icon.trim()}></i>)}
              </div>
            </div>
          </div>
          <div className="copyright" style={{ textAlign: 'center', borderTop: '1px solid #2d4a5a', paddingTop: '2rem', marginTop: '2rem', fontSize: '0.8rem' }}>
            <p>{escapeHtml(footer.copyright || '© 2026 Medical Center Elizabeth — Hôpital de dernière génération. Soins augmentés, éthique et excellence.')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default About;