// src/pages/Support.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://hopital-mce-site.onrender.com';

function Support() {
  const [footer, setFooter] = useState({});
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    montant: '20',
    montantAutre: '',
    recuFiscal: false
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/site-content/footer`)
      .then(res => res.json())
      .then(data => setFooter(data))
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let montant = formData.montant;
    if (montant === 'autre') {
      montant = formData.montantAutre;
    }
    
    if (!montant || parseFloat(montant) <= 0) {
      setStatus({ type: 'error', message: 'Veuillez saisir un montant valide' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: 'info', message: 'Initialisation du paiement...' });
    
    try {
      // 1. Initier le paiement
      const initRes = await fetch(`${API_BASE}/paiement/initier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: parseFloat(montant),
          methode: 'carte',
          telephone: formData.telephone,
          email: formData.email,
          nom: formData.nom
        })
      });
      const initData = await initRes.json();
      
      if (!initRes.ok) throw new Error(initData.error || 'Erreur d’initiation');
      
      setStatus({ type: 'info', message: `Code de confirmation : ${initData.code}. Veuillez confirmer.` });
      
      // 2. Demander confirmation (simulation)
      const confirmer = window.confirm(`Confirmer le don de ${montant}€ avec le code ${initData.code} ? (Simulation)`);
      if (!confirmer) {
        setStatus({ type: 'warning', message: 'Paiement annulé.' });
        setLoading(false);
        return;
      }
      
      // 3. Confirmer le paiement
      const confirmRes = await fetch(`${API_BASE}/paiement/confirmer/${initData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initData.code })
      });
      const confirmData = await confirmRes.json();
      
      if (confirmRes.ok) {
        setStatus({
          type: 'success',
          message: `✅ Merci ${formData.nom} pour votre don de ${montant} € ! ${formData.recuFiscal ? 'Un reçu fiscal vous sera envoyé.' : ''}`,
          factureUrl: confirmData.facture_url
        });
        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          email: '',
          telephone: '',
          montant: '20',
          montantAutre: '',
          recuFiscal: false
        });
      } else {
        throw new Error(confirmData.error || 'Erreur de confirmation');
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (status.type !== 'success') setStatus({});
      }, 5000);
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Image en arrière-plan (optionnelle) – décommentez si vous avez support.jpg */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/support.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }}></div> */}
      
      {/* Overlay (si image) */}
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
            <h1 style={{ fontSize: '2.8rem', color: '#0b6e8f', marginBottom: '1rem' }}>Nous soutenir</h1>
            <p style={{ color: '#2c4b62', maxWidth: '700px', margin: '0 auto' }}>
              Votre générosité contribue à l’innovation médicale et à l’amélioration des soins pour tous.
            </p>
          </div>
        </div>

        {/* Options de soutien */}
        <section style={{ padding: '3rem 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Carte 1 - Faire un don */}
              <div style={{
                flex: 1,
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                border: '1px solid #eef2f8'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                <i className="fas fa-hand-holding-heart" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3 style={{ marginBottom: '1rem', color: '#0b6e8f' }}>Faire un don</h3>
                <p style={{ color: '#4a6b80', lineHeight: '1.5', marginBottom: '1.5rem' }}>Soutenez la recherche, les équipements de pointe et l’accès aux soins pour les plus démunis.</p>
                <a href="#don" style={{ background: '#0b6e8f', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '2rem', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}>Je donne maintenant</a>
              </div>
              {/* Carte 2 - Mécénat */}
              <div style={{
                flex: 1,
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                border: '1px solid #eef2f8'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                <i className="fas fa-building" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3 style={{ marginBottom: '1rem', color: '#0b6e8f' }}>Mécénat d’entreprise</h3>
                <p style={{ color: '#4a6b80', lineHeight: '1.5', marginBottom: '1.5rem' }}>Devenez partenaire de l’hôpital et bénéficiez d’une visibilité auprès de nos équipes et patients.</p>
                <a href="/contact" style={{ background: '#2ec4b6', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '2rem', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}>Nous contacter</a>
              </div>
              {/* Carte 3 - Bénévolat */}
              <div style={{
                flex: 1,
                background: 'white',
                borderRadius: '1.5rem',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                border: '1px solid #eef2f8'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                <i className="fas fa-users" style={{ fontSize: '2.5rem', color: '#2ec4b6', marginBottom: '1rem' }}></i>
                <h3 style={{ marginBottom: '1rem', color: '#0b6e8f' }}>Bénévolat</h3>
                <p style={{ color: '#4a6b80', lineHeight: '1.5', marginBottom: '1.5rem' }}>Rejoignez notre équipe de bénévoles pour accompagner les patients et animer la vie de l’hôpital.</p>
                <a href="/contact" style={{ background: '#2ec4b6', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '2rem', textDecoration: 'none', fontWeight: '600', display: 'inline-block' }}>Devenir bénévole</a>
              </div>
            </div>

            {/* Formulaire de don */}
            <div id="don" style={{
              background: '#f0f7fc',
              borderRadius: '2rem',
              padding: '2rem',
              marginTop: '2rem'
            }}>
              <h3 style={{ color: '#0b6e8f', marginBottom: '1rem' }}><i className="fas fa-credit-card"></i> Formulaire de don en ligne</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Nom complet" required style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ccc' }} /></div>
                  <div><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ccc' }} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Téléphone" style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ccc' }} /></div>
                  <div>
                    <select name="montant" value={formData.montant} onChange={handleChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ccc' }}>
                      <option value="20">20 €</option>
                      <option value="50">50 €</option>
                      <option value="100">100 €</option>
                      <option value="autre">Autre montant</option>
                    </select>
                  </div>
                </div>
                {formData.montant === 'autre' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <input type="number" name="montantAutre" value={formData.montantAutre} onChange={handleChange} placeholder="Montant personnalisé (€)" style={{ width: '100%', padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ccc' }} />
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <label>
                    <input type="checkbox" name="recuFiscal" checked={formData.recuFiscal} onChange={handleChange} /> Envoyer un reçu fiscal
                  </label>
                </div>
                <button type="submit" disabled={loading} style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '2rem', fontWeight: '600', cursor: 'pointer', width: '100%' }}>
                  {loading ? 'Traitement en cours...' : 'Faire un don sécurisé'}
                </button>
              </form>
              {status.message && (
                <div style={{
                  marginTop: '1rem',
                  textAlign: 'center',
                  padding: '0.5rem',
                  borderRadius: '1rem',
                  background: status.type === 'success' ? '#d4edda' : status.type === 'error' ? '#f8d7da' : '#cce5ff',
                  color: status.type === 'success' ? '#155724' : status.type === 'error' ? '#721c24' : '#004085'
                }}>
                  {status.message}
                  {status.factureUrl && (
                    <div><a href={status.factureUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0b6e8f' }}>📄 Télécharger le reçu</a></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer (identique à l'accueil, dynamique) */}
        <footer style={{ background: '#061e28', color: '#cfdfe9', padding: '3rem 0 1.5rem', marginTop: '2rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <h4>Medical Center Elizabeth</h4>
              <p><i className="fas fa-map-marker-alt"></i> {escapeHtml(footer.adresse || '33 Avenue de l\'Innovation, Paris 75012')}</p>
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
            <p>{escapeHtml(footer.copyright || '© 2026 Medical Center Elizabeth — Soins d\'excellence, éthique et innovations médicales.')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Support;