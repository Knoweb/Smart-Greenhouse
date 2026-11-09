import React from 'react';
import { Settings, Square, Circle } from 'lucide-react';

const FertilizerTankManagement = ({ fertLevel = 50 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Tank Status Card */}
      <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ color: '#0ea5e9' }}>
            <Square size={20} strokeWidth={2.5} />
          </div>
          <h3 style={{ color: 'var(--v4-text-primary)', fontSize: 18, margin: 0, fontWeight: 700 }}>Tank Status</h3>
        </div>
        <p style={{ color: 'var(--v4-text-secondary)', fontSize: 13, marginBottom: 30 }}>Fertilizer tank levels and conditions</p>

        {/* Single Fertilizer Tank Status */}
        <div className="tank-bar-card" style={{ marginBottom: 20 }}>
          <div className="tank-bar-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="tank-bar-label" style={{ color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 600 }}>Fertilizer Tank</span>
            <span className="tank-bar-pct" style={{ color: 'var(--v4-text-secondary)', fontSize: 13, fontWeight: 700 }}>{Math.round(fertLevel)}%</span>
          </div>
          <div className="tank-bar-track" style={{ width: '100%', height: 10, background: 'var(--v4-card-bg)', borderRadius: 5, marginBottom: 10, overflow: 'hidden' }}>
            <div
              className="tank-bar-fill"
              style={{
                width: `${fertLevel}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f97316, #fb923c)',
                borderRadius: 5
              }}
            />
          </div>
          <div className="tank-bar-footer" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--v4-text-muted)', fontSize: 12 }}>
            <span>0 L</span>
            <span>500 L</span>
          </div>
        </div>
      </div>

      {/* Chemical Parameters & Status Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Chemical Parameters Card */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ color: 'var(--v4-text-muted)' }}>
              <Circle size={20} strokeWidth={2.5} />
            </div>
            <h3 style={{ color: 'var(--v4-text-primary)', fontSize: 18, margin: 0, fontWeight: 700 }}>Chemical Parameters</h3>
          </div>
          <p style={{ color: 'var(--v4-text-secondary)', fontSize: 13, marginBottom: 30 }}>Real-time fertilizer solution monitoring</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 46, fontWeight: 800, color: '#3b82f6', letterSpacing: '-1.5px', marginBottom: 4 }}>5.9</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v4-text-primary)' }}>pH Level</div>
              <div style={{ fontSize: 13, color: 'var(--v4-text-muted)', marginTop: 4 }}>Target: 6.0</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 46, fontWeight: 800, color: '#10b981', letterSpacing: '-1.5px', marginBottom: 4 }}>2.4</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v4-text-primary)' }}>EC Level</div>
              <div style={{ fontSize: 13, color: 'var(--v4-text-muted)', marginTop: 4 }}>mS/cm</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--v4-text-secondary)', fontSize: 14 }}>Temperature</div>
              <div style={{ color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700 }}>22.1°C</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--v4-text-secondary)', fontSize: 14 }}>Dissolved Oxygen</div>
              <div style={{ color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700 }}>8.2 mg/L</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: 'var(--v4-text-secondary)', fontSize: 14 }}>Last Mixed</div>
              <div style={{ color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700 }}>2 hours ago</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FertilizerTankManagement;
