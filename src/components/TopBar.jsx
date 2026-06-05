// src/components/TopBar.jsx
function TopBar() {
  return (
    <div className="top-bar">
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/espace-patient.html"><i className="fas fa-user"></i> Portail patient</a>
        <a href="#"><i className="fas fa-language"></i> English version</a>
        <a href="/support.html"><i className="fas fa-heart"></i> Je fais un don</a>
        <a href="#"><i className="fas fa-stethoscope"></i> Trouver un médecin</a>
      </div>
      <div style={{ fontSize: '0.75rem' }}>
        <i className="fas fa-phone-alt"></i> Urgences 24/7 : +33 (0)1 88 88 88 88
      </div>
    </div>
  )
}

export default TopBar