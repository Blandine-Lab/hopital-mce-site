// src/pages/Contact.jsx
import { useState, useEffect } from 'react';

const API_BASE = 'https://hopital-mce-site.onrender.com';

function Contact() {
  const [footer, setFooter] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState('');

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('Envoi en cours...');
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'visitor',
          sender_id: 0,
          sender_name: formData.name,
          receiver_type: 'staff',
          receiver_id: 1,
          receiver_name: 'Administration',
          subject: formData.subject || 'Message du formulaire de contact',
          message: formData.message,
          reply_to_id: null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormStatus('✅ Message envoyé ! Nous vous répondrons rapidement.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus(`❌ Erreur : ${data.error || 'Envoi impossible'}`);
      }
    } catch (err) {
      setFormStatus('❌ Erreur réseau');
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Video en arrière-plan */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0
        }}
      >
        <source src="/video.mp4" type="video/mp4" />
        Votre navigateur ne supporte pas la vidéo.
      </video>

      {/* Overlay semi-transparent pour améliorer la lisibilité */}
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
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 1rem',
        color: 'white'
      }}>
        <h1 style={{ color: '#fff', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Nous contacter</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Coordonnées */}
          <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333' }}>
            <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>📞 Coordonnées</h2>
            <p><i className="fas fa-map-marker-alt" style={{ marginRight: '8px', color: '#2ec4b6' }}></i> {escapeHtml(footer.adresse || '33 Avenue de l\'Innovation, 75012 Paris')}</p>
            <p><i className="fas fa-phone-alt" style={{ marginRight: '8px', color: '#2ec4b6' }}></i> {escapeHtml(footer.telephone || '+33 (0)1 88 88 88 88')}</p>
            {footer.telephone2 && <p><i className="fas fa-phone-alt" style={{ marginRight: '8px', color: '#2ec4b6' }}></i> {escapeHtml(footer.telephone2)}</p>}
            <p><i className="fas fa-envelope" style={{ marginRight: '8px', color: '#2ec4b6' }}></i> {escapeHtml(footer.email || 'contact@medicalcenterelizabeth.fr')}</p>
            <p><i className="fas fa-clock" style={{ marginRight: '8px', color: '#2ec4b6' }}></i> {escapeHtml(footer.urgences || 'Urgences 24/7 : 15')}</p>
          </div>

          {/* Formulaire de contact */}
          <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333' }}>
            <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>✉️ Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Nom complet *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Sujet</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Message *</label>
                <textarea name="message" rows="4" value={formData.message} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }}></textarea>
              </div>
              <button type="submit" style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '2rem', cursor: 'pointer' }}>Envoyer</button>
              {formStatus && <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: formStatus.includes('✅') ? 'green' : 'red' }}>{formStatus}</div>}
            </form>
          </div>

          {/* Réseaux sociaux et chat Telegram */}
          <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333' }}>
            <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>🌐 Suivez-nous</h2>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '2rem', marginBottom: '1.5rem' }}>
              {(footer.reseaux || '').split(',').map((icon, idx) => (
                <i key={idx} className={icon.trim()} style={{ color: '#0b6e8f', cursor: 'pointer' }}></i>
              ))}
            </div>
            <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>💬 Chat Telegram</h2>
            <p>Rejoignez notre groupe ou envoyez un message direct :</p>
            <a href="https://t.me/ElizabethMedicalcenter_bot" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#2ec4b6', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', textDecoration: 'none', marginTop: '0.5rem' }}>
              <i className="fab fa-telegram"></i> Discuter sur Telegram
            </a>
          </div>
        </div>

        {/* Carte Google Maps (optionnelle) */}
        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.9)', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#333' }}>
          <h2 style={{ color: '#0b6e8f', marginBottom: '1rem' }}>📍 Trouvez-nous</h2>
          <div style={{ overflow: 'hidden', borderRadius: '16px' }}>
            <iframe 
              title="Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85884407928742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca6ee6a8d8f8!2s33%20Av.%20de%20l%27Innovation%2C%2075012%20Paris!5e0!3m2!1sfr!2sfr!4v1650000000000!5m2!1sfr!2sfr" 
              width="100%" 
              height="300" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;