// src/pages/Specialties.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://hopital-mce-site.onrender.com';

function Specialties() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [footer, setFooter] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/specialties`)
      .then(res => res.json())
      .then(data => {
        const active = data.filter(s => s.active === 1);
        setSpecialties(active);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch(`${API_BASE}/site-content/footer`)
      .then(res => res.json())
      .then(data => setFooter(data))
      .catch(err => console.error(err));
  }, []);

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  const getIcon = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('neuro') || nameLower.includes('cérébral')) return 'fas fa-brain';
    if (nameLower.includes('cardio') || nameLower.includes('cœur')) return 'fas fa-heartbeat';
    if (nameLower.includes('ortho') || nameLower.includes('os')) return 'fas fa-bone';
    if (nameLower.includes('pneumo') || nameLower.includes('poumon')) return 'fas fa-lungs';
    if (nameLower.includes('gynéco') || nameLower.includes('obstét')) return 'fas fa-fetus';
    if (nameLower.includes('pédiatrie') || nameLower.includes('enfant')) return 'fas fa-child';
    if (nameLower.includes('ophtalmo') || nameLower.includes('œil')) return 'fas fa-eye';
    if (nameLower.includes('orl') || nameLower.includes('oreille')) return 'fas fa-ear-deaf';
    if (nameLower.includes('régénérat') || nameLower.includes('dna')) return 'fas fa-dna';
    if (nameLower.includes('générale')) return 'fas fa-stethoscope';
    return 'fas fa-stethoscope';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p>Chargement des spécialités...</p>
        <style>{`
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #e9ecef;
            border-top: 5px solid #0b6e8f;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Image en arrière-plan (specialities.jpg) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/specialities.jpg)',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1
      }}></div>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* En-tête */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(4px)',
          padding: '4rem 0 2rem',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <h1 style={{ fontSize: '2.8rem', color: '#0b6e8f', marginBottom: '1rem' }}>Nos spécialités</h1>
            <p style={{ color: '#1e2a3a', maxWidth: '700px', margin: '0 auto' }}>
              Une large gamme de soins de pointe, assurée par des praticiens reconnus dans leur domaine.
            </p>
          </div>
        </div>

        {/* Grille des spécialités */}
        <div style={{ maxWidth: '1280px', margin: '3rem auto', padding: '0 2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {specialties.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Aucune spécialité disponible pour le moment.</p>
            ) : (
              specialties.map(spec => (
                <div key={spec.id} style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '1.5rem',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  border: '1px solid #eef2f8'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ fontSize: '3rem', color: '#2ec4b6', marginBottom: '1rem' }}>
                    <i className={getIcon(spec.name)}></i>
                  </div>
                  <h3 style={{ color: '#0b6e8f', marginBottom: '0.5rem' }}>{escapeHtml(spec.name)}</h3>
                  <p style={{ color: '#4a6b80', lineHeight: '1.5' }}>{escapeHtml(spec.description || 'Description à venir.')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Specialties;