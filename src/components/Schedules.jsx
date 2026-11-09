import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Clock, Droplets, FlaskConical, Trash2, Pencil,
  CalendarDays, Calendar, RefreshCw, ChevronDown, Pause, Play
} from 'lucide-react';

const GROUPS = {
  irrigation: {
    label: 'Irrigation & Water',
    icon: Droplets,
    color: 'var(--accent-water)',
    types: ['irrigation', 'pump', 'misters', 'main_water_pump', 'irrigation_pump']
  },
  ventilation: {
    label: 'Fans & Ventilation',
    icon: Clock,
    color: 'var(--accent-purple)',
    types: ['ventilation', 'fan', 'exhaust', 'exhaust_fan', 'air_circulation', 'shade_curtains']
  },
  fertigation: {
    label: 'Fertigation Sys',
    icon: FlaskConical,
    color: 'var(--primary)',
    types: ['fertigation', 'tank_filling', 'mixer', 'tank_filling_pump', 'fertilizer_mixer', 'fertilizer_pump']
  },
};

const DAYS = [
  { label: 'Mo', value: 'Mon' },
  { label: 'Tu', value: 'Tue' },
  { label: 'We', value: 'Wed' },
  { label: 'Th', value: 'Thu' },
  { label: 'Fr', value: 'Fri' },
  { label: 'Sa', value: 'Sat' },
  { label: 'Su', value: 'Sun' }
];

const DAY_VALUES = DAYS.map(d => d.value);

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'No date selected';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatClock = (timeStr) => {
  if (!timeStr) return '00:00';
  return timeStr.slice(0, 5);
};

const getDurationLabel = (seconds = 0) => {
  if (!seconds) return '0 min';
  if (seconds % 60 === 0) return `${Math.max(1, Math.round(seconds / 60))} min`;
  return `${seconds} sec`;
};

const getEndTime = (startTimeStr, durationSeconds) => {
  if (!startTimeStr) return '00:00';
  const [hoursRaw, minsRaw] = startTimeStr.split(':');
  const hours = parseInt(hoursRaw, 10) || 0;
  const mins = parseInt(minsRaw, 10) || 0;
  const totalMinutes = hours * 60 + mins + Math.max(1, Math.floor((durationSeconds || 0) / 60));
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
};

