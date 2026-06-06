import { API_BASE } from '../config';
// src/pages/TrouverProfessionnel.jsx
import { useState, useEffect } from 'react';

function TrouverProfessionnel() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/staff`).then(res => res.json()),
      fetch(`${API_BASE}/staff/professions`).then(res => res.json()),
      fetch(`${API_BASE}/staff/departments`).then(res => res.json())
    ])
      .then(([staffData, profData, deptData]) => {
        const medecins = staffData.filter(s => s.profession === 'Médecin');
        setStaff(medecins);
        setFilteredStaff(medecins);
        setSpecialties(profData);
        setDepartments(deptData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let results = staff;
    if (searchTerm) {
      results = results.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.specialty && s.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedSpecialty) {
      results = results.filter(s => s.specialty === selectedSpecialty);
    }
    if (selectedDepartment) {
      results = results.filter(s => s.department === selectedDepartment);
    }
    setFilteredStaff(results);
  }, [searchTerm, selectedSpecialty, selectedDepartment, staff]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedDepartment('');
  };

  const handleTakeAppointment = (doctor) => {
    window.location.href = '/#appointment';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
        <p>Chargement des professionnels...</p>
        <style>{`
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #e9ecef;
            border-top: 5px solid #0b6e8f;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Image en arrière-plan */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/Prof.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0
      }}></div>

      {/* Overlay semi-transparent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1
      }}></div>

      {/* Contenu */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 1rem',
        color: 'white'
      }}>
        <h1 style={{ color: '#fff', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>👨‍⚕️ Trouver un professionnel</h1>
        <p style={{ color: '#f0f0f0', marginBottom: '2rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          Recherchez un médecin par nom, spécialité ou service, et prenez rendez-vous en ligne.
        </p>

        {/* Barre de recherche et filtres */}
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: '2rem',
          color: '#333'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Recherche</label>
              <input
                type="text"
                placeholder="Nom ou spécialité..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Spécialité</label>
              <select
                value={selectedSpecialty}
                onChange={e => setSelectedSpecialty(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }}
              >
                <option value="">Toutes</option>
                {specialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem' }}>Service</label>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '1rem' }}
              >
                <option value="">Tous</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={resetFilters}
                style={{ background: '#6c757d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer' }}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {filteredStaff.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#f0f0f0', padding: '2rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Aucun professionnel ne correspond à vos critères.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredStaff.map(doctor => (
              <div key={doctor.id} style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                padding: '1rem',
                boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                border: '1px solid #e9ecef',
                color: '#333'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: '#e9ecef',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}>
                  {doctor.photo_url ? (
                    <img src={doctor.photo_url} alt={doctor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-user-md" style={{ fontSize: '3rem', color: '#0b6e8f' }}></i>
                  )}
                </div>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem', color: '#1e2a3a' }}>{doctor.full_name}</h3>
                <p style={{ color: '#0b6e8f', fontWeight: '600', marginBottom: '0.25rem' }}>{doctor.specialty || doctor.profession}</p>
                <p style={{ fontSize: '0.9rem', color: '#4a627a' }}>{doctor.department}</p>
                {doctor.phone && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}><i className="fas fa-phone-alt"></i> {doctor.phone}</p>}
                <button
                  onClick={() => handleTakeAppointment(doctor)}
                  style={{
                    background: '#0b6e8f',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    marginTop: '1rem',
                    width: '100%',
                    fontWeight: '600'
                  }}
                >
                  Prendre rendez-vous
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrouverProfessionnel;