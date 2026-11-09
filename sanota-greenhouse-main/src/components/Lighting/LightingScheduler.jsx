import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Clock, Lamp, Repeat, Zap, Play, Pause, Copy, Edit2, Check, Sun, Calendar, RefreshCw } from 'lucide-react';

const DAYS = [
    { label: 'Mo', value: 'Mon' },
    { label: 'Tu', value: 'Tue' },
    { label: 'We', value: 'Wed' },
    { label: 'Th', value: 'Thu' },
    { label: 'Fr', value: 'Fri' },
    { label: 'Sa', value: 'Sat' },
    { label: 'Su', value: 'Sun' }
];

const LightingScheduler = ({
    actuators,
    lightingProfiles,
    lightingSchedules,
    addLightingSchedule,
    updateLightingSchedule,
    deleteLightingSchedule,
    nodes = [],
    zones = []
}) => {
    const lights = actuators.filter(a => a.actuator_type === 'grow_light');
    const [selectedLightId, setSelectedLightId] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [durationMins, setDurationMins] = useState(60);
    const [editingId, setEditingId] = useState(null);

    // Schedule frequency states
    const [scheduleType, setScheduleType] = useState('recurring'); // 'recurring' | 'one-time'
    const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const [scheduledDate, setScheduledDate] = useState('');

    const toggleDaySelector = (val) => {
        setSelectedDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleAdd = () => {
        if (!selectedLightId || !selectedProfileId) return alert('Select a light and a profile');
        if (!startTime) return alert('Select a start time');

        if (scheduleType === 'one-time') {
            if (!scheduledDate) return alert('Select a specific date');
            addLightingSchedule({
                actuator_id: selectedLightId,
                profile_id: selectedProfileId,
                start_time: startTime + ':00',
                duration_seconds: parseInt(durationMins) * 60,
                days_of_week: [],
                scheduled_date: scheduledDate,
                is_active: true
            });
        } else {
            if (selectedDays.length === 0) return alert('Select at least one active day');
            addLightingSchedule({
                actuator_id: selectedLightId,
                profile_id: selectedProfileId,
                start_time: startTime + ':00',
                duration_seconds: parseInt(durationMins) * 60,
                days_of_week: selectedDays,
                scheduled_date: null,
                is_active: true
            });
        }
    };

    const toggleDay = (sch, day) => {
        const current = sch.days_of_week || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        updateLightingSchedule(sch.id, { days_of_week: updated });
    };

    const getEndTime = (startTimeStr, durationSecs) => {
        if (!startTimeStr) return '00:00';
        const parts = startTimeStr.split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const totalMinutes = h * 60 + m + Math.floor((durationSecs || 3600) / 60);
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    const getPriority = (intensity) => {
        if (intensity >= 75) return { label: 'High', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.12)' };
        if (intensity >= 40) return { label: 'Medium', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)' };
        return { label: 'Low', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
    };

    const handleDuplicate = (sch) => {
        addLightingSchedule({
            actuator_id: sch.actuator_id,
            profile_id: sch.profile_id,
            start_time: sch.start_time,
            duration_seconds: sch.duration_seconds,
            days_of_week: [...(sch.days_of_week || [])],
            is_active: sch.is_active
        });
    };

    const getLightZoneName = (lightId) => {
        const light = actuators.find(a => a.id === lightId);
        if (!light) return 'All Zones';
        const node = nodes.find(n => n.id === light.node_id);
        if (!node) return 'All Zones';
        const zone = zones.find(z => z.id === node.zone_id);
        return zone ? zone.name : 'All Zones';
    };

    const getFormattedDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return getFormattedDate();
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return getFormattedDate();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const getEndDisplayDate = (startDateStr, startTimeStr, durationSecs) => {
        const parts = (startTimeStr || '00:00').split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const totalMinutes = h * 60 + m + Math.floor((durationSecs || 3600) / 60);
        
        let d = new Date();
        if (startDateStr) {
            d = new Date(startDateStr);
            if (isNaN(d.getTime())) d = new Date();
        }
        
        if (totalMinutes >= 24 * 60) {
            d.setDate(d.getDate() + Math.floor(totalMinutes / (24 * 60)));
        }
        
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    return (
        <div className="grid-12" style={{ alignItems: 'start', rowGap: '24px' }}>
            <style>{`
                .premium-sch-card {
                    background: #141f32 !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    position: relative;
                    overflow: hidden;
                }
                .premium-sch-card:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255, 255, 255, 0.12) !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
                }
                .sch-action-btn-bare {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .sch-action-btn-bare:hover {
                    color: #fff;
                    transform: scale(1.1);
                }
                .sch-action-btn-bare.pause {
                    color: #f97316;
                }
                .sch-action-btn-bare.pause:hover {
                    color: #ea580c;
                }
                .sch-action-btn-bare.play {
                    color: #10b981;
                }
                .sch-action-btn-bare.play:hover {
                    color: #059669;
                }
                .sch-action-btn-bare.delete {
                    color: #ef4444;
                }
                .sch-action-btn-bare.delete:hover {
                    color: #dc2626;
                }
                .premium-sch-select, .premium-sch-input {
                    background: rgba(15, 23, 42, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    color: #fff !important;
                    border-radius: 8px !important;
                    padding: 8px 12px !important;
                    font-size: 13px !important;
                    outline: none !important;
                    transition: all 0.2s !important;
                    width: 100% !important;
                    cursor: pointer !important;
                }
                .premium-sch-select:focus, .premium-sch-input:focus {
                    border-color: rgba(255, 255, 255, 0.2) !important;
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05) !important;
                }
                .schedule-type-tab-container {
                    display: flex;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    padding: 3px;
                    gap: 4px;
                    width: fit-content;
                }
                .schedule-type-tab-btn {
                    display: flex;
                    align-items: center;
                    justifyContent: center;
                    gap: 8px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 8px 16px;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .schedule-type-tab-btn:hover {
                    color: #fff;
                }
                .schedule-type-tab-btn.active {
                    background: var(--accent-amber, #f59e0b) !important;
                    color: #000 !important;
                    box-shadow: none !important;
                }
                .day-circle-btn {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justifyContent: center;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: rgba(255, 255, 255, 0.02);
                    color: #64748b;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .day-circle-btn:hover {
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.15);
                }
                 .day-circle-btn.active {
                    background: #f97316 !important;
                    color: #fff !important;
                    border-color: #f97316 !important;
                    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.3) !important;
                }
            `}</style>
            
            {/* TOP PANEL: ADD LIGHTING RULE */}
            <div className="col-12">
                <div className="mix-config-panel" style={{ padding: '24px 28px' }}>
                    <div className="recipe-builder-section" style={{ gap: '16px' }}>
                        <div className="nutrient-comp-header" style={{ marginBottom: '4px' }}>
                            <div className="nutrient-header-title">
                                <Plus size={20} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--v4-text-primary)', fontWeight: 800 }}>Add Lighting Rule</h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--v4-text-secondary)' }}>Create an automated schedule for target grow lights</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Frequency Toggle Row */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '24px',
                            alignItems: 'center',
                            marginTop: '12px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            paddingBottom: '16px',
                            width: '100%'
                        }}>
                            <div>
                                <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Schedule Frequency</label>
                                <div className="schedule-type-tab-container">
                                    <button
                                        type="button"
                                        className={`schedule-type-tab-btn ${scheduleType === 'recurring' ? 'active' : ''}`}
                                        onClick={() => setScheduleType('recurring')}
                                    >
                                        <RefreshCw size={12} /> Recurring Cycle
                                    </button>
                                    <button
                                        type="button"
                                        className={`schedule-type-tab-btn ${scheduleType === 'one-time' ? 'active' : ''}`}
                                        onClick={() => setScheduleType('one-time')}
                                    >
                                        <Calendar size={12} /> One-Time Schedule
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Fields */}
                            {scheduleType === 'recurring' ? (
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Repeat on Days</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {DAYS.map(d => {
                                            const isActive = selectedDays.includes(d.value);
                                            return (
                                                <button
                                                    key={d.value}
                                                    type="button"
                                                    className={`day-circle-btn ${isActive ? 'active' : ''}`}
                                                    onClick={() => toggleDaySelector(d.value)}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ minWidth: '240px' }}>
                                    <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Execution Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                                        <input
                                            type="date"
                                            className="recipe-main-input"
                                            value={scheduledDate}
                                            onChange={e => setScheduledDate(e.target.value)}
                                            style={{
                                                padding: '10px 12px 10px 36px',
                                                fontSize: '13px',
                                                borderRadius: '10px',
                                                width: '100%',
                                                background: 'rgba(15, 23, 42, 0.6)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                color: 'var(--v4-text-primary)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px',
                            alignItems: 'end',
                            width: '100%',
                            marginTop: '8px'
                        }}>
                            <div className="recipe-input-group" style={{ margin: 0 }}>
                                <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Target Grow Light</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="recipe-main-input"
                                        value={selectedLightId}
                                        onChange={e => setSelectedLightId(e.target.value)}
                                        style={{ padding: '11px 14px', fontSize: '13px', appearance: 'none', cursor: 'pointer', width: '100%', borderRadius: '10px' }}
                                    >
                                        <option value="" style={{ background: 'var(--v4-card-bg)' }}>-- Select Light --</option>
                                        {lights.map(l => <option key={l.id} value={l.id} style={{ background: 'var(--v4-card-bg)' }}>{l.label}</option>)}
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--v4-text-muted)', fontSize: '12px' }}>▼</div>
                                </div>
                            </div>

                            <div className="recipe-input-group" style={{ margin: 0 }}>
                                <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Apply Profile</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="recipe-main-input"
                                        value={selectedProfileId}
                                        onChange={e => setSelectedProfileId(e.target.value)}
                                        style={{ padding: '11px 14px', fontSize: '13px', appearance: 'none', cursor: 'pointer', width: '100%', borderRadius: '10px' }}
                                    >
                                        <option value="" style={{ background: 'var(--v4-card-bg)' }}>-- Select Profile --</option>
                                        {lightingProfiles.map(p => <option key={p.id} value={p.id} style={{ background: 'var(--v4-card-bg)' }}>{p.name} ({p.intensity_percent}%)</option>)}
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--v4-text-muted)', fontSize: '12px' }}>▼</div>
                                </div>
                            </div>

                            <div className="recipe-input-group" style={{ margin: 0 }}>
                                <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Start Time</label>
                                <input
                                    type="time"
                                    className="recipe-main-input"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    style={{ padding: '10px 12px', fontSize: '13px', borderRadius: '10px', width: '100%' }}
                                />
                            </div>

                             <div className="recipe-input-group" style={{ margin: 0 }}>
                                <label className="recipe-field-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v4-text-secondary)', marginBottom: '8px', display: 'block' }}>Duration (Mins)</label>
                                <input
                                    type="number"
                                    className="recipe-main-input"
                                    value={durationMins}
                                    onChange={e => setDurationMins(parseInt(e.target.value || 0))}
                                    style={{ padding: '10px 12px', fontSize: '13px', borderRadius: '10px', width: '100%' }}
                                />
                            </div>

                             <button
                                className="btn-save-recipe"
                                style={{
                                    margin: 0,
                                    padding: '11px 16px',
                                    background: 'var(--accent-amber, #f59e0b)',
                                    color: '#000',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    height: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    border: 'none',
                                    boxShadow: 'none'
                                }}
                                onClick={handleAdd}
                            >
                                <CalendarClock size={16} /> Schedule Activation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM PANEL: ACTIVE SCHEDULES */}
            <div className="col-12">
                <div className="premium-table-container" style={{ padding: '24px 28px' }}>
                    <div className="premium-table-header" style={{ marginBottom: '20px' }}>
                        <h2 className="premium-table-title">
                            <div className="premium-icon-box" style={{ border: '2px solid var(--accent-amber, #f59e0b)', color: 'var(--accent-amber, #f59e0b)' }}>
                                <CalendarClock size={18} />
                            </div>
                            Active Lighting Schedules
                        </h2>
                        <p className="premium-table-desc">Automated lighting cycles and rules</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '20px'
                    }}>
                        {lightingSchedules.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--v4-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                No schedules active. Create a rule to begin automation.
                            </div>
                        ) : (
                            lightingSchedules.map(sch => {
                                const light = lights.find(l => l.id === sch.actuator_id) || { label: 'Unknown Light' };
                                const profile = lightingProfiles.find(p => p.id === sch.profile_id) || { name: 'Unknown', intensity_percent: 0 };
                                const endTime = getEndTime(sch.start_time, sch.duration_seconds);
                                const priority = getPriority(profile.intensity_percent);
                                const isEditing = editingId === sch.id;
                                const isOneTime = !!sch.scheduled_date || !sch.days_of_week?.length;

                                // Dynamic tags based on device and profile
                                const tags = ['lighting', 'led', profile.name?.toLowerCase().replace(/\s+/g, '-') || 'growth'];

                                return (
                                    <div
                                        key={sch.id}
                                        className="premium-sch-card"
                                        style={{
                                            padding: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            borderRadius: '12px',
                                            margin: 0
                                        }}
                                    >
                                        {/* Header Row: Inline Icon, Title, and Badges */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Sun size={20} style={{ color: '#fb923c' }} />
                                                <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--v4-text-primary)', letterSpacing: '-0.3px' }}>
                                                    {light.label || 'Grow Light'}
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    color: isOneTime ? '#c084fc' : '#38bdf8',
                                                    background: isOneTime ? 'rgba(139, 92, 246, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    border: `1px solid ${isOneTime ? 'rgba(139, 92, 246, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                                                }}>
                                                    {isOneTime ? 'One-Time' : 'Recurring'}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    color: priority.color,
                                                    background: priority.bg,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {priority.label}
                                                </span>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    color: sch.is_active ? '#10b981' : '#ef4444',
                                                    background: sch.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {sch.is_active ? 'Active' : 'Paused'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div style={{ fontSize: '13px', color: 'var(--v4-text-secondary)', fontWeight: 500, marginTop: -4 }}>
                                            Supplemental lighting for optimal growth
                                        </div>

                                        {/* Start and End Times - Clean text list, NO SHADING */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '24px',
                                            fontSize: '14px',
                                            color: 'var(--v4-text-secondary)',
                                            marginTop: '4px'
                                        }}>
                                            <div>
                                                Start: <span style={{ color: 'var(--v4-text-primary)', fontWeight: 700 }}>{isOneTime ? formatDisplayDate(sch.scheduled_date) : getFormattedDate()}, {(sch.start_time || '18:00').substring(0, 5)}:00</span>
                                            </div>
                                            <div>
                                                End: <span style={{ color: 'var(--v4-text-primary)', fontWeight: 700 }}>{isOneTime ? getEndDisplayDate(sch.scheduled_date, sch.start_time, sch.duration_seconds) : getEndDisplayDate(null, sch.start_time, sch.duration_seconds)}, {endTime}:00</span>
                                            </div>
                                        </div>

                                        {/* Content Area: static text (read-only) or input forms (editing) */}
                                        {isEditing ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>TARGET LIGHT</label>
                                                        <select
                                                            className="premium-sch-select"
                                                            value={sch.actuator_id || ''}
                                                            onChange={(e) => updateLightingSchedule(sch.id, { actuator_id: e.target.value })}
                                                        >
                                                            {lights.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>APPLY PROFILE</label>
                                                        <select
                                                            className="premium-sch-select"
                                                            value={sch.profile_id || ''}
                                                            onChange={(e) => updateLightingSchedule(sch.id, { profile_id: e.target.value })}
                                                        >
                                                            {lightingProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>START TIME</label>
                                                        <input
                                                            type="time"
                                                            className="premium-sch-input"
                                                            value={(sch.start_time || '00:00:00').substring(0, 5)}
                                                            onChange={(e) => updateLightingSchedule(sch.id, { start_time: e.target.value + ':00' })}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>DURATION (MINS)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            className="premium-sch-input"
                                                            value={Math.round((sch.duration_seconds || 3600) / 60)}
                                                            onChange={(e) => updateLightingSchedule(sch.id, { duration_seconds: Math.max(1, parseInt(e.target.value || 1)) * 60 })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Frequency Toggle in Edit Mode */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                                    <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>FREQUENCY</label>
                                                    <div className="schedule-type-tab-container" style={{ width: '100%', padding: '2px', display: 'flex', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            className={`schedule-type-tab-btn ${!sch.scheduled_date ? 'active' : ''}`}
                                                            onClick={() => updateLightingSchedule(sch.id, { scheduled_date: null, days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] })}
                                                            style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}
                                                        >
                                                            <RefreshCw size={11} /> Recurring
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`schedule-type-tab-btn ${sch.scheduled_date ? 'active' : ''}`}
                                                            onClick={() => updateLightingSchedule(sch.id, { scheduled_date: new Date().toISOString().split('T')[0], days_of_week: [] })}
                                                            style={{ flex: 1, padding: '6px', fontSize: '11px', fontWeight: 700, borderRadius: '6px' }}
                                                        >
                                                            <Calendar size={11} /> One-Time
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Conditional Day Toggles or Calendar Date Input in Edit Mode */}
                                                {!sch.scheduled_date ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>ACTIVE DAYS</label>
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            {DAYS.map(day => {
                                                                const active = sch.days_of_week?.includes(day.value);
                                                                return (
                                                                    <div
                                                                        key={day.value}
                                                                        onClick={() => toggleDay(sch, day.value)}
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '28px',
                                                                            borderRadius: '6px',
                                                                            fontSize: '11px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                            fontWeight: 800,
                                                                            background: active ? '#f97316' : 'rgba(255,255,255,0.02)',
                                                                            color: active ? '#fff' : '#64748b',
                                                                            border: `1px solid ${active ? '#f97316' : 'rgba(255,255,255,0.05)'}`,
                                                                            boxShadow: active ? '0 4px 10px rgba(249, 115, 22, 0.3)' : 'none',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        {day.label}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--v4-text-muted)', fontWeight: 800 }}>EXECUTION DATE</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <Calendar size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)', pointerEvents: 'none' }} />
                                                            <input
                                                                type="date"
                                                                className="premium-sch-input"
                                                                value={sch.scheduled_date}
                                                                onChange={(e) => updateLightingSchedule(sch.id, { scheduled_date: e.target.value })}
                                                                style={{ paddingLeft: '32px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Zone & Profile - Clean Text */}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '24px',
                                                    fontSize: '14px',
                                                    color: 'var(--v4-text-secondary)',
                                                    marginTop: '4px'
                                                }}>
                                                    <div>
                                                        Zone: <span style={{ color: 'var(--v4-text-primary)', fontWeight: 700 }}>{getLightZoneName(sch.actuator_id)}</span>
                                                    </div>
                                                    <div>
                                                        Profile: <span style={{ color: 'var(--v4-text-primary)', fontWeight: 700 }}>{profile.name}</span>
                                                    </div>
                                                </div>

                                                {/* Repeats Indicators & Tags */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        {isOneTime ? (
                                                            <>
                                                                <Calendar size={15} style={{ color: '#c084fc' }} />
                                                                <span style={{ fontSize: '14px', color: '#c084fc', fontWeight: 700 }}>
                                                                    Run once on {formatDate(sch.scheduled_date)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RefreshCw size={15} style={{ color: '#38bdf8' }} />
                                                                <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 700 }}>
                                                                    Repeat every {(sch.days_of_week && sch.days_of_week.length > 0) ? (
                                                                        sch.days_of_week.length === 7 ? 'day' : sch.days_of_week.join(', ')
                                                                    ) : 'day'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Tags */}
                                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                        {tags.map(t => (
                                                            <span
                                                                key={t}
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 700,
                                                                    color: 'var(--v4-text-muted)',
                                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    textTransform: 'lowercase',
                                                                    letterSpacing: '0.2px'
                                                                }}
                                                            >
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Footer Row: Divider, Automated status, Action buttons */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                            paddingTop: '14px',
                                            marginTop: '8px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontSize: '13px', fontWeight: 800, letterSpacing: '0.8px' }}>
                                                <Zap size={14} />
                                                <span>AUTOMATED</span>
                                            </div>

                                            {/* Action Buttons: Clean bare icons matching Image 2 */}
                                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                                {/* Edit Rule Toggle */}
                                                <button
                                                    className="sch-action-btn-bare"
                                                    onClick={() => setEditingId(isEditing ? null : sch.id)}
                                                    title={isEditing ? "Save & Close" : "Edit Rule"}
                                                >
                                                    {isEditing ? <Check size={16} style={{ color: '#10b981' }} /> : <Edit2 size={16} />}
                                                </button>

                                                {/* Duplicate Button */}
                                                <button
                                                    className="sch-action-btn-bare"
                                                    onClick={() => handleDuplicate(sch)}
                                                    title="Duplicate Rule"
                                                >
                                                    <Copy size={16} />
                                                </button>

                                                {/* Pause / Play Status Toggle */}
                                                <button
                                                    className={`sch-action-btn-bare ${sch.is_active ? 'pause' : 'play'}`}
                                                    onClick={() => updateLightingSchedule(sch.id, { is_active: !sch.is_active })}
                                                    title={sch.is_active ? "Pause Schedule" : "Activate Schedule"}
                                                >
                                                    {sch.is_active ? <Pause size={16} /> : <Play size={16} />}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    className="sch-action-btn-bare delete"
                                                    onClick={() => deleteLightingSchedule(sch.id)}
                                                    title="Delete Rule"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LightingScheduler;
