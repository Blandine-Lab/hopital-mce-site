import { API_BASE } from '../config';
// src/components/admin/ContentEditor.jsx
import { useState, useEffect } from 'react';


function ContentEditor({ pageType, onSave }) {
    const [content, setContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadContent();
    }, [pageType]);

    async function loadContent() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/site-content/${pageType}`);
            const data = await res.json();
            setContent(data);
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
            const res = await fetch(`${API_BASE}/site-content/${pageType}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(content)
            });
            if (res.ok) {
                setMessage('✅ Contenu mis à jour avec succès !');
                if (onSave) onSave();
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
            {message && <div style={{ background: message.includes('✅') ? '#d4edda' : '#f8d7da', color: message.includes('✅') ? '#155724' : '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{message}</div>}
            
            {Object.entries(content).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {typeof value === 'string' && value.length > 100 ? (
                        <textarea
                            value={value || ''}
                            onChange={(e) => setContent({ ...content, [key]: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '150px' }}
                        />
                    ) : (
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => setContent({ ...content, [key]: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                        />
                    )}
                </div>
            ))}
            
            <button 
                onClick={handleSave} 
                disabled={saving}
                style={{ background: '#0b6e8f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}
            >
                {saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
            </button>
        </div>
    );
}

export default ContentEditor;