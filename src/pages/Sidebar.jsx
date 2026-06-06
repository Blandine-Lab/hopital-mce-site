// src/components/Sidebar.jsx
import { Link } from 'react-router-dom';

function Sidebar() {
  const menuItems = [
    { path: '/', label: '🏠 Accueil', icon: 'fas fa-home' },
    { path: '/nos-specialites', label: '📋 Spécialités', icon: 'fas fa-stethoscope' },
    { path: '/checkup-center', label: '🔬 Check-up', icon: 'fas fa-heartbeat' },
    { path: '/about', label: '📖 Nous connaître', icon: 'fas fa-info-circle' },
    { path: '/support', label: '🤝 Nous soutenir', icon: 'fas fa-hand-holding-heart' },
    { path: '/contact', label: '📞 Contact', icon: 'fas fa-envelope' },
    { path: '/jobs', label: '💼 Offres d\'emploi', icon: 'fas fa-briefcase' },
    { path: '/trouver-professionnel', label: '👨‍⚕️ Trouver un médecin', icon: 'fas fa-user-md' },
    { path: '/info-patients', label: '📋 Infos patients', icon: 'fas fa-notes-medical' },
    { path: '/espace-patient', label: '👤 Espace Patient', icon: 'fas fa-user-circle' },
    { path: '/espace-medecin', label: '⚕️ Espace Médecin', icon: 'fas fa-user-md' },
    { path: '/messages-patient', label: '💬 Messagerie', icon: 'fas fa-comments' },
    { path: 'https://hopital-mce-site.onrender.com/admin', label: '🔧 Administration', icon: 'fas fa-lock' },
  ];

  return (
    <div style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#dc3545',
      color: 'white',
      zIndex: 1000,
      overflowY: 'auto',
      boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Menu rapide</h3>
      </div>
      <nav style={{ padding: '10px 0' }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              color: 'white',
              textDecoration: 'none',
              transition: 'background 0.2s',
              fontSize: '0.9rem',
              borderLeft: '3px solid transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className={item.icon} style={{ width: '20px' }}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;