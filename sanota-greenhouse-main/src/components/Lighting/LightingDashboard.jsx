import React from 'react';
import { Sun, Zap, Info, Settings2, Power } from 'lucide-react';

const LightingDashboard = ({ 
    actuators, 
    sensors, 
    readings, 
    nodes = [],
    selectedZone = null,
    updateActuatorMode, 
    updateActuatorState, 
    updateActuatorIntensity,
    lightingSchedules = [],
    lightingProfiles = [],
    automationRules = []
}) => {
    // Local state to make sliders smooth
    const [localIntensities, setLocalIntensities] = React.useState({});

    // Filter for lighting actuators belonging to the selected zone
    const activeNodeIds = nodes
        .filter(n => !selectedZone || n.zone_id === selectedZone.id)
        .map(n => n.id);

    const lights = actuators.filter(a => 
        a.actuator_type === 'grow_light' && 
        activeNodeIds.includes(a.node_id)
    );

    return (
        <div className="grid-12" style={{ alignItems: 'start' }}>
            {/* Light Status Cards */}
            <div className="col-12" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="grid-12">
                    {lights.map(light => {
                        const target = light.target_state || { on: false, intensity: 100 };
                        const isManual = light.control_mode === 'manual';
                        const isSchedule = light.control_mode === 'schedule';
                        const isAuto = light.control_mode === 'auto';
                        const isEnabled = target.on;

                        // Use local state if it exists, otherwise use prop value
                        const sliderValue = localIntensities[light.id] ?? (target.intensity ?? 100);

                        let displayIntensity = 0;
                        let activeLabel = "Target";

                        if (isManual) {
                            displayIntensity = isEnabled ? sliderValue : 0;
                        } else if (isSchedule && isEnabled) {
                            const now = new Date();
                            const yyyy = now.getFullYear();
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const dd = String(now.getDate()).padStart(2, '0');
                            const todayString = `${yyyy}-${mm}-${dd}`;
                            const currentDay2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][now.getDay()];
                            const currentDay3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
                            const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0') + ":00";
                            
                            const activeSch = (lightingSchedules || []).find(s => {
                                if (s.actuator_id !== light.id || !s.is_active) return false;
                                
                                if (s.scheduled_date) {
                                    if (s.scheduled_date !== todayString) return false;
                                } else {
                                    const days = s.days_of_week || [];
                                    if (!days.includes(currentDay2) && !days.includes(currentDay3)) return false;
                                }
                                
                                return currentTime >= s.start_time &&
                                    currentTime <= new Date(new Date(`2000-01-01T${s.start_time}`).getTime() + s.duration_seconds * 1000).toTimeString().slice(0,8);
                            });

                            if (activeSch) {
                                const profile = (lightingProfiles || []).find(p => p.id === activeSch.profile_id);
                                displayIntensity = profile?.intensity_percent || 0;
                                activeLabel = "Scheduled";
                            }
                        } else if (isAuto && isEnabled) {
                            const rule = (automationRules || []).find(r => r.actuator_id === light.id && r.is_active);
                            if (rule) {
                                const sensorReading = readings[rule.sensor_id] || 0;
                                const threshold = rule.threshold;
                                let conditionMet = false;
                                if (rule.operator === '>') conditionMet = sensorReading > threshold;
                                else if (rule.operator === '<') conditionMet = sensorReading < threshold;
                                else if (rule.operator === '>=') conditionMet = sensorReading >= threshold;
                                else if (rule.operator === '<=') conditionMet = sensorReading <= threshold;
                                else if (rule.operator === '=') conditionMet = sensorReading === threshold;

                                if (conditionMet) {
                                    displayIntensity = rule.action_state?.intensity || 100;
                                    activeLabel = "Auto-Target";
                                }
                            }
                        }

                        // Physical status (Is it glowing?)
                        const isGlowing = displayIntensity > 0;

                        return (
                            <div key={light.id} className="premium-control-card col-6" style={{ borderLeft: isGlowing ? '3px solid var(--accent-amber)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <div className="premium-control-top">
                                    <div className="premium-control-info">
                                        <div className="premium-control-name">{light.label}</div>
                                        <div className="premium-control-sub">Grow Light System</div>
                                        <div className="premium-control-meta">
                                            <div className="meta-item">Status: {isGlowing ? 'Active' : 'Standby'}</div>
                                            <div className="meta-item">Intensity: {isManual ? sliderValue : displayIntensity}%</div>
                                        </div>
                                    </div>
                                    <div className="premium-control-actions">
                                        <div className={`status-chip ${isEnabled ? 'on' : 'off'}`}>
                                            {isEnabled ? 'ON' : 'OFF'}
                                        </div>
                                        <button
                                            className={`premium-switch ${isEnabled ? 'on active' : 'off'}`}
                                            onClick={() => updateActuatorState(light.id, !isEnabled)}
                                        >
                                            <div className="premium-switch-knob" />
                                        </button>
                                    </div>
                                </div>

                                {/* INTENSITY CONTROL AREA */}
                                <div style={{ marginTop: 12, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{isManual ? 'Manual Target' : activeLabel}</span>
                                        <span style={{ color: isGlowing ? 'var(--accent-amber)' : 'var(--text-dim)' }}>
                                            {isManual ? sliderValue : displayIntensity}%
                                        </span>
                                    </div>

                                    {isManual ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={sliderValue}
                                                className="intensity-slider"
                                                onInput={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setLocalIntensities(prev => ({ ...prev, [light.id]: val }));
                                                }}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    updateActuatorIntensity(light.id, val);
                                                }}
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="intensity-track-static" style={{ position: 'relative', height: 6, background: 'var(--v4-border-hover, rgba(255,255,255,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, height: '100%',
                                                width: `${displayIntensity}%`,
                                                background: isGlowing ? 'linear-gradient(90deg, var(--accent-amber), #fff)' : 'var(--text-dim)',
                                                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }} />
                                        </div>
                                    )}
                                </div>

                                {/* MODE SELECTOR AREA */}
                                <div className="mode-selector-container">
                                    <button
                                        className={`mode-selector-btn auto ${light.control_mode === 'auto' ? 'active' : ''}`}
                                        onClick={() => updateActuatorMode(light.id, 'auto')}
                                    >
                                        AUTO
                                    </button>
                                    <button
                                        className={`mode-selector-btn schedule ${light.control_mode === 'schedule' ? 'active' : ''}`}
                                        onClick={() => updateActuatorMode(light.id, 'schedule')}
                                    >
                                        SCHEDULE
                                    </button>
                                    <button
                                        className={`mode-selector-btn manual ${light.control_mode === 'manual' ? 'active' : ''}`}
                                        onClick={() => updateActuatorMode(light.id, 'manual')}
                                    >
                                        MANUAL
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    {lights.length === 0 && (
                        <div className="glass-card col-12" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            No lighting actuators found. Please configure them in Settings.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LightingDashboard;
