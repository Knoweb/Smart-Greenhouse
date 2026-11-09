import React from 'react';
import { Settings2, Wifi, Users, Sliders } from 'lucide-react';

const SettingsComponent = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
      <div className="glass-panel col-span-6" style={{ gridColumn: 'span 6', padding: '24px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} /> Threshold Configuration
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Max Temperature (°C)</label>
            <input type="number" defaultValue={30} style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.3)', color: 'white'
            }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Min Humidity (%)</label>
            <input type="number" defaultValue={40} style={{ 
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.3)', color: 'white'
            }} />
          </div>
          <button style={{ 
            background: 'var(--primary)', color: 'white', border: 'none', 
            padding: '12px', borderRadius: '8px', cursor: 'pointer', marginTop: '8px'
          }}>Save Thresholds</button>
        </div>
      </div>

      <div className="col-span-6" style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} /> User Management
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Admin User</div>
              <div style={{ color: 'var(--text-muted)' }}>Full Access</div>
            </div>
            <button style={{ 
              padding: '6px 12px', background: 'transparent', border: '1px solid var(--primary)', 
              color: 'var(--primary)', borderRadius: '6px'
            }}>Edit</button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wifi size={20} /> Network Settings
          </h3>
          <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>MQTT Broker: <b>mqtt://broker.emqx.io:1883</b></div>
          <div style={{ color: 'var(--accent-water)', fontWeight: 'bold' }}>Connected</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