const ScheduleCard = ({ sch, actuator, onEdit, onToggleActive, onDelete }) => {
  const isOneTime = !!sch.scheduled_date || !sch.days_of_week?.length;
  const activeDays = sch.days_of_week || [];
  const durationSeconds = sch.duration_seconds ?? 600;
  const tags = [actuator.actuator_type, isOneTime ? 'one-time' : 'daily', sch.is_active ? 'automated' : 'paused'].filter(Boolean);

  return (
    <div className={`sch-card-v4 ${sch.is_active ? 'status-active' : 'status-disabled'} ${isOneTime ? 'status-one-time' : ''}`}>
      <div className="sch-card-meta">
        <div className="sch-card-title">
          <div className="sch-card-icon-shell">
            {isOneTime ? <CalendarDays size={16} /> : <RefreshCw size={16} />}
          </div>
          <span>{actuator.label}</span>
          <span className="sch-status-pill high">High</span>
          <span className={`sch-status-pill ${sch.is_active ? 'active' : 'inactive'}`}>{sch.is_active ? 'Active' : 'Paused'}</span>
        </div>
        <div className="sch-card-schedule-info">
          <span className="sch-card-subline">
            {isOneTime
              ? `Run once on ${formatDateLabel(sch.scheduled_date)}`
              : `Repeats every ${activeDays.length === 7 ? 'day' : activeDays.join(', ')}`
            }
          </span>
        </div>
        <div className="sch-card-meta-grid">
          <div className="sch-card-schedule-info">
            <span>Start:</span>
            <strong style={{ color: 'var(--v4-text-primary)' }}>{formatClock(sch.start_time)}</strong>
          </div>
          <div className="sch-card-schedule-info">
            <span>End:</span>
            <strong style={{ color: 'var(--v4-text-primary)' }}>{getEndTime(sch.start_time, durationSeconds)}</strong>
          </div>
          <div className="sch-card-schedule-info">
            <span>Type:</span>
            <strong style={{ color: isOneTime ? '#c084fc' : '#38bdf8' }}>{isOneTime ? 'One-Time' : 'Recurring'}</strong>
          </div>
          <div className="sch-card-schedule-info">
            <span>Days:</span>
            <strong style={{ color: 'var(--v4-text-primary)' }}>{isOneTime ? 'Date-based' : (activeDays.length === 7 ? 'Every day' : activeDays.join(', '))}</strong>
          </div>
        </div>
        <div className="sch-card-ingredients">
          {tags.map(t => <span key={t} className="sch-chip">{t}</span>)}
        </div>
      </div>

      <div className="sch-card-actions">
        <button
          className="sch-action-btn-bare edit"
          onClick={() => onEdit(sch, actuator)}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          className="sch-action-btn-bare play"
          onClick={() => onToggleActive(sch.id, { is_active: !sch.is_active })}
          title={sch.is_active ? 'Pause' : 'Activate'}
        >
          {sch.is_active ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="sch-action-btn-bare" onClick={() => onDelete(sch.id)} title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const Schedules = ({ actuators = [], schedules = [], addSchedule, updateSchedule, deleteSchedule, loading }) => {
  const [selectedActuatorId, setSelectedActuatorId] = useState('');
  const [scheduleType, setScheduleType] = useState('recurring');
  const [selectedDays, setSelectedDays] = useState([...DAY_VALUES]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [editingScheduleId, setEditingScheduleId] = useState('');

  useEffect(() => {
    const firstScheduleMode = actuators.find(a => a.control_mode === 'schedule') || actuators[0];
    if (!selectedActuatorId && firstScheduleMode) setSelectedActuatorId(firstScheduleMode.id);
  }, [actuators, selectedActuatorId]);

  const scheduleActuators = useMemo(
    () => actuators.filter(a => a.control_mode === 'schedule'),
    [actuators]
  );

  const scheduleCards = useMemo(
    () => schedules
      .map(sch => ({
        sch,
        actuator: actuators.find(a => a.id === sch.actuator_id)
      }))
      .filter(item => item.actuator),
    [schedules, actuators]
  );

  const resetScheduleForm = () => {
    setEditingScheduleId('');
    setScheduleType('recurring');
    setSelectedDays([...DAY_VALUES]);
    setScheduledDate('');
    setStartTime('08:00');
    setDurationMinutes(60);
    setIsActive(true);
  };

  const beginEditSchedule = (sch, actuator) => {
    setEditingScheduleId(sch.id);
    setSelectedActuatorId(sch.actuator_id || actuator?.id || '');
    setScheduleType(sch.scheduled_date || !sch.days_of_week?.length ? 'one-time' : 'recurring');
    setSelectedDays((sch.days_of_week && sch.days_of_week.length) ? sch.days_of_week : [...DAY_VALUES]);
    setScheduledDate(sch.scheduled_date ? String(sch.scheduled_date).slice(0, 10) : '');
    setStartTime(formatClock(sch.start_time));
    setDurationMinutes(Math.max(1, Math.round((sch.duration_seconds ?? 600) / 60)));
    setIsActive(!!sch.is_active);
  };

  const handleCreateSchedule = async () => {
    if (!selectedActuatorId) return alert('Select an actuator');
    if (!startTime) return alert('Select a start time');
    if (!durationMinutes || durationMinutes < 1) return alert('Select a duration');
    if (scheduleType === 'recurring' && selectedDays.length === 0) return alert('Select at least one active day');
    if (scheduleType === 'one-time' && !scheduledDate) return alert('Select a specific date');

    const payload = {
      actuator_id: selectedActuatorId,
      start_time: `${startTime}:00`,
      duration_seconds: Math.max(1, parseInt(durationMinutes, 10)) * 60,
      days_of_week: scheduleType === 'one-time' ? [] : selectedDays,
      scheduled_date: scheduleType === 'one-time' ? scheduledDate : null,
      is_active: isActive
    };

    const res = editingScheduleId
      ? await updateSchedule(editingScheduleId, payload)
      : await addSchedule(payload);
    if (!res?.error) {
      resetScheduleForm();
    }
  };

  const toggleBuilderDay = (day) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (loading) {
    return <div style={{ padding: 20, color: 'var(--v4-text-primary)' }}>Loading Schedules...</div>;
  }

  return (
    <div className="schedules-page-premium">
      <style>{`
        .schedules-page-premium {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding-bottom: 28px;
        }
        .schedules-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-radius: 20px;
          background: var(--v4-panel-bg);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
        }
        .schedules-hero-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .schedules-hero-title {
          font-size: clamp(24px, 3vw, 34px);
          line-height: 1;
          letter-spacing: -0.05em;
          color: var(--text-primary);
          font-weight: 800;
        }
        .schedules-hero-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
          max-width: 760px;
        }
        .schedules-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.18);
          color: var(--accent-green);
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .schedules-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .schedules-builder,
        .schedules-list-panel,
        .schedules-group-card {
          background: var(--v4-card-bg);
          border: 1px solid var(--v4-border);
          border-radius: 20px;
          box-shadow: var(--glass-shadow);
        }
        .schedules-builder {
          padding: 22px;
        }
        .builder-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }
        .builder-floating-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .builder-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .builder-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 211, 238, 0.12);
          color: #22d3ee;
        }
        .builder-heading h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .builder-heading p {
          margin: 2px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }
        .builder-status {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .builder-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 18px 0;
        }
        .builder-frequency-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: start;
        }
        .builder-section-label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .schedule-type-tab-container {
          display: flex;
          width: fit-content;
          gap: 4px;
          padding: 4px;
          border-radius: 14px;
          background: var(--v4-panel-bg);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .schedule-type-tab-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .schedule-type-tab-btn.active {
          background: #2dd4bf;
          color: #05111f;
        }
        .schedule-type-tab-btn:hover {
          color: #fff;
        }
        .builder-days {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .day-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: var(--v4-panel-bg);
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .day-circle-btn.active {
          background: #f97316;
          border-color: #f97316;
          color: #fff;
          box-shadow: 0 8px 16px rgba(249, 115, 22, 0.22);
        }
        .builder-forms {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }
        .builder-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .builder-input,
        .builder-select {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid var(--v4-border);
          background: var(--v4-panel-bg);
          color: var(--text-primary);
          font-family: var(--brand-sans);
          font-size: 13px;
          font-weight: 700;
          outline: none;
        }
        .builder-select {
          appearance: none;
          cursor: pointer;
        }
        .builder-inline {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .builder-date-wrap {
          position: relative;
        }
        .builder-date-wrap svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .builder-input.date {
          padding-left: 36px;
        }
        .builder-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
        }
        .builder-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .builder-active-toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
        }
        .builder-switch {
          width: 48px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          cursor: pointer;
        }
        .builder-switch.on {
          background: #10b981;
        }
        .builder-switch-knob {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #fff;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: left 0.2s ease;
        }
        .builder-switch.on .builder-switch-knob {
          left: 25px;
        }
        .builder-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 12px;
          border: none;
          background: #2dd4bf;
          color: #05111f;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .builder-cancel-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid var(--v4-border);
          background: var(--v4-panel-bg);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }
        .schedules-list-panel {
          padding: 18px;
        }
        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .section-heading-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .section-heading-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #22d3ee;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.18);
          flex-shrink: 0;
        }
        .section-heading-copy {
          min-width: 0;
        }
        .section-heading h3 {
          margin: 0;
          font-size: 20px;
          color: var(--text-primary);
          letter-spacing: -0.04em;
        }
        .section-heading p {
          margin: 4px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }
        .schedule-count-badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.16);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .schedule-list-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .schedule-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .schedules-group-card {
          padding: 18px;
        }
        .group-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .group-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(56, 189, 248, 0.08);
          color: #38bdf8;
          flex-shrink: 0;
        }
        .group-name {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .group-sub {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .group-count {
          margin-left: auto;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 800;
        }
        .actuator-schedule-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .actuator-schedule-item {
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--v4-card-bg);
          border: 1px solid var(--v4-border);
        }
        .actuator-schedule-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .actuator-schedule-name {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .actuator-schedule-warning {
          font-size: 10px;
          color: var(--accent-red);
          font-weight: 800;
          margin-top: 3px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .actuator-schedule-quick {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid rgba(56, 189, 248, 0.16);
          background: rgba(56, 189, 248, 0.08);
          color: #38bdf8;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
        }
        .sch-work-card {
          background: var(--v4-card-bg);
          border: 1px solid var(--v4-border);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.25s ease;
          box-shadow: var(--glass-shadow);
        }
        .sch-card-icon-shell {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          margin-right: 2px;
        }
        .sch-status-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin-left: auto;
        }
        .sch-status-pill.high {
          background: rgba(249, 115, 22, 0.12);
          color: #fb923c;
        }
        .sch-status-pill.active {
          background: rgba(16, 185, 129, 0.12);
          color: #22c55e;
          margin-left: 0;
        }
        .sch-status-pill.inactive {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
          margin-left: 0;
        }
        .sch-card-subline {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .sch-card-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .sch-card-v4 {
          background: var(--v4-card-bg);
          border: 1px solid var(--v4-border);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          box-shadow: var(--glass-shadow);
        }
        .sch-card-meta {
          min-width: 0;
          flex: 1;
        }
        .sch-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sch-card-title span:first-of-type {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .sch-card-schedule-info {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 12px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .sch-card-schedule-info span {
          color: var(--text-muted);
        }
        .sch-card-ingredients {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .sch-card-actions {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .sch-action-btn-bare {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sch-action-btn-bare.play {
          color: #f59e0b;
        }
        .sch-action-btn-bare.edit {
          color: #c084fc;
        }
        .sch-card-v4.status-disabled {
          opacity: 0.8;
        }
        .sch-work-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.16);
        }
        .sch-work-card.inactive {
          opacity: 0.75;
        }
        .sch-work-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .sch-work-info {
          min-width: 0;
        }
        .sch-work-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sch-work-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .sch-work-chip {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .sch-work-chip.recurring {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
        }
        .sch-work-chip.one-time {
          background: rgba(167, 139, 250, 0.12);
          color: #c084fc;
        }
        .sch-work-chip.active {
          background: rgba(16, 185, 129, 0.12);
          color: var(--accent-green);
        }
        .sch-work-chip.paused {
          background: rgba(249, 115, 22, 0.12);
          color: #fb923c;
        }
        .sch-work-sub {
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .sch-work-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .sch-work-toggle {
          width: 48px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          cursor: pointer;
        }
        .sch-work-toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #94a3b8;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: left 0.2s ease, background 0.2s ease;
        }
        .sch-work-toggle-knob.on {
          left: 25px;
          background: #2dd4bf;
        }
        .sch-work-icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid rgba(248, 113, 113, 0.18);
          background: rgba(248, 113, 113, 0.08);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sch-work-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .sch-work-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sch-work-field span,
        .sch-work-field-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sch-work-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--v4-border);
          background: var(--v4-panel-bg);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 700;
          outline: none;
          font-family: var(--brand-sans);
        }
        .sch-work-frequency,
        .sch-work-days {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sch-work-switch-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sch-work-switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid var(--v4-border);
          background: var(--v4-panel-bg);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .sch-work-switch.active {
          background: var(--v4-card-bg);
          color: #fff;
        }
        .sch-day-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sch-day-chip {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid var(--v4-border);
          background: var(--v4-panel-bg);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .sch-day-chip.active {
          background: #f97316;
          color: #fff;
          border-color: #f97316;
        }
        .sch-date-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border-radius: 12px;
          background: var(--v4-panel-bg);
          border: 1px solid var(--v4-border);
          color: var(--text-muted);
        }
        .sch-work-input.date {
          border: none;
          background: transparent;
          padding-left: 0;
        }
        .sch-work-date-note {
          font-size: 12px;
          color: #c084fc;
          font-weight: 700;
        }
        .sch-work-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--v4-border);
          color: var(--text-muted);
          font-size: 12px;
        }
        .sch-work-summary-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #38bdf8;
          font-weight: 700;
        }
        .sch-work-summary-right {
          color: var(--text-secondary);
          font-weight: 800;
        }
        .sch-work-footer {
          display: flex;
          justify-content: flex-end;
        }
        .sch-work-add-quick {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid rgba(56, 189, 248, 0.14);
          background: rgba(56, 189, 248, 0.08);
          color: #38bdf8;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .empty-state-card {
          padding: 28px;
          border-radius: 16px;
          background: var(--v4-panel-bg);
          border: 1px dashed var(--v4-border);
          color: var(--text-muted);
          text-align: center;
        }
        .sch-chip {
          padding: 5px 10px;
          border-radius: 8px;
          background: var(--v4-mode-bg);
          border: 1px solid var(--v4-border);
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: lowercase;
        }
        @media (max-width: 768px) {
          .schedules-hero,
          .builder-title-row,
          .sch-work-top,
          .sch-work-summary {
            flex-direction: column;
            align-items: flex-start;
          }
          .builder-frequency-row,
          .builder-forms,
          .sch-work-grid {
            grid-template-columns: 1fr;
          }
          .schedule-card-grid {
            grid-template-columns: 1fr;
          }
          .sch-card-meta-grid {
            grid-template-columns: 1fr;
          }
          .schedule-type-tab-container {
            width: 100%;
          }
          .schedule-type-tab-btn {
            flex: 1;
          }
        }
      `}</style>

      <div className="schedules-stack">
        <div className="schedules-builder">
          <div className="builder-floating-title">
            <div className="builder-icon">
              <Plus size={18} />
            </div>
            <div className="builder-heading">
              <h2>Add Schedule</h2>
              <p>Create a recurring cycle or a one-time execution.</p>
            </div>
          </div>

          <div className="builder-divider" />

          <div className="builder-frequency-row">
            <div>
              <label className="builder-section-label">Schedule Frequency</label>
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

            <div>
              <label className="builder-section-label">
                {scheduleType === 'recurring' ? 'Repeat on Days' : 'Execution Date'}
              </label>
              {scheduleType === 'recurring' ? (
                <div className="builder-days">
                  {DAYS.map(day => {
                    const active = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        className={`day-circle-btn ${active ? 'active' : ''}`}
                        onClick={() => toggleBuilderDay(day.value)}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="builder-date-wrap">
                  <CalendarDays size={14} />
                  <input
                    type="date"
                    className="builder-input date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="builder-forms">
            <label className="builder-field">
              <span className="builder-section-label">Target Actuator</span>
              <div style={{ position: 'relative' }}>
                <select
                  className="builder-select"
                  value={selectedActuatorId}
                  onChange={(e) => setSelectedActuatorId(e.target.value)}
                >
                  <option value="">-- Select Actuator --</option>
                  {scheduleActuators.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--v4-text-muted)', pointerEvents: 'none' }} />
              </div>
            </label>

            <label className="builder-field">
              <span className="builder-section-label">Start Time</span>
              <input
                type="time"
                className="builder-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label className="builder-field">
              <span className="builder-section-label">Duration (Mins)</span>
              <input
                type="number"
                min="1"
                step="1"
                className="builder-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value || 1, 10))}
              />
            </label>

            <label className="builder-field">
              <span className="builder-section-label">Schedule Status</span>
              <div className="builder-active-toggle">
                <div className={`builder-switch ${isActive ? 'on' : ''}`} onClick={() => setIsActive(v => !v)}>
                  <div className="builder-switch-knob" />
                </div>
                <span>{isActive ? 'Active' : 'Paused'}</span>
              </div>
            </label>
          </div>

          <div className="builder-footer">
            <div className="builder-active-toggle" style={{ color: 'var(--text-muted)' }}>
              {scheduleType === 'one-time'
                ? 'One-time schedules use a specific date.'
                : 'Recurring schedules use selected weekdays.'}
            </div>
            <div className="builder-footer-actions">
              {editingScheduleId ? (
                <button className="builder-cancel-btn" onClick={resetScheduleForm}>
                  Cancel Edit
                </button>
              ) : null}
              <button className="builder-save-btn" onClick={handleCreateSchedule}>
                <CalendarDays size={16} />
                {editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>

        <div className="schedules-list-panel">
          <div className="section-heading">
            <div className="section-heading-left">
              <div className="section-heading-icon">
                <CalendarDays size={18} />
              </div>
              <div className="section-heading-copy">
              <h3>Active Schedules</h3>
              <p>Automated cycles and one-time rules grouped in a compact grid.</p>
              </div>
            </div>
            <div className="schedule-count-badge">{schedules.length} total</div>
          </div>

          <div className="schedule-card-grid">
            {scheduleCards.length === 0 ? (
              <div className="empty-state-card">No active schedules configured yet.</div>
            ) : (
              scheduleCards.map(({ sch, actuator }) => (
              <ScheduleCard
                key={sch.id}
                sch={sch}
                actuator={actuator}
                onEdit={beginEditSchedule}
                onToggleActive={updateSchedule}
                onDelete={deleteSchedule}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedules;
