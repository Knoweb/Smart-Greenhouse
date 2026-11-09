import React from 'react';
import { Fan, Droplets, Wind, Zap, Thermometer, Shrub, Blinds, Power } from 'lucide-react';

const ICONS = {
  pump: Droplets,
  fan: Fan,
  wind: Wind,
  light: Zap,
  temp: Thermometer,
  plant: Shrub,
  curtain: Blinds,
};

const DeviceToggle = ({ label, subLabel, isOn, onToggle, iconKey, readOnly = false }) => {
  const Icon = ICONS[iconKey] || Power;
  const isFan = iconKey === 'fan';

  return (
    <div 
      className={`toggle-wrap ${isOn ? 'on' : ''}`} 
      onClick={readOnly ? undefined : onToggle}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isOn ? 'var(--accent-green-dim)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isOn ? 'rgba(34,197,94,0.4)' : 'transparent'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isOn ? 'var(--accent-green)' : 'var(--text-muted)',
          flexShrink: 0,
        }}>
          <Icon size={18} className={isOn && isFan ? 'fan-spin' : ''} />
        </div>
        <div>
          <div className="toggle-label">{label}</div>
          {subLabel && <div className="toggle-status">{subLabel}</div>}
        </div>
      </div>
      <button className={`toggle-btn ${isOn ? 'on' : ''}`} onClick={onToggle}>
        <div className="toggle-knob" />
      </button>
    </div>
  );
};

export default DeviceToggle;
