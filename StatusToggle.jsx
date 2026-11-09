import React from 'react';

const EnvironmentalWidget = ({ label, value, unit, icon: Icon, color, percentage }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Icon size={24} color={color} style={{ marginBottom: '4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{value}{unit}</div>
        </div>
      </div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
};

export default EnvironmentalWidget;
