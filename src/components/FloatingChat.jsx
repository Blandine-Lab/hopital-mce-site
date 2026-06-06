// src/components/FloatingChat.jsx
import { useState } from 'react';

function FloatingChat() {
  const [chatActive, setChatActive] = useState(false);
  const [chatFeedback, setChatFeedback] = useState('');

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('#chatName').value;
    const email = form.querySelector('#chatEmail').value;
    const subject = form.querySelector('#chatSubject').value;
    const message = form.querySelector('#chatMessage').value;
    if (!name || !email || !subject || !message) {
      setChatFeedback('<span style="color:red;">Tous les champs sont requis.</span>');
      return;
    }
    setChatFeedback('<span style="color:blue;">Envoi en cours...</span>');
    try {
      const res = await fetch('https://hopital-mce-site.onrender.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'visitor',
          sender_id: 0,
          sender_name: name,
          receiver_type: 'staff',
          receiver_id: 1,
          receiver_name: 'Administration',
          subject: subject,
          message: message,
          reply_to_id: null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatFeedback('<span style="color:green;">✅ Message envoyé ! Nous vous répondrons rapidement.</span>');
        form.reset();
        setTimeout(() => {
          setChatActive(false);
          setChatFeedback('');
        }, 3000);
      } else {
        setChatFeedback(`<span style="color:red;">Erreur : ${data.error || 'Envoi impossible'}</span>`);
      }
    } catch (err) {
      setChatFeedback('<span style="color:red;">Erreur réseau. Veuillez réessayer.</span>');
    }
  };

  return (
    <>
      <div className="floating-chat" onClick={() => setChatActive(!chatActive)}>
        <div className="chat-bubble">
          <i className="fas fa-comment-dots"></i>
        </div>
        <span className="chat-tooltip">Chat en direct</span>
      </div>
      <div className={`chat-modal ${chatActive ? 'active' : ''}`}>
        <div className="chat-header">
          <h3>💬 Envoyez-nous un message</h3>
          <button className="close-chat" onClick={() => setChatActive(false)}>&times;</button>
        </div>
        <div className="chat-body">
          <form id="chatForm" onSubmit={handleChatSubmit}>
            <input type="text" id="chatName" placeholder="Votre nom" required />
            <input type="email" id="chatEmail" placeholder="Votre email" required />
            <input type="text" id="chatSubject" placeholder="Sujet" required />
            <textarea id="chatMessage" rows="3" placeholder="Votre message..." required></textarea>
            <button type="submit">Envoyer le message</button>
            <div id="chatFeedback" className="chat-message" dangerouslySetInnerHTML={{ __html: chatFeedback }}></div>
          </form>
        </div>
      </div>
    </>
  );
}

export default FloatingChat;