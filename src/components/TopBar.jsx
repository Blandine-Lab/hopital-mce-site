// src/components/TopBar.jsx
import { Link } from 'react-router-dom';

function TopBar() {
  return (
    <div className="top-bar">
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/espace-patient"><i className="fas fa-user"></i> Portail patient</Link>
        <a href="#"><i className="fas fa-language"></i> English version</a>
        <Link to="/support"><i className="fas fa-heart"></i> Je fais un don</Link>
        <a href="#"><i className="fas fa-stethoscope"></i> Trouver un médecin</a>
      </div>
      <div style={{ fontSize: '0.75rem' }}>
        <i className="fas fa-phone-alt"></i> Urgences 24/7 : +33 (0)1 88 88 88 88
      </div>
    </div>
  )
}

export default TopBar