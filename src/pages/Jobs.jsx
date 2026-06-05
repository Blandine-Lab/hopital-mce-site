import { useState, useEffect } from 'react';

const API_BASE = '/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [footer, setFooter] = useState({});
  
  // États pour la modale de candidature
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
    cvFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetch(`${API_BASE}/jobs`)
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(err => console.error(err));

    fetch(`${API_BASE}/site-content/footer`)
      .then(res => res.json())
      .then(data => setFooter(data))
      .catch(err => console.error(err));
  }, []);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      message: '',
      cvFile: null
    });
    setSubmitStatus({ type: '', message: '' });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, cvFile: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.cvFile) {
      setSubmitStatus({ type: 'error', message: 'Veuillez remplir tous les champs obligatoires (*)' });
      return;
    }

    setUploading(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // 1. Upload du CV
      const cvFormData = new FormData();
      cvFormData.append('cv', formData.cvFile);
      const uploadRes = await fetch(`${API_BASE}/upload/cv`, { method: 'POST', body: cvFormData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Erreur upload CV');
      const cvUrl = uploadData.cvUrl;

      // 2. Envoi de la candidature
      const applicationData = {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || '',
        message: formData.message || '',
        cvUrl: cvUrl
      };
      const appRes = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });
      const appData = await appRes.json();
      if (!appRes.ok) throw new Error(appData.error || 'Erreur envoi candidature');

      setSubmitStatus({ type: 'success', message: '✅ Candidature envoyée avec succès ! Nous vous répondrons rapidement.' });
      setTimeout(() => {
        setShowModal(false);
        setSubmitStatus({ type: '', message: '' });
      }, 2000);
    } catch (err) {
      console.error(err);
      setSubmitStatus({ type: 'error', message: `❌ ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Chargement des offres...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* En-tête */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          💼 Rejoignez l’excellence du <span style={{ color: '#2ec4b6' }}>Medical Center Elizabeth</span>
        </h1>
        <p style={styles.subtitle}>
          Des métiers qui ont du sens, <span style={{ color: '#e63946' }}>des équipes à la pointe</span>, un cadre d’exception.
        </p>
        <div style={styles.redAccent}></div>
      </div>

      {/* Grille des offres */}
      <div style={styles.grid}>
        {jobs.length === 0 ? (
          <p style={styles.noOffers}>Aucune offre d’emploi pour le moment. Revenez bientôt !</p>
        ) : (
          jobs.map((job, index) => (
            <div 
              key={job.id} 
              className="job-card"
              style={{
                ...styles.card,
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <div style={styles.cardHeader}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <span style={styles.contract}>{job.contract_type}</span>
              </div>
              <div style={styles.details}>
                <p><strong>🏢 Département :</strong> {job.department}</p>
                <p><strong>📍 Localisation :</strong> {job.location}</p>
                {job.salary_range && <p><strong>💰 Salaire :</strong> {job.salary_range}</p>}
                {job.deadline && <p><strong>📅 Date limite :</strong> {new Date(job.deadline).toLocaleDateString()}</p>}
              </div>
              <div style={styles.description}>
                <p><strong>📋 Description :</strong></p>
                <p>{job.description}</p>
                <p><strong>🎯 Prérequis :</strong></p>
                <p>{job.requirements}</p>
              </div>
              <button 
                className="apply-btn"
                style={styles.button}
                onClick={() => handleApplyClick(job)}
              >
                Postuler maintenant →
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODALE DE CANDIDATURE */}
      {showModal && selectedJob && (
        <div style={styles.modalOverlay} onClick={() => !uploading && setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>📄 Candidature pour : {selectedJob.title}</h3>
              <button style={styles.closeBtn} onClick={() => !uploading && setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Nom complet *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
              </div>
              <div style={styles.formGroup}>
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div style={styles.formGroup}>
                <label>Téléphone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div style={styles.formGroup}>
                <label>Message (lettre de motivation)</label>
                <textarea name="message" rows="4" value={formData.message} onChange={handleInputChange}></textarea>
              </div>
              <div style={styles.formGroup}>
                <label>CV (PDF, DOC, DOCX) *</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                <small>Formats acceptés : PDF, Word – max 5 Mo</small>
              </div>
              {submitStatus.message && (
                <div style={submitStatus.type === 'success' ? styles.successMsg : styles.errorMsg}>
                  {submitStatus.message}
                </div>
              )}
              <button type="submit" style={styles.submitBtn} disabled={uploading}>
                {uploading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer (modifiable depuis l'admin) */}
      <footer style={styles.footer}>
        <div style={styles.footerGrid}>
          <div style={styles.footerCol}>
            <h4>{escapeHtml(footer.etablissement || 'Medical Center Elizabeth')}</h4>
            <p><i className="fas fa-map-marker-alt"></i> {escapeHtml(footer.adresse || '')}</p>
            <p><i className="fas fa-phone-alt"></i> {escapeHtml(footer.telephone || '')}</p>
            <p><i className="fas fa-clock"></i> {escapeHtml(footer.urgences || '')}</p>
          </div>
          <div style={styles.footerCol}>
            <h4>Dernières technologies MCE</h4>
            <ul style={styles.footerList}>
              {(footer.technologies || '').split('\n').filter(t => t.trim()).map((t, idx) => <li key={idx}>{escapeHtml(t.trim())}</li>)}
            </ul>
          </div>
          <div style={styles.footerCol}>
            <h4>Liens utiles</h4>
            {(footer.liens || '').split('\n').filter(l => l.trim()).map((ligne, idx) => {
              const [texte, url] = ligne.split('|');
              return <p key={idx}><a href={escapeHtml(url || '#')} style={styles.footerLink}>{escapeHtml(texte)}</a></p>;
            })}
          </div>
          <div style={styles.footerCol}>
            <h4>Suivez-nous</h4>
            <div style={styles.socialIcons}>
              {(footer.reseaux || '').split(',').map((icon, idx) => <i key={idx} className={icon.trim()} style={styles.socialIcon}></i>)}
            </div>
          </div>
        </div>
        <div style={styles.copyright}>
          <p>{escapeHtml(footer.copyright || '© 2026 Medical Center Elizabeth')}</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #e9ecef;
          border-top: 5px solid #0b6e8f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .job-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .job-card:hover { transform: translateY(-8px); box-shadow: 0 20px 30px -12px rgba(0, 0, 0, 0.15); }
        .apply-btn { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f7fc 100%)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem 1rem',
    background: 'white',
    borderRadius: '32px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#1e2a3a',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#4a627a',
    maxWidth: '700px',
    margin: '0 auto',
  },
  redAccent: {
    width: '80px',
    height: '4px',
    background: '#e63946',
    margin: '1rem auto 0',
    borderRadius: '2px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '2rem',
    flex: 1,
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid rgba(46, 196, 182, 0.2)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #eef2f6',
    paddingBottom: '0.75rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  jobTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#0b6e8f',
    margin: 0,
  },
  contract: {
    background: '#2ec4b6',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '50px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  details: {
    fontSize: '0.9rem',
    color: '#2c3e50',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  description: {
    fontSize: '0.9rem',
    color: '#4a627a',
    marginTop: '0.5rem',
    borderTop: '1px solid #e9ecef',
    paddingTop: '1rem',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#0b6e8f',
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    background: 'white',
    borderRadius: '28px',
    padding: '2rem',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '1rem',
    marginBottom: '1.5rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    color: '#6c757d',
  },
  formGroup: {
    marginBottom: '1.2rem',
    textAlign: 'left',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: '#0b6e8f',
    color: 'white',
    border: 'none',
    borderRadius: '40px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  successMsg: {
    background: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  errorMsg: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  footer: {
    marginTop: '4rem',
    background: '#1e2a3a',
    color: '#e9ecef',
    padding: '2rem 1rem 1rem',
    borderRadius: '24px 24px 0 0',
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerCol: { textAlign: 'left' },
  footerList: { listStyle: 'none', padding: 0, margin: 0 },
  footerLink: { color: '#2ec4b6', textDecoration: 'none' },
  socialIcons: { display: 'flex', gap: '1rem', fontSize: '1.5rem' },
  socialIcon: { cursor: 'pointer' },
  copyright: { textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #2c3e50', fontSize: '0.8rem', color: '#adb5bd' },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    fontFamily: 'sans-serif',
    color: '#0b6e8f',
  },
  noOffers: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#6c757d',
    gridColumn: '1 / -1',
    padding: '2rem',
  },
};

export default Jobs;