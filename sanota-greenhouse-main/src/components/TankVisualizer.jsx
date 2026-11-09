import React from 'react';

const TankVisualizer = ({ level, color, label, warning = 20 }) => {
  const isLow = level < warning;
  return (
    <div className="tank-container">
      <div className="tank-body">
        {[25, 50, 75].map(m => (
          <div key={m} className="tank-mark" style={{ bottom: `${m}%` }} />
        ))}
        <div
          className="tank-fill"
          style={{
            height: `${level}%`,
            background: isLow
              ? `linear-gradient(180deg, var(--accent-danger) 0%, rgba(255,23,68,0.6) 100%)`
              : `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
            boxShadow: `0 0 20px ${isLow ? 'var(--accent-danger)' : color}55`,
          }}
        />
      </div>
      <div className="tank-pct" style={{ color: isLow ? 'var(--accent-danger)' : color }}>{level}%</div>
      <div className="tank-name">{label}</div>
      {isLow && (
        <div className="badge badge-danger" style={{ fontSize: '10px' }}>Low!</div>
      )}
    </div>
  );
};

export default TankVisualizer;
