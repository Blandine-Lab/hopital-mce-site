import { useState } from 'react';
import { API_BASE } from '../config';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    // Ajouter le message de l'utilisateur à la conversation
    const userMessage = { id: Date.now(), type: 'user', text: message, sender: name };
    setConversation(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'patient',
          sender_id: 0,
          sender_name: name,
          receiver_type: 'admin',
          receiver_id: 1,
          receiver_name: 'Administration',
          subject: 'Message depuis le chat',
          message: currentMessage
        })
      });
      if (response.ok) {
        // Réponse automatique (simulation)
        const autoReply = {
          id: Date.now() + 1,
          type: 'system',
          text: `✅ Merci ${name} pour votre message. Un conseiller vous répondra dans les meilleurs délais.`,
          sender: 'MCE Assistant'
        };
        setConversation(prev => [...prev, autoReply]);
      } else {
        const errorMsg = { id: Date.now() + 1, type: 'error', text: '❌ Erreur lors de l\'envoi.', sender: 'Système' };
        setConversation(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      const errorMsg = { id: Date.now() + 1, type: 'error', text: '❌ Erreur réseau. Veuillez réessayer.', sender: 'Système' };
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