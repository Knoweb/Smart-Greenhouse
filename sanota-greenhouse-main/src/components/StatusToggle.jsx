import React from 'react';

const StatusToggle = ({ label, isOn, onToggle, isFan = false }) => {
  return (
    <div style={{ 
      padding: '16px', 
      background: isOn ? 'var(--primary-light)' : 'rgba(255,255,255,0.05)', 
      border: `1px solid ${isOn ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '12px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 500, color: isOn ? '#fff' : 'var(--text-muted)' }}>{label}</span>
      </div>
      
      <button 
        onClick={onToggle}
        style={{
          width: '52px',
          height: '28px',
          background: isOn ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
          borderRadius: '14px',
          position: 'relative',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'background 0.3s ease',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          left: isOn ? '28px' : '4px',
          transition: 'left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );
};

export default StatusToggle;
