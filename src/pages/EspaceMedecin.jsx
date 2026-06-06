import { API_BASE } from '../config';
// src/pages/EspaceMedecin.jsx
import { useState, useEffect } from 'react';


function EspaceMedecin() {
  const [token, setToken] = useState(localStorage.getItem('doctorToken'));
  const [doctor, setDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('messages');
  const [replyText, setReplyText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [feedback, setFeedback] = useState({ login: '', reply: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
  }

  const decodeDoctorFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        name: payload.name,
        specialty: payload.specialty,
        email: payload.email
      };
    } catch (e) {
      console.error('Erreur décodage token', e);
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ ...feedback, login: 'Connexion en cours...' });
    try {
      const res = await fetch(`${API_BASE}/doctor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('doctorToken', data.token);
        setToken(data.token);
        const doctorInfo = decodeDoctorFromToken(data.token);
        if (doctorInfo) {
          setDoctor(doctorInfo);
        } else if (data.doctor) {
          setDoctor(data.doctor);
        } else {
          throw new Error('Impossible de récupérer les informations du médecin');
        }
        setFeedback({ ...feedback, login: '' });
      } else {
        setFeedback({ ...feedback, login: data.error || 'Erreur de connexion' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ ...feedback, login: 'Erreur réseau ou données invalides' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('doctorToken');
    setToken(null);
    setDoctor(null);
    setMessages([]);
    setAppointments([]);
  };

  const fetchMessages = async () => {
    if (!doctor || !token) return;
    try {
      const res = await fetch(`${API_BASE}/messages/doctor/${doctor.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { logout(); return; }
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const fetchAppointments = async () => {
    if (!doctor || !token) return;
    try {
      const res = await fetch(`${API_BASE}/doctor/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) { logout(); return; }
      const data = await res.json();
      setAppointments(data);
    } catch (err) { console.error(err); }
  };

  const sendReply = async (messageId) => {
    if (!replyText.trim()) {
      setFeedback({ ...feedback, reply: 'Message vide' });
      return;
    }
    const originalMsg = messages.find(m => m.id === messageId);
    if (!originalMsg) return;
    setFeedback({ ...feedback, reply: 'Envoi...' });
    try {
      const res = await fetch(`${API_BASE}/messages/${messageId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          message: replyText,
          sender_name: doctor.name,
          sender_id: doctor.id,
          sender_type: 'doctor'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ ...feedback, reply: '✅ Réponse envoyée' });
        setReplyText('');
        setSelectedMessageId(null);
        fetchMessages();
      } else {
        setFeedback({ ...feedback, reply: data.error || 'Erreur' });
      }
    } catch (err) {
      setFeedback({ ...feedback, reply: 'Erreur réseau' });
    }
  };

  useEffect(() => {
    if (token && !doctor) {
      const doctorInfo = decodeDoctorFromToken(token);
      if (doctorInfo) setDoctor(doctorInfo);
      else logout();
    }
  }, [token]);

  useEffect(() => {
    if (doctor && token) {
      fetchMessages();
      fetchAppointments();
    }
  }, [doctor, token]);

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <h2>Espace Médecin</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #cbd5e0' }} /></div>
            <div style={{ marginBottom: '1rem' }}><label>Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #cbd5e0' }} /></div>
            <button type="submit" disabled={loading} style={{ background: '#0b6e8f', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer' }}>{loading ? 'Connexion...' : 'Se connecter'}</button>
            {feedback.login && <div style={{ marginTop: '1rem', color: feedback.login.includes('Erreur') ? 'red' : 'blue' }}>{feedback.login}</div>}
          </form>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement du profil...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Bonjour Dr. {escapeHtml(doctor.name)}</h2>
          <button onClick={logout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>Déconnexion</button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <button onClick={() => setActiveTab('messages')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'messages' ? 'bold' : 'normal', color: activeTab === 'messages' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'messages' ? '2px solid #0b6e8f' : 'none' }}>Messagerie</button>
          <button onClick={() => setActiveTab('appointments')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: activeTab === 'appointments' ? 'bold' : 'normal', color: activeTab === 'appointments' ? '#0b6e8f' : '#4a5568', borderBottom: activeTab === 'appointments' ? '2px solid #0b6e8f' : 'none' }}>Mes rendez-vous</button>
        </div>

        {activeTab === 'messages' && (
          <>
            <h3>Messages des patients</h3>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {messages.length === 0 ? <p>Aucun message.</p> : messages.map(msg => (
                <div key={msg.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
                  <div><strong>{escapeHtml(msg.sender_name)}</strong> <span style={{ fontSize: '0.8rem', color: '#718096' }}>{new Date(msg.sent_date).toLocaleString()}</span></div>
                  <p style={{ margin: '0.5rem 0' }}>{escapeHtml(msg.message)}</p>
                  {msg.reply_to_id && <p style={{ fontStyle: 'italic', color: '#2ec4b6' }}>↳ Ceci est une réponse</p>}
                  {selectedMessageId === msg.id ? (
                    <div>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows="2" placeholder="Votre réponse..." style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', marginTop: '0.5rem' }}></textarea>
                      <button onClick={() => sendReply(msg.id)} style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.3rem 1rem', borderRadius: '2rem', cursor: 'pointer', marginTop: '0.5rem' }}>Envoyer</button>
                      <button onClick={() => { setSelectedMessageId(null); setReplyText(''); }} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '0.3rem 1rem', borderRadius: '2rem', cursor: 'pointer', marginLeft: '0.5rem' }}>Annuler</button>
                    </div>
                  ) : (
                    <button onClick={() => setSelectedMessageId(msg.id)} style={{ background: '#2ec4b6', color: 'white', border: 'none', padding: '0.3rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>Répondre</button>
                  )}
                </div>
              ))}
            </div>
            {feedback.reply && <div style={{ marginTop: '1rem', color: feedback.reply.includes('✅') ? 'green' : 'red' }}>{feedback.reply}</div>}
          </>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h3>Mes rendez-vous</h3>
            {appointments.length === 0 ? <p>Aucun rendez-vous.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ background: '#0b6e8f', color: 'white' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th>Horaire</th>
                      <th>Patient</th>
                      <th>Spécialité</th>
                      <th>Message</th>
                      <th>Téléconsultation</th>
                      <th>Vu par patient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>{a.date}</td>
                        <td>{a.time}</td>
                        <td>{escapeHtml(a.fullname)}</td>
                        <td>{escapeHtml(a.specialty || '-')}</td>
                        <td>{escapeHtml(a.message || '-')}</td>
                        <td>
                          {a.teleconsultation_link && a.teleconsultation_validated ? (
                            <a href={a.teleconsultation_link} target="_blank" rel="noopener noreferrer" style={{ background: '#2ec4b6', color: 'white', padding: '4px 12px', borderRadius: '20px', textDecoration: 'none' }}>🎥 Rejoindre</a>
                          ) : (
                            <span style={{ color: '#6c757d' }}>🔒 En attente de validation</span>
                          )}
                        </td>
                        <td>{a.patient_viewed ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EspaceMedecin;