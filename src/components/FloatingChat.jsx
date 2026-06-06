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
    <div className="floating-chat">
      <div className="chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        <i className="fas fa-comment-dots"></i>
        <span className="chat-tooltip">Discutez avec nous</span>
      </div>
      {isOpen && (
        <div className="chat-modal active">
          <div className="chat-header">
            <h3>💬 Service client</h3>
            <button className="close-chat" onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="chat-body">
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="Votre email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <textarea placeholder="Votre message" value={message} onChange={(e) => setMessage(e.target.value)} rows="3" required></textarea>
              <button type="submit">Envoyer</button>
            </form>
            {status && <p className="chat-message">{status}</p>}
          </div>
        </div>
      )}
    </div>
  );
}