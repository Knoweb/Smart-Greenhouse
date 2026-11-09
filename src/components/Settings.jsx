import React, { useEffect, useState } from 'react';
import { Sliders, Zap, Plus, Trash2, Save, Power, PowerOff, ToggleLeft, ToggleRight, AlertTriangle, Activity, ChevronDown, Cpu, Wifi, WifiOff } from 'lucide-react';

const OPERATORS = [
  { value: '>', label: '> Greater Than' },
  { value: '<', label: '< Less Than' },
  { value: '>=', label: '>= Greater or Equal' },
  { value: '<=', label: '<= Less or Equal' },
  { value: '=', label: '= Equal To' },
];

const formatSensorLabel = (sensor) => {
  if (!sensor) return 'Unknown';
  const label = sensor.label || sensor.sensor_type || 'Sensor';
  return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatActuatorLabel = (act) => {
  if (!act) return 'Unknown';
  return act.label || act.actuator_type || 'Actuator';
};

const Section = ({ title, icon: Icon, children, accent }) => (
  <div className="glass-card">
    <div className="card-title" style={accent ? { color: accent } : {}}>
      <Icon size={15} style={accent ? { color: accent } : {}} /> {title}
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = 'number', unit }) => (
  <div style={{ marginBottom: 12 }}>
    <label className="field-label">{label} {unit && `(${unit})`}</label>
    <input
      className="field-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const normalizeMacAddress = (value) => {
  const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
  return cleaned.match(/.{1,2}/g)?.join(':') || cleaned;
};

const formatLastSeen = (value) => {
  if (!value) return 'No heartbeat yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleString();
};

const DeviceRegistrationSection = ({ zones = [], selectedZone, nodes = [], onRegister, onDelete }) => {
  const [macAddress, setMacAddress] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [nodeType, setNodeType] = useState('sub');
  const [zoneName, setZoneName] = useState(selectedZone?.name || '');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const registeredDevices = [...nodes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  useEffect(() => {
    setZoneName(selectedZone?.name || '');
  }, [selectedZone?.name]);

  const handleSubmit = async () => {
    const normalizedMac = normalizeMacAddress(macAddress);
    if (normalizedMac.length !== 17) {
      setFeedback({ type: 'error', text: 'Valid device MAC address ekak enter karanna. Example: AA:BB:CC:DD:EE:FF' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const { error } = await onRegister({
        macAddress: normalizedMac,
        name: deviceName,
        nodeType,
        zoneName
      });

      if (error) throw error;

      setMacAddress('');
      setDeviceName('');
      setNodeType('sub');
      setZoneName(selectedZone?.name || '');
      setFeedback({ type: 'success', text: `Device with MAC address ${normalizedMac} was successfully registered.` });
    } catch (err) {
      const message = err?.message?.includes('duplicate key')
        ? 'This MAC address is already registered to another device.'
        : (err?.message || 'Device registration failed.');
      setFeedback({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (node) => {
    setDeletingId(node.id);
    setFeedback(null);

    try {
      const { error } = await onDelete(node.id);
      if (error) throw error;

      setConfirmDeleteId(null);
      setFeedback({ type: 'success', text: `${node.name} was removed successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to remove the device.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Section title="Device Register" icon={Cpu} accent="var(--accent-cyan)">
      <div className="device-register-grid">
        <div>
          <label className="field-label">Device MAC Address</label>
          <input
            className="field-input"
            type="text"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={macAddress}
            onChange={(e) => setMacAddress(normalizeMacAddress(e.target.value))}
          />
        </div>

        <div>
          <label className="field-label">Device Name</label>
          <input
            className="field-input"
            type="text"
            placeholder="e.g. First Device"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label">Device Type</label>
          <div className="custom-select-wrap">
            <select className="field-input field-select" value={nodeType} onChange={(e) => setNodeType(e.target.value)}>
              <option value="sub">Sub Device</option>
              <option value="main">Main Device</option>
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
        </div>

        <div>
          <label className="field-label">Zone</label>
          <input
            className="field-input"
            type="text"
            list="device-zone-options"
            placeholder="Type zone name"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
          />
          <datalist id="device-zone-options">
            {zones.map((zone) => (
              <option key={zone.id} value={zone.name} />
            ))}
          </datalist>
        </div>
      </div>

      {feedback && (
        <div className={`device-register-feedback ${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || normalizeMacAddress(macAddress).length !== 17}>
          {saving ? 'Registering...' : <><Save size={14} /> Register Device</>}
        </button>
      </div>

      <div className="device-register-list">
        <div className="device-register-list-head">
          <span>Registered Devices</span>
          <span>{registeredDevices.length} total</span>
        </div>

        {registeredDevices.length === 0 ? (
          <div className="device-empty-state">
            No devices registered yet.
          </div>
        ) : (
          <div className="device-register-table">
            {registeredDevices.map((node) => (
              <div key={node.id} className="device-register-row">
                <div>
                  <div className="device-register-name">{node.name}</div>
                  <div className="device-register-id">{node.id}</div>
                </div>

                <div className="device-register-meta">
                  <span className="device-register-pill">{node.node_type === 'main' ? 'Main Device' : 'Sub Device'}</span>
                  {node.zone_id && <span className="device-register-pill muted">Zone linked</span>}
                </div>

                <div className={`device-register-status ${node.is_online ? 'online' : 'offline'}`}>
                  {node.is_online ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {node.is_online ? 'Online' : 'Offline'}
                </div>

                <div className="device-register-lastseen">
                  {formatLastSeen(node.last_seen)}
                </div>

                <div className="device-register-actions">
                  {confirmDeleteId === node.id ? (
                    <>
                      <button
                        className="device-action-btn confirm"
                        onClick={() => handleDelete(node)}
                        disabled={deletingId === node.id}
                      >
                        {deletingId === node.id ? 'Removing...' : 'Confirm'}
                      </button>
                      <button
                        className="device-action-btn cancel"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingId === node.id}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="device-action-btn remove"
                      onClick={() => {
                        setFeedback(null);
                        setConfirmDeleteId(node.id);
                      }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

// ===== AUTOMATION RULE CARD =====
const RuleCard = ({ rule, sensors, onUpdate, onDelete }) => {
  const operatorObj = OPERATORS.find(o => o.value === rule.operator);
  const sensorLabel = rule.sensors ? formatSensorLabel(rule.sensors) : 'Unknown Sensor';
  const sensorUnit = rule.sensors?.unit || '';
  const actionIsOn = rule.action_state?.on !== false;

  return (
    <div className={`automation-rule-card ${rule.is_active ? 'active' : 'inactive'}`}>
      {/* Header Row */}
      <div className="rule-header">
        <div className="rule-condition-badge">
          <Activity size={13} />
          <span>{sensorLabel}</span>
        </div>
        <div className="rule-actions-row">
          <div
            className={`rule-toggle ${rule.is_active ? 'on' : ''}`}
            onClick={() => onUpdate(rule.id, { is_active: !rule.is_active })}
            title={rule.is_active ? 'Disable Rule' : 'Enable Rule'}
          >
            {rule.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </div>
          <button className="rule-delete-btn" onClick={() => onDelete(rule.id)} title="Delete Rule">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Condition Display */}
      <div className="rule-condition-display">
        <div className="rule-condition-flow">
          <span className="rule-label-tag sensor">{sensorLabel}</span>
          <span className="rule-label-tag operator">{operatorObj?.label?.split(' ')[0] || rule.operator}</span>
          <span className="rule-label-tag threshold">{rule.threshold}{sensorUnit ? ` ${sensorUnit}` : ''}</span>
        </div>
        <div className="rule-arrow">→</div>
        <div className={`rule-action-tag ${actionIsOn ? 'on' : 'off'}`}>
          {actionIsOn ? <Power size={13} /> : <PowerOff size={13} />}
          <span>Turn {actionIsOn ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Status */}
      {!rule.is_active && (
        <div className="rule-disabled-overlay">
          <AlertTriangle size={12} /> Disabled
        </div>
      )}
    </div>
  );
};

// ===== ADD RULE FORM =====
const AddRuleForm = ({ actuators, sensors, onAdd, onCancel }) => {
  const autoActuators = actuators.filter(a => a.control_mode === 'auto');
  const [actuatorId, setActuatorId] = useState(autoActuators[0]?.id || '');
  const [sensorId, setSensorId] = useState(sensors[0]?.id || '');
  const [operator, setOperator] = useState('>');
  const [threshold, setThreshold] = useState('');
  const [actionOn, setActionOn] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!actuatorId || !sensorId || threshold === '') return;
    setSaving(true);
    try {
      const { error } = await onAdd({
        actuator_id: actuatorId,
        sensor_id: sensorId,
        operator,
        threshold: parseFloat(threshold),
        action_state: { on: actionOn }
      });
      if (error) throw error;
      onCancel();
    } catch (err) {
      alert("Failed to save rule: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const selectedSensor = sensors.find(s => s.id === sensorId);
  const sensorUnit = selectedSensor?.unit || '';

  return (
    <div className="add-rule-form glass-card" style={{ border: '1px solid var(--primary)', boxShadow: 'var(--primary-glow)' }}>
      <div className="card-title" style={{ color: 'var(--primary)', marginBottom: 16 }}>
        <Plus size={15} /> New Automation Rule
      </div>

      <div className="rule-form-grid">
        {/* Actuator Select */}
        <div className="rule-form-field">
          <label className="field-label">Actuator (Auto Mode Only)</label>
          <div className="custom-select-wrap">
            <select className="field-input field-select" value={actuatorId} onChange={e => setActuatorId(e.target.value)}>
              <option value="">Select Actuator...</option>
              {autoActuators.map(a => (
                <option key={a.id} value={a.id}>{formatActuatorLabel(a)}</option>
              ))}
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
          {autoActuators.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 6, fontWeight: 600 }}>
              ⚠ No actuators are in AUTO mode. Switch an actuator to AUTO mode in System Controls first.
            </div>
          )}
        </div>

        {/* Sensor Select */}
        <div className="rule-form-field">
          <label className="field-label">Sensor to Monitor</label>
          <div className="custom-select-wrap">
            <select className="field-input field-select" value={sensorId} onChange={e => setSensorId(e.target.value)}>
              <option value="">Select Sensor...</option>
              {sensors.map(s => (
                <option key={s.id} value={s.id}>{formatSensorLabel(s)}{s.unit ? ` (${s.unit})` : ''}</option>
              ))}
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
        </div>

        {/* Operator Select */}
        <div className="rule-form-field">
          <label className="field-label">Condition</label>
          <div className="custom-select-wrap">
            <select className="field-input field-select" value={operator} onChange={e => setOperator(e.target.value)}>
              {OPERATORS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
        </div>

        {/* Threshold */}
        <div className="rule-form-field">
          <label className="field-label">Threshold Value {sensorUnit ? `(${sensorUnit})` : ''}</label>
          <input
            className="field-input"
            type="number"
            step="any"
            placeholder="e.g. 30"
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
          />
        </div>

        {/* Action */}
        <div className="rule-form-field">
          <label className="field-label">Action When Triggered</label>
          <div className="action-toggle-row">
            <div
              className={`action-choice ${actionOn ? 'active on' : ''}`}
              onClick={() => setActionOn(true)}
            >
              <Power size={14} /> Turn ON
            </div>
            <div
              className={`action-choice ${!actionOn ? 'active off' : ''}`}
              onClick={() => setActionOn(false)}
            >
              <PowerOff size={14} /> Turn OFF
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!actuatorId || !sensorId || threshold === '' || saving}
        >
          {saving ? 'Saving...' : <><Save size={14} /> Create Rule</>}
        </button>
      </div>
    </div>
  );
};


// ===== MAIN SETTINGS COMPONENT =====
const Settings = ({
  zones = [],
  selectedZone = null,
  nodes = [],
  actuators = [],
  sensors = [],
  automationRules = [],
  systemSettings = null,
  addAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  registerDevice,
  deleteDevice,
  updateSystemSettings
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    max_temp: 30,
    min_temp: 18,
    max_hum: 90,
    min_hum: 40,
    low_water_alert: 20,
    low_fert_alert: 15,
    max_co2: 1200,
    min_light: 200
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      setLocalSettings({
        max_temp: systemSettings.max_temp ?? 30,
        min_temp: systemSettings.min_temp ?? 18,
        max_hum: systemSettings.max_hum ?? 90,
        min_hum: systemSettings.min_hum ?? 40,
        low_water_alert: systemSettings.low_water_alert ?? 20,
        low_fert_alert: systemSettings.low_fert_alert ?? 15,
        max_co2: systemSettings.max_co2 ?? 1200,
        min_light: systemSettings.min_light ?? 200
      });
    }
  }, [systemSettings]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await updateSystemSettings(localSettings);
    if (error) {
      alert("Failed to save settings: " + error.message);
    } else {
      alert("Settings saved successfully!");
    }
    setSavingSettings(false);
  };

  const handleFieldChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const autoActuators = actuators.filter(a => a.control_mode === 'auto');

  // Group rules by actuator
  const rulesByActuator = {};
  autoActuators.forEach(a => { rulesByActuator[a.id] = []; });
  automationRules.forEach(rule => {
    if (rulesByActuator[rule.actuator_id] !== undefined) {
      rulesByActuator[rule.actuator_id].push(rule);
    }
  });

  return (
    <div className="settings-page-premium">
      <div className="grid-12 settings-grid-shell" style={{ alignItems: 'start' }}>

        {/* ===== AUTOMATION RULES ===== */}
        <div className="col-12">
          <Section title="Actuator Automation Rules" icon={Zap} accent="var(--primary)">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6, fontWeight: 500 }}>
              Configure sensor-based automation for actuators in <strong style={{ color: 'var(--primary)' }}>AUTO</strong> mode.
              When a sensor value crosses the threshold, the linked actuator will automatically turn ON or OFF.
            </div>

            {autoActuators.length === 0 ? (
              <div className="automation-empty-state">
                <AlertTriangle size={28} style={{ color: 'var(--accent-amber)', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>No Actuators in AUTO Mode</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Switch one or more actuators to AUTO mode in the System Controls tab to configure automation rules here.
                </div>
              </div>
            ) : (
              <>
                {/* Actuator Groups */}
                {autoActuators.map(act => {
                  const rules = rulesByActuator[act.id] || [];
                  return (
                    <div key={act.id} className="actuator-rules-group">
                      <div className="actuator-group-header">
                        <div className="actuator-group-icon">
                          <Zap size={16} />
                        </div>
                        <div>
                          <div className="actuator-group-name">{formatActuatorLabel(act)}</div>
                          <div className="actuator-group-type">{act.actuator_type} • AUTO Mode</div>
                        </div>
                        <div className="actuator-rules-count">
                          {rules.length} rule{rules.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {rules.length > 0 ? (
                        <div className="rules-list">
                          {rules.map(rule => (
                            <RuleCard
                              key={rule.id}
                              rule={rule}
                              sensors={sensors}
                              onUpdate={updateAutomationRule}
                              onDelete={deleteAutomationRule}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No automation rules configured for this actuator yet.
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Rule Button or Form */}
                {showAddForm ? (
                  <AddRuleForm
                    actuators={actuators}
                    sensors={sensors}
                    onAdd={addAutomationRule}
                    onCancel={() => setShowAddForm(false)}
                  />
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={16} /> Add Automation Rule
                  </button>
                )}
              </>
            )}
          </Section>
        </div>

        <div className="col-12">
          <DeviceRegistrationSection
            zones={zones}
            selectedZone={selectedZone}
            nodes={nodes}
            onRegister={registerDevice}
            onDelete={deleteDevice}
          />
        </div>

        {/* ===== THRESHOLD CONFIG ===== */}
        <div className="col-12">
          <Section title="Threshold Configuration" icon={Sliders}>
            <div className="settings-grid">
              <Field label="Max Temperature" value={localSettings.max_temp} onChange={(val) => handleFieldChange('max_temp', val)} unit="°C" />
              <Field label="Min Temperature" value={localSettings.min_temp} onChange={(val) => handleFieldChange('min_temp', val)} unit="°C" />
              <Field label="Max Humidity" value={localSettings.max_hum} onChange={(val) => handleFieldChange('max_hum', val)} unit="%" />
              <Field label="Min Humidity" value={localSettings.min_hum} onChange={(val) => handleFieldChange('min_hum', val)} unit="%" />
              <Field label="Low Water Alert" value={localSettings.low_water_alert} onChange={(val) => handleFieldChange('low_water_alert', val)} unit="%" />
              <Field label="Low Fertilizer Alert" value={localSettings.low_fert_alert} onChange={(val) => handleFieldChange('low_fert_alert', val)} unit="%" />
              <Field label="Max CO2 Level" value={localSettings.max_co2} onChange={(val) => handleFieldChange('max_co2', val)} unit="ppm" />
              <Field label="Min Light (day)" value={localSettings.min_light} onChange={(val) => handleFieldChange('min_light', val)} unit="µmol" />
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? 'Saving...' : <><Save size={14} /> Save Thresholds</>}
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
