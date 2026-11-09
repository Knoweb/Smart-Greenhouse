import React, { useState } from 'react';
import { Beaker, Trash2, Save, Sun, Edit, X } from 'lucide-react';

const LightingProfiles = ({ lightingProfiles, addLightingProfile, deleteLightingProfile, updateLightingProfile }) => {
  const [profileName, setProfileName] = useState('');
  const [intensity, setIntensity] = useState(50);
  const [editingProfileId, setEditingProfileId] = useState(null);

  const handleSave = () => {
    if (!profileName) return alert('Please enter a profile name');
    
    if (editingProfileId) {
      updateLightingProfile(editingProfileId, {
        name: profileName,
        intensity_percent: intensity
      });
      setEditingProfileId(null);
    } else {
      addLightingProfile({
        name: profileName,
        intensity_percent: intensity
      });
    }
    
    setProfileName('');
    setIntensity(50);
  };

  const handleStartEdit = (profile) => {
    setEditingProfileId(profile.id);
    setProfileName(profile.name);
    setIntensity(profile.intensity_percent);
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setProfileName('');
    setIntensity(50);
  };

  return (
    <div className="grid-12">
      
      {/* TOP PANEL: PROFILE BUILDER */}
      <div className="col-12" style={{ marginBottom: '24px' }}>
        <div className="mix-config-panel" style={{ padding: '20px 24px' }}>
          <div className="recipe-builder-section" style={{ gap: '14px' }}>
            <div className="nutrient-comp-header" style={{ marginBottom: '10px' }}>
              <div className="nutrient-header-title">
                <Beaker size={20} style={{ color: 'var(--v4-text-muted)' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--v4-text-primary)' }}>
                    {editingProfileId ? 'Edit Lighting Profile' : 'Create Lighting Profile'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--v4-text-secondary)' }}>
                    {editingProfileId ? 'Modify the selected lighting configuration' : 'Configure intensity and save as a profile'}
                  </p>
                </div>
              </div>
            </div>

            <div className="recipe-input-group">
              <label className="recipe-field-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Profile Name</label>
              <input
                className="recipe-main-input"
                placeholder="e.g. Mid-day Boost"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
            </div>

            <div className="recipe-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="recipe-field-label" style={{ margin: 0, fontSize: '12px' }}>Light Intensity</label>
                <span style={{ fontWeight: 800, color: 'var(--accent-amber, #f59e0b)', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>{intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={e => setIntensity(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-amber, #f59e0b)',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--v4-text-muted)', marginTop: 4, fontWeight: 700 }}>
                <span>OFF</span>
                <span>LOW</span>
                <span>MAX</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-save-recipe" style={{ flex: 1, padding: '10px 16px', background: 'var(--accent-amber, #f59e0b)', color: '#000', fontSize: '13px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSave}>
                <Save size={16} /> {editingProfileId ? 'Update Profile' : 'Save Light Profile'}
              </button>
              {editingProfileId && (
                <button 
                  className="btn-save-recipe" 
                  style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--v4-text-primary)', fontSize: '13px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                  onClick={handleCancelEdit}
                >
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: PROFILE LIBRARY */}
      <div className="col-12">
        <div className="premium-table-container">
          <div className="premium-table-header" style={{ marginBottom: '24px' }}>
            <h2 className="premium-table-title">
              <div className="premium-icon-box" style={{ border: '2px solid var(--accent-amber, #f59e0b)', color: 'var(--accent-amber, #f59e0b)' }}>
                <Sun size={18} />
              </div>
              Profile Library
            </h2>
            <p className="premium-table-desc">Your saved lighting configurations</p>
          </div>

          {lightingProfiles.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--v4-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              No profiles created yet. Use the builder to configure one.
            </div>
          ) : (
            <table className="premium-data-table">
              <thead>
                <tr>
                  <th style={{ color: 'var(--v4-text-primary)', fontSize: '13px', fontWeight: '800' }}>Profile Name</th>
                  <th style={{ color: 'var(--v4-text-primary)', fontSize: '13px', fontWeight: '800' }}>Intensity</th>
                  <th style={{ color: 'var(--v4-text-primary)', fontSize: '13px', fontWeight: '800' }}>Status</th>
                  <th style={{ color: 'var(--v4-text-primary)', fontSize: '13px', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lightingProfiles.map(profile => (
                  <tr key={profile.id}>
                    <td className="premium-td-bold" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>{profile.name}</td>
                    <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: '240px' }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${profile.intensity_percent}%`, height: '100%', background: 'var(--accent-amber, #f59e0b)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-amber, #f59e0b)' }}>{profile.intensity_percent}%</span>
                      </div>
                    </td>
                    <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      <span className="premium-status-badge teal" style={{ minWidth: 'auto', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', textTransform: 'uppercase' }}>saved</span>
                    </td>
                    <td style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleStartEdit(profile)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => deleteLightingProfile(profile.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default LightingProfiles;
