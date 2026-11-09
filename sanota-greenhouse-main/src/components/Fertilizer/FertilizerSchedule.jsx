import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, Calendar, RefreshCw, Clock, Beaker, X, Activity } from 'lucide-react';

const DAYS = [
  { label: 'Mo', value: 'Mon' },
  { label: 'Tu', value: 'Tue' },
  { label: 'We', value: 'Wed' },
  { label: 'Th', value: 'Thu' },
  { label: 'Fr', value: 'Fri' },
  { label: 'Sa', value: 'Sat' },
  { label: 'Su', value: 'Sun' }
];

const FertilizerSchedule = ({
  recipes = [],
  schedules = [],
  inventory = [],
  addSchedule,
  deleteSchedule,
  toggleSchedule,
  actuators = []
}) => {
  const mixer = actuators.find(a => a.label.includes('Mixer')) || {};
  const isScheduleMode = mixer.control_mode === 'schedule';

  // Toggle for the "New Schedule" Configurator Modal
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [scheduleType, setScheduleType] = useState('recurring'); // 'recurring' | 'one-time'
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [time, setTime] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');

  const toggleDay = (val) => {
    setSelectedDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]);
  };

  const handleCreateSchedule = () => {
    if (!selectedRecipeId) {
      return alert('Please select a nutrient recipe.');
    }
    if (!time) {
      return alert('Please choose an execution time.');
    }

    if (scheduleType === 'one-time') {
      if (!scheduledDate) {
        return alert('Please select a specific date.');
      }

      addSchedule({
        recipeId: selectedRecipeId,
        time,
        daysOfWeek: [],
        scheduledDate
      });
    } else {
      if (selectedDays.length === 0) {
        return alert('Please select at least one repeat day.');
      }

      addSchedule({
        recipeId: selectedRecipeId,
        time,
        daysOfWeek: selectedDays,
        scheduledDate: null
      });
    }

    // Reset fields & close modal
    setSelectedRecipeId('');
    setTime('');
    setSelectedDays([]);
    setScheduledDate('');
    setShowForm(false);
  };

  // Format Helper: Specific Date to Human Friendly Format
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format Helper: 24h Time to 12h Format
  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minStr} ${ampm}`;
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);
  const activeSchedulesCount = schedules.filter(s => s.isActive !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* =============================================
         PREMIUM HEADER BAR (MATCHES SCREENSHOT)
         ============================================= */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--v4-text-primary)',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Nutrient Dosing & Scheduling
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--v4-text-secondary)',
            fontWeight: 500,
            margin: 0
          }}>
            Automated nutrient injection and scheduling system
          </p>
        </div>

        {/* Action Widgets Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

          {/* Glowing Active Count Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: '24px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.18)',
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 700
          }}>
            <Activity size={14} style={{ color: '#38bdf8', animation: 'pulse 2s infinite' }} />
            <span>{activeSchedulesCount} Active {activeSchedulesCount === 1 ? 'Schedule' : 'Schedules'}</span>
          </div>

          {/* New Schedule Trigger Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              color: 'var(--v4-text-primary)',
              transition: 'transform 0.15s'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={16} /> New Schedule
          </button>
        </div>
      </div>

      {/* =============================================
         MIXER MODE ALERT BANNER
         ============================================= */}
      {!isScheduleMode && schedules.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.18)',
          padding: '14px 20px',
          borderRadius: 14,
          color: '#f87171',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span>
            <strong>Mixer Status Alert:</strong> The Fertilizer Mixer is not currently set to <strong>Schedule Mode</strong>. Automation schedules will not run on physical hardware until the Mixer mode selector is switched to Schedule.
          </span>
        </div>
      )}

      {/* =============================================
         SCHEDULES DISPLAY GRID (MATCHES PUMP CARDS STYLE)
         ============================================= */}
      {schedules.length === 0 ? (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '80px 40px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          border: '1px dashed rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <CalendarClock size={52} style={{ color: 'rgba(255,255,255,0.06)' }} />
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800, color: 'var(--v4-text-primary)' }}>No Active Schedules Found</p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Click the "+ New Schedule" button at the top-right to configure automated nutrient cycles.</p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {schedules.map((sch, idx) => {
            const r = recipes.find(rec => rec.id === sch.recipeId);
            const isEnabled = sch.isActive !== false;
            const isOneTime = !!sch.scheduledDate;

            return (
              <div
                key={sch.id}
                style={{
                  background: 'var(--v4-panel-bg)',
                  backdropFilter: 'blur(10px)',
                  border: isEnabled
                    ? (isOneTime ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(0, 242, 254, 0.2)')
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: isEnabled
                    ? (isOneTime ? '0 10px 25px rgba(139, 92, 246, 0.08)' : '0 10px 25px rgba(0, 242, 254, 0.08)')
                    : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isEnabled ? 1 : 0.6,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="premium-schedule-card-v4"
              >
                {/* Visual Accent Top Bar matching the screenshot glow */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, height: '3px',
                  background: !isEnabled
                    ? '#475569'
                    : (isOneTime ? 'linear-gradient(90deg, #8b5cf6, #c084fc)' : 'linear-gradient(90deg, #00f2fe, #4facfe)')
                }} />

                {/* Card Title & Controls Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                  {/* Title & Status Capsule */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--v4-text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <Beaker size={16} style={{ color: isEnabled ? (isOneTime ? '#a855f7' : '#00f2fe') : '#64748b' }} />
                      {r ? r.name : 'Unknown Recipe'}
                    </div>

                    {/* Status Pill Badge */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {isEnabled ? (
                        <span style={{
                          background: isOneTime ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isOneTime ? '#c084fc' : '#34d399',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: isOneTime ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {isOneTime ? 'One-Time' : 'Recurring'}
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(249, 115, 22, 0.2)',
                          color: '#ffedd5',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          border: '1px solid rgba(249, 115, 22, 0.3)'
                        }}>
                          PAUSED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle Slider and Trash Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                    {/* Switch Slider */}
                    <button
                      type="button"
                      className={`premium-switch ${isEnabled ? 'on' : ''}`}
                      onClick={() => toggleSchedule(sch.id)}
                      style={{
                        width: '52px',
                        height: '28px',
                        borderRadius: '14px',
                        background: isEnabled
                          ? (isOneTime ? '#8b5cf6' : '#22c55e')
                          : 'var(--v4-border)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: 'none',
                        outline: 'none',
                        boxShadow: isEnabled ? `0 0 12px ${isOneTime ? 'rgba(139, 92, 246, 0.4)' : 'rgba(34, 197, 94, 0.4)'}` : 'none'
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: isEnabled ? '27px' : '3px',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          boxShadow: '0 2px 4px var(--v4-icon-bg)'
                        }}
                      />
                    </button>

                    {/* Delete trash button */}
                    <button
                      type="button"
                      className="trash-btn-v4"
                      onClick={() => deleteSchedule(sch.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Delete Schedule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>

                {/* Sub-Card Box */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isEnabled
                      ? (isOneTime ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 242, 254, 0.15)')
                      : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isEnabled
                      ? (isOneTime ? '#c084fc' : '#00f2fe')
                      : '#64748b',
                    flexShrink: 0
                  }}>
                    {isOneTime ? <Calendar size={14} /> : <RefreshCw size={14} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '10px', color: 'var(--v4-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      INJECTION SCHEDULE
                    </span>
                    <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 600 }}>
                      {isOneTime ? (
                        <span>Run once on {formatDate(sch.scheduledDate)}</span>
                      ) : (
                        <span>Repeat every {sch.daysOfWeek.join(', ')}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Timing Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--v4-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} style={{ color: isEnabled ? (isOneTime ? '#a855f7' : '#00f2fe') : '#64748b' }} />
                    Dosing Execution Time:
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--v4-text-primary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    letterSpacing: '0.3px'
                  }}>
                    {formatTime12h(sch.time)}
                  </span>
                </div>

                {/* Injectors badge row */}
                {r && r.ingredients && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: '10px', color: 'var(--v4-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      SCHEDULED INJECTORS:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.ingredients.map((ing, i) => {
                        const item = inventory.find(inv => inv.id === ing.fertilizerId);
                        return (
                          <span key={i} className="recipe-ingredient-chip" style={{
                            padding: '4px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--v4-text-secondary)'
                          }}>
                            {item ? item.name.split(' ')[0] : 'Nutrient'}: {ing.amount} {item ? item.unit : 'ml'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* =============================================
         HIGH-FIDELITY GLASS OVERLAY MODAL FORM
         ============================================= */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--v4-panel-bg)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: 'linear-gradient(180deg, var(--v4-card-bg), var(--v4-card-bg))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '24px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            position: 'relative'
          }} className="glass-card">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarClock size={20} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--v4-text-primary)' }}>
                  Create Injection Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--v4-text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Fields Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Type selector */}
              <div>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--v4-text-muted)', marginBottom: 8 }}>
                  Schedule Frequency
                </label>
                <div className="schedule-type-tab-container" style={{ background: 'var(--v4-icon-bg)', padding: 3, borderRadius: 10 }}>
                  <button
                    type="button"
                    className={`schedule-type-tab-btn ${scheduleType === 'recurring' ? 'active' : ''}`}
                    onClick={() => setScheduleType('recurring')}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    <RefreshCw size={12} /> Recurring Cycle
                  </button>
                  <button
                    type="button"
                    className={`schedule-type-tab-btn ${scheduleType === 'one-time' ? 'active' : ''}`}
                    onClick={() => setScheduleType('one-time')}
                    style={{ padding: '8px', fontSize: '12px' }}
                  >
                    <Calendar size={12} /> One-Time Injection
                  </button>
                </div>
              </div>

              {/* Recipe Selector */}
              <div>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--v4-text-muted)', marginBottom: 8 }}>
                  Nutrient Recipe
                </label>
                <select
                  className="field-input"
                  value={selectedRecipeId}
                  onChange={e => setSelectedRecipeId(e.target.value)}
                  style={{ background: 'var(--v4-icon-bg)', border: '1px solid rgba(255,255,255,0.08)', width: '100%', padding: '11px 14px' }}
                >
                  <option value="">-- Choose Recipe --</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>

                {/* Recipe Composition Preview */}
                {selectedRecipe && selectedRecipe.ingredients && (
                  <div style={{
                    marginTop: 10,
                    padding: 10,
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedRecipe.ingredients.map((ing, i) => {
                        const item = inventory.find(inv => inv.id === ing.fertilizerId);
                        return (
                          <span key={i} className="recipe-ingredient-chip" style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            fontSize: '9px',
                            color: 'var(--v4-text-secondary)'
                          }}>
                            {item ? item.name : 'Unknown'}: {ing.amount} {item ? item.unit : 'ml'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Dosing Time */}
              <div>
                <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--v4-text-muted)', marginBottom: 8 }}>
                  Dosing Time
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 10 }} />
                  <input
                    type="time"
                    className="field-input"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    style={{ background: 'var(--v4-icon-bg)', border: '1px solid rgba(255,255,255,0.08)', width: '100%', padding: '11px 14px', paddingLeft: '40px' }}
                  />
                </div>
              </div>

              {/* Conditional Date Picker (One-Time) */}
              {scheduleType === 'one-time' && (
                <div>
                  <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--v4-text-muted)', marginBottom: 8 }}>
                    Dosing Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 10 }} />
                    <input
                      type="date"
                      className="field-input"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      style={{ background: 'var(--v4-icon-bg)', border: '1px solid rgba(255,255,255,0.08)', width: '100%', padding: '11px 14px', paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              )}

              {/* Conditional Day Selector (Recurring) */}
              {scheduleType === 'recurring' && (
                <div>
                  <label className="field-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--v4-text-muted)', marginBottom: 8 }}>
                    Repeat on Days
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 2 }}>
                    {DAYS.map(d => {
                      const isActive = selectedDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          className={`day-circle-btn ${isActive ? 'active' : ''}`}
                          onClick={() => toggleDay(d.value)}
                          style={{
                            width: '34px',
                            height: '34px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%'
                          }}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--v4-text-secondary)',
                    padding: '11px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSchedule}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                    border: 'none',
                    color: 'var(--v4-text-primary)',
                    padding: '11px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  Save Schedule
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FertilizerSchedule;
