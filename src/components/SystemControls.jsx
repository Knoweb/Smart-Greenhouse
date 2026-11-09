import React from 'react';
import { Settings, Droplets, Wind, Power, Cpu, Sliders, Play } from 'lucide-react';

const PremiumControlCard = ({ name, description, mode, onModeChange, isOn, onToggle, metaData }) => {
  const getStatusLabel = () => {
    return isOn ? 'ON' : 'OFF';
  };

  const getStatusClass = () => {
    return isOn ? 'on' : 'off';
  };

  return (
    <div className="premium-control-card">
      <div className="premium-control-top">
        <div className="premium-control-info">
          <div className="premium-control-name">{name}</div>
          <div className="premium-control-sub">{description}</div>
          
          <div className="premium-control-meta">
            {metaData && metaData.map((item, idx) => (
              <div key={idx} className="meta-item">{item.label}: {item.value}</div>
            ))}
          </div>
        </div>

        <div className="premium-control-actions">
          <div className={`status-chip ${getStatusClass()}`}>
            {getStatusLabel()}
          </div>
          <button 
            className={`premium-switch ${getStatusClass()} ${isOn ? 'active' : ''}`}
            onClick={onToggle}
          >
            <div className="premium-switch-knob" />
          </button>
        </div>
      </div>

      {/* MODE SELECTOR AREA */}
      <div className="mode-selector-container">
        <button 
          className={`mode-selector-btn auto ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => onModeChange('auto')}
        >
          AUTO
        </button>
        <button 
          className={`mode-selector-btn schedule ${mode === 'schedule' ? 'active' : ''}`}
          onClick={() => onModeChange('schedule')}
        >
          SCHEDULE
        </button>
        <button 
          className={`mode-selector-btn manual ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => onModeChange('manual')}
        >
          MANUAL
        </button>
      </div>
    </div>
  );
};

const ControlSection = ({ title, icon: Icon, description, children, footerLabel, footerIcon: FooterIcon }) => (
  <div className="control-panel-section">
    <div className="control-section-header">
      <div className="control-section-title-row">
        <div className="control-section-icon-box">
          <Icon className="control-section-icon" />
        </div>
        <h2 className="control-section-title">{title}</h2>
      </div>
      <p className="control-section-desc">{description}</p>
    </div>
    
    <div className="control-cards-stack">
      {children}
    </div>

    {footerLabel && (
      <button className="section-footer-btn">
        <FooterIcon size={18} />
        {footerLabel}
      </button>
    )}
  </div>
);

const SystemControls = ({ actuators, actuatorLogs, updateActuatorMode, updateActuatorState }) => {
  // Filter out lighting if needed
  const mainActuators = actuators.filter(a => 
    a.actuator_type !== 'lighting' && a.actuator_type !== 'grow_light'
  );

  // Categorize
  const pumpActuators = mainActuators.filter(a => 
    a.label.toLowerCase().includes('pump') || 
    a.actuator_type.toLowerCase().includes('pump') ||
    a.label.toLowerCase().includes('irrigation') ||
    a.label.toLowerCase().includes('mister') ||
    a.actuator_type.toLowerCase().includes('mister')
  );

  const envActuators = mainActuators.filter(a => !pumpActuators.includes(a));

  const renderActuatorCard = (act) => {
    const lastLog = actuatorLogs?.find(l => l.actuator_id === act.id);
    let durationStr = '';
    if (lastLog) {
      const diffMs = new Date() - new Date(lastLog.created_at);
      const mins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(mins / 60);
      if (hrs > 0) durationStr = `${hrs}h ${mins % 60}m`;
      else if (mins > 0) durationStr = `${mins}m`;
      else durationStr = 'Just now';
    }

    const metaData = [];
    if (act.label.toLowerCase().includes('pump')) {
      metaData.push({ label: 'Flow rate', value: act.target_state?.on ? '12.5 L/min' : '0 L/min' });
      metaData.push({ label: 'Target', value: '15 L/min' });
    } else if (act.label.toLowerCase().includes('fan')) {
      metaData.push({ label: 'Speed', value: act.target_state?.on ? '75%' : '0%' });
      metaData.push({ label: 'Status', value: act.target_state?.on ? 'Extracting air' : 'Fan stopped' });
    } else if (act.label.toLowerCase().includes('mister')) {
      metaData.push({ label: 'Current humidity', value: '68%' });
      metaData.push({ label: 'Status', value: act.target_state?.on ? 'Misting active' : 'Idle' });
    }

    return (
      <PremiumControlCard
        key={act.id}
        name={act.label}
        description={act.actuator_type.charAt(0).toUpperCase() + act.actuator_type.slice(1)}
        mode={act.control_mode || 'manual'}
        isOn={act.target_state?.on}
        onToggle={() => {
          updateActuatorState(act.id, !act.target_state?.on);
        }}
        onModeChange={(m) => updateActuatorMode(act.id, m)}
        metaData={metaData}
      />
    );
  };

  return (
    <div className="system-controls-page-wrapper">
      <div className="premium-controls-grid">
        {/* PUMP SYSTEMS PANEL */}
        <ControlSection 
          title="Pump Systems" 
          icon={Droplets} 
          description="Manual control of water and fertilizer pumps"
        >
          {pumpActuators.length > 0 ? (
            pumpActuators.map(renderActuatorCard)
          ) : (
            <div className="empty-section-state">No pump actuators found.</div>
          )}
        </ControlSection>

        {/* ENVIRONMENTAL SYSTEMS PANEL */}
        <ControlSection 
          title="Environmental Systems" 
          icon={Wind} 
          description="Climate control and air circulation"
        >
          {envActuators.length > 0 ? (
            envActuators.map(renderActuatorCard)
          ) : (
            <div className="empty-section-state">No environmental actuators found.</div>
          )}
        </ControlSection>
      </div>

      {/* EMERGENCY CONTROLS SECTION */}
      <div className="emergency-controls-panel">
        <div className="emergency-header">
          <h2 className="emergency-title">Emergency Controls</h2>
          <p className="emergency-desc">System wide emergency actions</p>
        </div>
        <div className="emergency-actions">
          <button 
            className="emergency-btn stop"
            onClick={() => {
              if (window.confirm('Are you sure you want to STOP ALL pumps immediately?')) {
                pumpActuators.forEach(a => updateActuatorState(a.id, false));
              }
            }}
          >
            <Power size={18} />
            Stop All Pumps
          </button>
          <button 
            className="emergency-btn resume"
            onClick={() => {
              if (window.confirm('Resume all systems to their scheduled/auto modes?')) {
                mainActuators.forEach(a => updateActuatorMode(a.id, 'auto'));
              }
            }}
          >
            <Play size={18} fill="currentColor" />
            Resume All Systems
          </button>
        </div>
      </div>

      {mainActuators.length === 0 && (
        <div className="empty-system-state">
          <Power size={48} />
          <div>No actuators found in the database.</div>
        </div>
      )}
    </div>
  );
};


export default SystemControls;
