import React from 'react';
import { Fan, Droplets, Wind, Zap, Thermometer, Shrub, Blinds, Power, Sun } from 'lucide-react';

const ICONS = {
  pump: Droplets,
  irrigation: Droplets,
  misters: Wind,
  fertigation: Shrub,
  fan: Fan,
  exhaust: Fan,
  curtain: Blinds,
  light: Sun,
  lighting: Sun,
  temp: Thermometer,
  power: Power,
};

const DeviceToggle = ({ label, subLabel, isOn, onToggle, iconKey, readOnly = false }) => {
  const Icon = ICONS[iconKey] || Zap;
  const isFan = iconKey === 'fan' || iconKey === 'exhaust';

  return (
    <div
      className={`device-toggle-v4 ${isOn ? 'on' : ''}`}
      onClick={readOnly ? undefined : onToggle}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      <div className="device-toggle-v4-icon-box">
        <Icon size={24} className={isOn && isFan ? 'fan-spin' : ''} />
      </div>

      <div className="device-toggle-v4-info">
        <div className="device-toggle-v4-label">{label}</div>
        {subLabel && <div className="device-toggle-v4-status">{subLabel}</div>}
      </div>

      <div className="device-toggle-v4-action">
        <button
          className={`device-toggle-btn-v4 ${isOn ? 'on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (!readOnly) onToggle();
          }}
        >
          <div className="device-toggle-knob-v4" />
        </button>
      </div>
    </div>
  );
};

export default DeviceToggle;
