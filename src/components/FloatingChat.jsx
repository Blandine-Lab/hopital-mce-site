import { useState } from 'react';
import { API_BASE } from '../config';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          message: message
        })
      });
      if (response.ok) {
        setStatus('Message envoyé avec succès !');
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('Erreur lors de l\'envoi.');
      }
    } catch (error) {
      setStatus('Erreur réseau.');
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
        {/* Badge "chat en direct" */}
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
          width: '300px',
          maxWidth: 'calc(100vw - 40px)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
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
          <div style={{ padding: '16px' }}>
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
                  marginBottom: '10px',
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
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box'
                }}
              />
              <textarea
                placeholder="Votre message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: '#0b6e8f',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >Envoyer</button>
            </form>
            {status && (
              <p style={{
                marginTop: '10px',
                fontSize: '0.8rem',
                textAlign: 'center',
                color: status.includes('succès') ? 'green' : 'red'
              }}>{status}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}