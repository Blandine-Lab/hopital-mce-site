import { useState } from 'react';
import { API_BASE } from '../config';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Fonction pour extraire un nom de médecin à partir du message
  const extractDoctorName = (text) => {
    const lower = text.toLowerCase();
    // Cherche "Dr X", "Docteur X", "Dr. X"
    const patterns = [
      /(dr|docteur|doctor|dr\.)\s+([a-zéèêëçïî\-]+)/i,
      /médecin\s+([a-zéèêëçïî\-]+)/i,
      /spécialiste\s+([a-zéèêëçïî\-]+)/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[2]) return match[2];
    }
    // mots-clés de spécialités (retourne le mot-clé lui-même)
    const specialties = ['cardiologue', 'neurologue', 'pédiatre', 'orthopédiste', 'gynécologue', 'ophtalmologue'];
    for (const spec of specialties) {
      if (lower.includes(spec)) return spec;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: message,
      sender: name || 'Visiteur'
    };
    setConversation(prev => [...prev, userMessage]);
    const currentMessage = message;
    const currentName = name;
    setMessage('');

    try {
      // 1. Envoyer le message à l'API (stockage)
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'patient',
          sender_id: 0,
          sender_name: currentName || 'Anonyme',
          receiver_type: 'admin',
          receiver_id: 1,
          receiver_name: 'Administration',
          subject: 'Message depuis le chat',
          message: currentMessage
        })
      });

      if (!response.ok) throw new Error('Erreur envoi');

      // 2. Déterminer si la question concerne les disponibilités
      const lowerMsg = currentMessage.toLowerCase();
      const keywords = ['disponibilité', 'disponible', 'créneau', 'rdv', 'rendez-vous', 'médecin', 'docteur', 'dr', 'quand puis-je voir', 'consulter'];
      const isAvailabilityQuery = keywords.some(kw => lowerMsg.includes(kw));

      let autoReplyText = `✅ Merci ${currentName || 'vous'} pour votre message. Un conseiller vous répondra dans les meilleurs délais.`;

      if (isAvailabilityQuery) {
        const doctorName = extractDoctorName(currentMessage);
        if (doctorName) {
          try {
            const availRes = await fetch(`${API_BASE}/chat/doctor-availability?doctorName=${encodeURIComponent(doctorName)}`);
            const availData = await availRes.json();
            if (availData.reply) {
              autoReplyText = availData.reply;
            } else if (availData.error) {
              autoReplyText = `❌ ${availData.error}`;
            } else {
              autoReplyText = `❌ Désolé, je n'ai pas trouvé de médecin correspondant à "${doctorName}".`;
            }
          } catch (err) {
            console.error(err);
            autoReplyText = `❌ Désolé, je n'ai pas pu vérifier les disponibilités. Veuillez réessayer.`;
          }
        } else {
          autoReplyText = `📅 Pour connaître les disponibilités, veuillez indiquer le nom d’un médecin ou une spécialité (ex: "Disponibilité du Dr Dupont" ou "cardiologue").`;
        }
      }

      const autoReply = {
        id: Date.now() + 1,
        type: 'system',
        text: autoReplyText,
        sender: 'MCE Assistant'
      };
      setConversation(prev => [...prev, autoReply]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        id: Date.now() + 1,
        type: 'error',
        text: '❌ Erreur réseau. Veuillez réessayer.',
        sender: 'Système'
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 999,
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#dc3545',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
      >
        <i className="fas fa-comment-dots" style={{ fontSize: '24px' }}></i>
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-15px',
          backgroundColor: '#ff9f1c',
          color: '#1e2a3a',
          padding: '2px 6px',
          borderRadius: '20px',
          fontSize: '10px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          chat en direct
        </span>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          width: '320px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '500px'
        }}>
          <div style={{
            backgroundColor: '#0b6e8f',
            color: 'white',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>💬 Service client</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1
              }}
            >×</button>
          </div>
          <div style={{
            padding: '12px',
            overflowY: 'auto',
            flex: 1,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {conversation.map((msg) => (
              <div key={msg.id} style={{
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.type === 'user' ? '#0b6e8f' : (msg.type === 'system' ? '#e9ecef' : '#f8d7da'),
                color: msg.type === 'user' ? 'white' : (msg.type === 'error' ? '#721c24' : '#333'),
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '0.85rem'
              }}>
                {msg.type === 'user' && <strong>{msg.sender}</strong>}
                {msg.type === 'system' && <em style={{ fontSize: '0.75rem' }}>🤖 Assistant MCE</em>}
                <p style={{ margin: '4px 0 0 0' }}>{msg.text}</p>
              </div>
            ))}
            {isSending && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '8px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                ✏️ Envoi en cours...
              </div>
            )}
          </div>
          <div style={{ padding: '12px', borderTop: '1px solid #eee' }}>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box'
                }}
              />
              <textarea
                placeholder="Votre message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="2"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={isSending}
                style={{
                  backgroundColor: '#0b6e8f',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {isSending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}