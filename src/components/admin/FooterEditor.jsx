import { API_BASE } from '../config';
// src/components/admin/FooterEditor.jsx
import { useState, useEffect } from 'react';


function FooterEditor() {
    const [footer, setFooter] = useState({
        etablissement: '',
        adresse: '',
        telephone: '',
        urgences: '',
        technologies: '',
        liens: '',
        copyright: '',
        reseaux: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadFooter();
    }, []);

    async function loadFooter() {
        try {
            const res = await fetch(`${API_BASE}/site-content/footer`);
            const data = await res.json();
            setFooter(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch(`${API_BASE}/site-content/footer`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(footer)
            });
            if (res.ok) {
                setMessage('✅ Footer mis à jour avec succès !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Erreur lors de la mise à jour');
            }
        } catch (err) {
            setMessage('❌ Erreur réseau');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div>Chargement...</div>;

    return (
        <div style={{ padding: '20px' }}>
            {message && <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{message}</div>}
            
            <h3>🏥 Coordonnées</h3>
            <div style={{ marginBottom: '15px' }}>
                <label>Nom de l'établissement :</label>
                <input type="text" value={footer.etablissement || ''} onChange={(e) => setFooter({...footer, etablissement: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label>Adresse :</label>
                <input type="text" value={footer.adresse || ''} onChange={(e) => setFooter({...footer, adresse: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label>Téléphone :</label>
                <input type="text" value={footer.telephone || ''} onChange={(e) => setFooter({...footer, telephone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label>Urgences :</label>
                <input type="text" value={footer.urgences || ''} onChange={(e) => setFooter({...footer, urgences: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>

            <h3>🛠️ Dernières technologies (une par ligne)</h3>
            <textarea value={footer.technologies || ''} onChange={(e) => setFooter({...footer, technologies: e.target.value})} rows="4" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />

            <h3>🔗 Liens utiles (format: texte|url, un par ligne)</h3>
            <textarea value={footer.liens || ''} onChange={(e) => setFooter({...footer, liens: e.target.value})} rows="4" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />

            <h3>📝 Copyright</h3>
            <input type="text" value={footer.copyright || ''} onChange={(e) => setFooter({...footer, copyright: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />

            <h3>📱 Réseaux sociaux (icônes Font Awesome séparées par des virgules)</h3>
            <input type="text" value={footer.reseaux || ''} onChange={(e) => setFooter({...footer, reseaux: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />

            <button onClick={handleSave} disabled={saving} style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer', marginTop: '20px' }}>
                {saving ? 'Enregistrement...' : '💾 Enregistrer le footer'}
            </button>
        </div>
    );
}

export default FooterEditor;