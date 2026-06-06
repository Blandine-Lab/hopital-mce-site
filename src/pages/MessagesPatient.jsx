import { API_BASE } from '../config';
// src/pages/MessagesPatient.jsx
import { useState, useEffect } from 'react';

function MessagesPatient() {
  const [token, setToken] = useState(localStorage.getItem('patientToken'));
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setPatient({ id: payload.id, name: payload.name });
    } catch (e) {}
    loadDoctors();
    fetchMessages();
  }, [token]);

  const loadDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      const data = await res.json();
      setDoctors(data.filter(d => d.profession === 'Médecin'));
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/messages/patient/${patient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !newMessageText.trim()) {
      setFeedback('Choisissez un médecin et écrivez un message.');
      return;
    }
    setFeedback('Envoi en cours...');
    try {
      const doctor = doctors.find(d => d.id == selectedDoctorId);
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sender_type: 'patient',
          sender_id: patient.id,
          sender_name: patient.name,
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
        setFeedback('✅ Message envoyé !');
        setNewMessageText('');
        fetchMessages();
      } else {
        setFeedback(`❌ Erreur : ${data.error || 'Envoi impossible'}`);
      }
    } catch (err) {
      setFeedback('❌ Erreur réseau');
    }
  };

  const logout = () => {
    localStorage.removeItem('patientToken');
    setToken(null);
    setPatient(null);
  };

  const goToLogin = () => {
    window.location.href = '/espace-patient';
  };

  if (!token) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2>🔒 Accès réservé</h2>
        <p>Vous devez être connecté pour accéder à votre messagerie.</p>
        <button onClick={goToLogin} style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>
          Se connecter / S'inscrire
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/message.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }}></div>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1000px',
        margin: '2rem auto',
        padding: '0 1rem'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#0b6e8f', margin: 0 }}>💬 Espace Messagerie</h1>
            <button onClick={logout} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}>Déconnexion</button>
          </div>
          <p style={{ marginBottom: '1.5rem', color: '#4a627a' }}>
            Bonjour, <strong>{patient?.name}</strong> – Vous pouvez envoyer un message à un médecin. Les réponses apparaîtront ci-dessous.
          </p>

          <form onSubmit={sendMessage} style={{ marginBottom: '2rem', background: '#f8f9fa', padding: '1rem', borderRadius: '20px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Médecin destinataire</label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #cbd5e0' }}
              >
                <option value="">-- Choisir un médecin --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.full_name} ({d.specialty || d.profession})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Votre message</label>
              <textarea
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                rows="4"
                required
                placeholder="Écrivez votre message ici..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #cbd5e0' }}
              ></textarea>
            </div>
            <button type="submit" style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '2rem', cursor: 'pointer' }}>
              Envoyer
            </button>
            {feedback && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: feedback.includes('✅') ? 'green' : 'red' }}>{feedback}</div>}
          </form>

          <h3 style={{ marginBottom: '1rem' }}>Historique des messages</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : messages.length === 0 ? (
            <p>Aucun message pour le moment.</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
                  <div>
                    <strong>{msg.sender_name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#718096', marginLeft: '0.5rem' }}>
                      {new Date(msg.sent_date).toLocaleString()}
                    </span>
                    {msg.sender_type === 'doctor' && <span style={{ background: '#2ec4b6', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', marginLeft: '0.5rem' }}>Médecin</span>}
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                  {msg.reply_to_id && <small style={{ color: '#2ec4b6' }}>↳ Réponse à un message précédent</small>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPatient;