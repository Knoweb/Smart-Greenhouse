import React from 'react';
import { Plus, Clock, Droplets, Lamp, FlaskConical, Trash2 } from 'lucide-react';

const TYPES = {
  irrigation: { label: 'Irrigation',   icon: Droplets,    color: 'var(--accent-water)' },
  lighting:   { label: 'Lighting',     icon: Lamp,        color: 'var(--accent-alert)' },
  fertigation:{ label: 'Fertigation',  icon: FlaskConical,color: 'var(--primary)' },
  ventilation:{ label: 'Ventilation',  icon: Clock,       color: 'var(--accent-purple)' },
};

const Schedules = ({ systemState, setSystemState }) => {

  const toggleSchedule = (devKey, schId) => setSystemState(s => ({
    ...s,
    [devKey]: {
      ...s[devKey],
      schedules: s[devKey].schedules.map(sch => sch.id === schId ? { ...sch, active: !sch.active } : sch)
    }
  }));

  const removeSchedule = (devKey, schId) => setSystemState(s => ({
    ...s,
    [devKey]: {
      ...s[devKey],
      schedules: s[devKey].schedules.filter(sch => sch.id !== schId)
    }
  }));

  const addSchedule = (devKey) => {
    const newId = Date.now();
    setSystemState(s => ({
      ...s,
      [devKey]: {
        ...s[devKey],
        schedules: [...s[devKey].schedules, { id: newId, time: '12:00', duration: 10, active: true }]
      }
    }));
  };

  const updateScheduleTime = (devKey, schId, field, val) => {
    setSystemState(s => ({
      ...s,
      [devKey]: {
        ...s[devKey],
        schedules: s[devKey].schedules.map(sch => sch.id === schId ? { ...sch, [field]: val } : sch)
      }
    }));
  };

  // Convert the systemState map into an array for easy rendering
  const deviceList = Object.keys(systemState).map(key => ({
    key,
    ...systemState[key],
  }));

  const grouped = Object.keys(TYPES).map(k => ({
    typeKey: k, ...TYPES[k], items: deviceList.filter(d => d.type === k)
  }));

  return (
    <div className="schedules-container">
      <div className="alert-item info" style={{ padding: '16px 20px', alignItems: 'flex-start' }}>
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Multi-Level Automation Active</strong>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>You can now add multiple schedule layers per device. The hardware will trigger whenever any active schedule's time period matches.</span>
        </div>
      </div>

      <div className="grid-12" style={{ alignItems: 'start' }}>
        {grouped.map(grp => (
          <div key={grp.typeKey} className="glass-card col-4">
            <div className="card-title" style={{ color: grp.color }}>
              <grp.icon size={15} /> {grp.label} Group
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {grp.items.length === 0 && (
                <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 12 }}>
                  No hardware configured for this group.
                </div>
              )}
              {grp.items.map(dev => (
                <div key={dev.key} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{dev.name}</div>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => addSchedule(dev.key)}>
                      <Plus size={12} /> Add Rule
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dev.schedules.map(sch => (
                      <div key={sch.id} className={`sch-item ${sch.active ? 'active' : ''}`}>
                        <div className="sch-content">
                          <input 
                            type="time" 
                            className="sch-input"
                            value={sch.time} 
                            onChange={(e) => updateScheduleTime(dev.key, sch.id, 'time', e.target.value)}
                          />
                          <div style={{ color: 'var(--text-muted)' }}>for</div>
                          <input 
                            type="number" 
                            className="sch-input sch-input-num"
                            value={sch.duration} 
                            onChange={(e) => updateScheduleTime(dev.key, sch.id, 'duration', parseInt(e.target.value))}
                          />
                          <div style={{ color: 'var(--text-muted)' }}>min</div>
                        </div>
                        <div className="sch-actions">
                          <div 
                            onClick={() => toggleSchedule(dev.key, sch.id)}
                            style={{
                              width: 32, height: 18, borderRadius: 9, cursor: 'pointer',
                              background: sch.active ? grp.color : 'rgba(255,255,255,0.1)',
                              position: 'relative', transition: 'background 0.3s',
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: 2, left: sch.active ? 16 : 2,
                              width: 14, height: 14, borderRadius: '50%', background: '#fff',
                              transition: 'left 0.2s'
                            }} />
                          </div>
                          <button 
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', opacity: 0.7 }}
                            onClick={() => removeSchedule(dev.key, sch.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schedules;
