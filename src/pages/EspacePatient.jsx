import { API_BASE } from '../config';
// src/pages/EspacePatient.jsx
import { useState, useEffect } from 'react';


function EspacePatient() {
  const [token, setToken] = useState(localStorage.getItem('patientToken'));
  const [activeTab, setActiveTab] = useState('login');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [results, setResults] = useState([]);
  const [messages, setMessages] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [feedback, setFeedback] = useState({ login: '', register: '', message: '', payment: '' });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFirstname, setRegFirstname] = useState('');
  const [regLastname, setRegLastname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  async function loadDoctors() {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.filter(d => d.profession === 'Médecin'));
      }
    } catch (err) { console.error(err); }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setFeedback({ ...feedback, login: 'Connexion en cours...' });
    try {
      const res = await fetch(`${API_BASE}/patient/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('patientToken', data.token);
        setToken(data.token);
        setPatientName(data.patient.name);
        setPatientId(data.patient.id);
        setFeedback({ ...feedback, login: '' });
        loadDoctors();
      } else {
        setFeedback({ ...feedback, login: data.error || 'Erreur de connexion' });
      }
    } catch (err) {
      setFeedback({ ...feedback, login: 'Erreur réseau' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFeedback({ ...feedback, register: 'Inscription en cours...' });
    try {
      const res = await fetch(`${API_BASE}/patient/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: regFirstname,
          last_name: regLastname,
          email: regEmail,
          password: regPassword,
          phone: regPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('patientToken', data.token);
        setToken(data.token);
        setPatientName(data.patient.name);
        setPatientId(data.patient.id);
        setFeedback({ ...feedback, register: '' });
        loadDoctors();
      } else {
        setFeedback({ ...feedback, register: data.error || 'Erreur d\'inscription' });
      }
    } catch (err) {
      setFeedback({ ...feedback, register: 'Erreur réseau' });
    }
  };

  const logout = () => {
    localStorage.removeItem('patientToken');
    setToken(null);
    setPatientName('');
    setPatientId(null);
    setAppointments([]);
    setResults([]);
    setMessages([]);
  };

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setPatientName(payload.name || 'Patient');
      setPatientId(payload.id);
    } catch (e) {}
    fetchAppointments();
    fetchResults();
    fetchMessages();
    loadDoctors();
  }, [token]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_BASE}/patient/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { logout(); return; }
      const data = await res.json();
      setAppointments(data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/patient/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { logout(); return; }
      const data = await res.json();
      setResults(data);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API_BASE}/messages/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { logout(); return; }
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !newMessageText.trim()) {
      setFeedback({ ...feedback, message: 'Choisissez un médecin et un message' });
      return;
    }
    setFeedback({ ...feedback, message: 'Envoi...' });
    try {
      const doctor = doctors.find(d => d.id == selectedDoctorId);
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sender_type: 'patient',
          sender_id: patientId,
          sender_name: patientName,
          receiver_type: 'doctor',
          receiver_id: selectedDoctorId,
          receiver_name: doctor.full_name,
          subject: 'Message de patient',
          message: newMessageText,
          reply_to_id: null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ ...feedback, message: '✅ Message envoyé' });
        setNewMessageText('');
        fetchMessages();
      } else {
        setFeedback({ ...feedback, message: data.error || 'Erreur' });
      }
    } catch (err) {
      setFeedback({ ...feedback, message: 'Erreur réseau' });
    }
  };

  const isNewResult = (published_at) => {
    const pubDate = new Date(published_at);
    const diffHours = (Date.now() - pubDate) / (1000 * 60 * 60);
    return diffHours < 48;
  };

  // ========== PAIEMENT D'UN RENDEZ-VOUS ==========
  const handlePayAppointment = async (appointment) => {
    if (!confirm(`Payer la consultation du ${appointment.date} à ${appointment.time} ? Montant : 30€`)) return;
    setFeedback({ ...feedback, payment: 'Initialisation du paiement...' });
    try {
      // 1. Initier le paiement pour ce rendez-vous
      const initRes = await fetch(`${API_BASE}/patient/appointments/${appointment.id}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Erreur');

      // 2. Demander la confirmation (simulation)
      const codeSaisi = prompt(`Code de confirmation : ${initData.code}\nVeuillez saisir ce code pour valider le paiement.`);
      if (codeSaisi !== initData.code) {
        setFeedback({ ...feedback, payment: '❌ Code incorrect, paiement annulé.' });
        return;
      }

      // 3. Confirmer le paiement
      const confirmRes = await fetch(`${API_BASE}/paiement/confirmer/${initData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: initData.code })
      });
      const confirmData = await confirmRes.json();
      if (confirmRes.ok) {
        setFeedback({ ...feedback, payment: '✅ Paiement confirmé ! La facture est disponible dans la liste de vos rendez-vous.' });
        fetchAppointments(); // rafraîchir la liste
      } else {
        setFeedback({ ...feedback, payment: `❌ Erreur : ${confirmData.error}` });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ ...feedback, payment: '❌ Erreur réseau' });
    }
    setTimeout(() => setFeedback({ ...feedback, payment: '' }), 5000);
  };

  // Page de connexion / inscription
  if (!token) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
            <button onClick={() => setActiveTab('login')} style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', color: activeTab === 'login' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'login' ? '3px solid #0b6e8f' : 'none' }}>Connexion</button>
            <button onClick={() => setActiveTab('register')} style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', color: activeTab === 'register' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'register' ? '3px solid #0b6e8f' : 'none' }}>Inscription</button>
          </div>
          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <h2>Connexion</h2>
              <div style={{ marginBottom: '1.2rem' }}><label style={{ display: 'block', fontWeight: '600' }}>Email</label><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <div style={{ marginBottom: '1.2rem' }}><label style={{ display: 'block', fontWeight: '600' }}>Mot de passe</label><input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <button type="submit" style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '2rem', fontWeight: '600', cursor: 'pointer' }}>Se connecter</button>
              {feedback.login && <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: feedback.login.includes('Erreur') ? 'red' : 'blue' }}>{feedback.login}</div>}
            </form>
          )}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <h2>Inscription</h2>
              <div style={{ marginBottom: '1.2rem' }}><label>Prénom</label><input type="text" value={regFirstname} onChange={e => setRegFirstname(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <div style={{ marginBottom: '1.2rem' }}><label>Nom</label><input type="text" value={regLastname} onChange={e => setRegLastname(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <div style={{ marginBottom: '1.2rem' }}><label>Email</label><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <div style={{ marginBottom: '1.2rem' }}><label>Téléphone (optionnel)</label><input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <div style={{ marginBottom: '1.2rem' }}><label>Mot de passe</label><input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required style={{ width: '100%', padding: '0.8rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }} /></div>
              <button type="submit" style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '2rem', fontWeight: '600', cursor: 'pointer' }}>Créer mon compte</button>
              {feedback.register && <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: feedback.register.includes('Erreur') ? 'red' : 'blue' }}>{feedback.register}</div>}
            </form>
          )}
        </div>
      </div>
    );
  }

  // Tableau de bord connecté
  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Bienvenue, <span style={{ color: '#0b6e8f' }}>{escapeHtml(patientName)}</span> 👋</h2>
          <button onClick={logout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>Déconnexion</button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <button onClick={() => setActiveTab('rdv')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'rdv' ? 'bold' : 'normal', color: activeTab === 'rdv' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'rdv' ? '2px solid #0b6e8f' : 'none' }}>Mes rendez-vous</button>
          <button onClick={() => setActiveTab('resultats')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'resultats' ? 'bold' : 'normal', color: activeTab === 'resultats' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'resultats' ? '2px solid #0b6e8f' : 'none' }}>Mes résultats</button>
          <button onClick={() => { setActiveTab('messagerie'); fetchMessages(); }} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'messagerie' ? 'bold' : 'normal', color: activeTab === 'messagerie' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'messagerie' ? '2px solid #0b6e8f' : 'none' }}>Messagerie</button>
        </div>

        {/* Onglet Rendez-vous */}
        {activeTab === 'rdv' && (
          <div>
            <h3><i className="fas fa-calendar-alt"></i> Mes rendez-vous</h3>
            {feedback.payment && <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#e9ecef', borderRadius: '8px' }}>{feedback.payment}</div>}
            {appointments.length === 0 ? <p>Aucun rendez-vous.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead><tr style={{ background: '#0b6e8f', color: 'white' }}>
                    <th style={{ padding: '12px' }}>Date</th><th>Horaire</th><th>Médecin</th><th>Spécialité</th>
                    <th>Téléconsultation</th><th>Facture</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>{a.date}</td>
                        <td>{a.time}</td>
                        <td>{escapeHtml(a.doctor_name || 'N/A')}</td>
                        <td>{escapeHtml(a.specialty || '-')}</td>
                        <td>
                          {a.teleconsultation_link && a.teleconsultation_validated ? (
                            <a href={a.teleconsultation_link} target="_blank" rel="noopener noreferrer" style={{ background: '#2ec4b6', color: 'white', padding: '4px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.8rem' }}>🎥 Rejoindre</a>
                          ) : (
                            <span style={{ color: '#6c757d' }}>🔒 En attente de validation</span>
                          )}
                        </td>
                        <td>
                          {a.facture_url ? (
                            <a href={a.facture_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0b6e8f' }}>📄 Reçu</a>
                          ) : (
                            <span style={{ color: '#dc3545' }}>Non payé</span>
                          )}
                        </td>
                        <td>
                          {!a.is_paid && (
                            <button onClick={() => handlePayAppointment(a)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer' }}>Payer</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Onglet Résultats (inchangé) */}
        {activeTab === 'resultats' && (
          <div>
            <h3><i className="fas fa-flask"></i> Mes résultats d'analyses</h3>
            {results.length === 0 ? <p>Aucun résultat publié.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead><tr style={{ background: '#0b6e8f', color: 'white' }}><th>Type</th><th>Description</th><th>Disponible le</th><th>Document</th></tr></thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>{escapeHtml(r.type)} {isNewResult(r.published_at) && <span style={{ background: '#ff9f1c', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '8px' }}>Nouveau</span>}</td>
                        <td>{escapeHtml(r.description)}</td><td>{new Date(r.published_at).toLocaleDateString()}</td>
                        <td><a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ background: '#0b6e8f', color: 'white', padding: '4px 12px', borderRadius: '20px', textDecoration: 'none' }}>📄 Télécharger</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Onglet Messagerie (inchangé) */}
        {activeTab === 'messagerie' && (
          <div>
            <h3><i className="fas fa-comments"></i> Messagerie avec les médecins</h3>
            <form onSubmit={sendMessage} style={{ marginBottom: '1rem' }}>
              <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} required style={{ padding: '0.5rem', borderRadius: '1rem', marginRight: '1rem', width: '100%', marginBottom: '0.5rem' }}>
                <option value="">Choisir un médecin</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{escapeHtml(d.full_name)} ({escapeHtml(d.specialty || '')})</option>)}
              </select>
              <textarea value={newMessageText} onChange={e => setNewMessageText(e.target.value)} rows="3" placeholder="Votre message..." required style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', marginBottom: '0.5rem' }}></textarea>
              <button type="submit" style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>Envoyer</button>
              {feedback.message && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: feedback.message.includes('✅') ? 'green' : 'red' }}>{feedback.message}</div>}
            </form>
            <h4>Historique des messages</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {messages.length === 0 ? <p>Aucun message.</p> : messages.map(msg => (
                <div key={msg.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '0.5rem 0', marginBottom: '0.5rem' }}>
                  <strong>{escapeHtml(msg.sender_name)}</strong> <span style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(msg.sent_date).toLocaleString()}</span>
                  <p style={{ margin: '0.3rem 0' }}>{escapeHtml(msg.message)}</p>
                  {msg.reply_to_id && <p style={{ fontStyle: 'italic', color: '#2ec4b6', marginTop: '0.2rem' }}>↳ Réponse à votre message</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EspacePatient;