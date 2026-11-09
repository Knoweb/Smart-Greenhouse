import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Plus, Minus, ArrowRight, ArrowLeft,
  Save, RotateCcw, Sprout, Trash2, Move,
  FileText, CheckCircle2, XCircle, Leaf,
  Ruler, Grid3x3, Maximize2, Eye, Sparkles, Layers, Box
} from 'lucide-react';
import '../index.css';

/* ─── Accent color palette for zone cards ─── */
const ZONE_COLORS = [
  { accent: '#0ea5e9', glow: 'rgba(14,165,233,0.25)', bg: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.25)', label: 'Sky' },
  { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.25)', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.25)', label: 'Violet' },
  { accent: '#f59e0b', glow: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', label: 'Amber' },
  { accent: '#10b981', glow: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.25)', label: 'Emerald' },
  { accent: '#ec4899', glow: 'rgba(236,72,153,0.25)', bg: 'rgba(236,72,153,0.06)', border: 'rgba(236,72,153,0.25)', label: 'Pink' },
  { accent: '#06b6d4', glow: 'rgba(6,182,212,0.25)', bg: 'rgba(6,182,212,0.06)', border: 'rgba(6,182,212,0.25)', label: 'Cyan' },
  { accent: '#f97316', glow: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.25)', label: 'Orange' },
  { accent: '#14b8a6', glow: 'rgba(20,184,166,0.25)', bg: 'rgba(20,184,166,0.06)', border: 'rgba(20,184,166,0.25)', label: 'Teal' },
  { accent: '#a855f7', glow: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.06)', border: 'rgba(168,85,247,0.25)', label: 'Purple' },
  { accent: '#ef4444', glow: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', label: 'Red' },
  { accent: '#84cc16', glow: 'rgba(132,204,22,0.25)', bg: 'rgba(132,204,22,0.06)', border: 'rgba(132,204,22,0.25)', label: 'Lime' },
  { accent: '#e879f9', glow: 'rgba(232,121,249,0.25)', bg: 'rgba(232,121,249,0.06)', border: 'rgba(232,121,249,0.25)', label: 'Fuchsia' },
];

const getZoneColor = (idx) => ZONE_COLORS[idx % ZONE_COLORS.length];

/* ─── Stepper indicator component ─── */
const StepIndicator = ({ currentStep }) => (
  <div className="ghd-step-indicator">
    <div className={`ghd-step-dot ${currentStep >= 1 ? 'active' : ''}`}>
      <div className="ghd-step-dot-inner">
        <Ruler size={14} />
      </div>
      <span className="ghd-step-label">Configure</span>
    </div>
    <div className={`ghd-step-line ${currentStep >= 2 ? 'active' : ''}`} />
    <div className={`ghd-step-dot ${currentStep >= 2 ? 'active' : ''}`}>
      <div className="ghd-step-dot-inner">
        <Eye size={14} />
      </div>
      <span className="ghd-step-label">Preview</span>
    </div>
  </div>
);

/* ─── Numeric stepper input ─── */
const NumStepper = ({ value, onDec, onInc, label, unit, min = 1, max = 99, color = 'var(--primary)' }) => (
  <div className="ghd-num-stepper">
    {label && <div className="ghd-num-stepper-label">{label}</div>}
    <div className="ghd-num-stepper-row">
      <button className="ghd-stepper-btn" onClick={onDec} disabled={value <= min}>
        <Minus size={14} />
      </button>
      <div className="ghd-stepper-value" style={{ '--stepper-color': color }}>
        <span className="ghd-stepper-num">{value}</span>
        {unit && <span className="ghd-stepper-unit">{unit}</span>}
      </div>
      <button className="ghd-stepper-btn" onClick={onInc} disabled={value >= max}>
        <Plus size={14} />
      </button>
    </div>
  </div>
);

/* ─── Stat pill component ─── */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="ghd-stat-pill" style={{ '--pill-color': color }}>
    <div className="ghd-stat-pill-icon">
      <Icon size={16} />
    </div>
    <div className="ghd-stat-pill-info">
      <span className="ghd-stat-pill-label">{label}</span>
      <span className="ghd-stat-pill-value">{value}</span>
    </div>
  </div>
);

const GreenhouseDesigner = ({ savedDesigns = [], addDesign, deleteDesign }) => {
  const [activeTab, setActiveTab] = useState('new');
  const [step, setStep] = useState(1);
  const [designName, setDesignName] = useState('My Greenhouse Layout');
  const [saveStatus, setSaveStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [dimensions, setDimensions] = useState({ width: 10, length: 20 });
  const [numZones, setNumZones] = useState(2);
  const [zoneGrid, setZoneGrid] = useState({ rows: 1, cols: 2 });
  const [zones, setZones] = useState([
    { id: 1, name: 'Zone A', rows: 4, cols: 6 },
    { id: 2, name: 'Zone B', rows: 4, cols: 6 },
  ]);

  const [layout, setLayout] = useState([]);
  const [draggingPlant, setDraggingPlant] = useState(null);

  useEffect(() => {
    if (numZones > zones.length) {
      const newZones = [...zones];
      for (let i = zones.length; i < numZones; i++) {
        newZones.push({
          id: Date.now() + i,
          name: `Zone ${String.fromCharCode(65 + i)}`,
          rows: 4,
          cols: 6
        });
      }
      setZones(newZones);
      if (zoneGrid.rows * zoneGrid.cols < numZones) {
        setZoneGrid({ rows: Math.ceil(Math.sqrt(numZones)), cols: Math.ceil(numZones / Math.ceil(Math.sqrt(numZones))) });
      }
    } else if (numZones < zones.length) {
      setZones(zones.slice(0, numZones));
    }
  }, [numZones]);

  const initializeLayout = () => {
    const newLayout = zones.map(zone => {
      const plants = [];
      for (let r = 0; r < zone.rows; r++) {
        for (let c = 0; c < zone.cols; c++) {
          plants.push({ id: `z${zone.id}-r${r}-c${c}`, row: r, col: c, active: true });
        }
      }
      return { ...zone, plants };
    });
    setLayout(newLayout);
    setStep(2);
  };

  const loadDesign = (design) => {
    setDesignName(design.name);
    setDimensions(design.dimensions);
    setNumZones(design.num_zones);
    setZoneGrid(design.zone_grid);
    setZones(design.zones_config);
    setLayout(design.layout_data);
    setStep(2);
  };

  const handleSave = async () => {
    if (!designName) { alert("Please enter a design name"); return; }
    setSaveStatus('saving');
    setErrorMessage('');
    try {
      const designData = { name: designName, dimensions, num_zones: numZones, zone_grid: zoneGrid, zones_config: zones, layout_data: layout };
      const { error } = await addDesign(designData);
      if (error) { setErrorMessage(error.message || 'Database error'); throw error; }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      if (!errorMessage) setErrorMessage(err.message || 'Failed to connect to database');
      setTimeout(() => { setSaveStatus(null); setErrorMessage(''); }, 5000);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this layout?")) {
      await deleteDesign(id);
    }
  };

  const updateZoneConfig = (id, field, val) => {
    setZones(zones.map(z => z.id === id ? { ...z, [field]: Math.max(1, parseInt(val) || 1) } : z));
  };

  const handleIncrement = (field, delta) => {
    setDimensions(prev => ({ ...prev, [field]: Math.max(1, prev[field] + delta) }));
  };

  const handleReset = () => { initializeLayout(); };

  const togglePlant = (zoneId, plantId) => {
    setLayout(prevLayout => prevLayout.map(zone => {
      if (zone.id === zoneId) {
        return { ...zone, plants: zone.plants.map(p => p.id === plantId ? { ...p, active: !p.active } : p) };
      }
      return zone;
    }));
  };

  const onDragStart = (e, zoneId, plantId) => {
    setDraggingPlant({ zoneId, plantId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e, targetZoneId, targetRow, targetCol) => {
    e.preventDefault();
    if (!draggingPlant) return;
    const { zoneId: sourceZoneId, plantId: sourcePlantId } = draggingPlant;
    setLayout(prevLayout => {
      const sourceZone = prevLayout.find(z => z.id === sourceZoneId);
      const sourcePlant = sourceZone.plants.find(p => p.id === sourcePlantId);
      const targetZone = prevLayout.find(z => z.id === targetZoneId);
      const isOccupied = targetZone.plants.some(p => p.row === targetRow && p.col === targetCol && p.active);
      if (isOccupied && (sourceZoneId !== targetZoneId || sourcePlant.row !== targetRow || sourcePlant.col !== targetCol)) {
        return prevLayout;
      }
      return prevLayout.map(zone => {
        if (zone.id === sourceZoneId && sourceZoneId !== targetZoneId) {
          return { ...zone, plants: zone.plants.map(p => p.id === sourcePlantId ? { ...p, active: false } : p) };
        }
        if (zone.id === targetZoneId) {
          let updatedPlants = [...zone.plants];
          if (sourceZoneId === targetZoneId) {
            updatedPlants = updatedPlants.map(p => {
              if (p.id === sourcePlantId) return { ...p, active: false };
              if (p.row === targetRow && p.col === targetCol) return { ...p, active: true };
              return p;
            });
          } else {
            updatedPlants = updatedPlants.map(p => {
              if (p.row === targetRow && p.col === targetCol) return { ...p, active: true };
              return p;
            });
          }
          return { ...zone, plants: updatedPlants };
        }
        return zone;
      });
    });
    setDraggingPlant(null);
  };

  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const totalArea = dimensions.width * dimensions.length;

  return (
    <div className="ghd-container">
      {/* ─── TOP NAV TABS ─── */}
      <div className="ghd-tab-bar">
        <button
          onClick={() => { setActiveTab('new'); setStep(1); }}
          className={`ghd-tab ${activeTab === 'new' ? 'active' : ''}`}
        >
          <div className="ghd-tab-icon"><Sparkles size={16} /></div>
          <span>New Design</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`ghd-tab ${activeTab === 'saved' ? 'active' : ''}`}
        >
          <div className="ghd-tab-icon"><Layers size={16} /></div>
          <span>Saved Layouts</span>
          {savedDesigns.length > 0 && (
            <span className="ghd-tab-badge">{savedDesigns.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'saved' ? (
        /* ═══════ SAVED LAYOUTS ═══════ */
        <div className="ghd-fade-in">
          {savedDesigns.length > 0 ? (
            <div className="ghd-saved-grid">
              {savedDesigns.map((design, idx) => {
                const zc = getZoneColor(idx);
                return (
                  <div
                    key={design.id}
                    className="ghd-saved-card"
                    onClick={() => { loadDesign(design); setActiveTab('new'); }}
                    style={{ '--card-accent': zc.accent }}
                  >
                    <div className="ghd-saved-card-glow" />
                    <div className="ghd-saved-card-header">
                      <div className="ghd-saved-card-icon" style={{ background: zc.bg, borderColor: zc.border }}>
                        <LayoutGrid size={18} color={zc.accent} />
                      </div>
                      <div className="ghd-saved-card-title">{design.name}</div>
                      <button className="ghd-delete-btn" onClick={(e) => handleDelete(e, design.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="ghd-saved-card-stats">
                      <div className="ghd-saved-stat-row">
                        <Maximize2 size={12} />
                        <span className="ghd-saved-stat-label">Footprint</span>
                        <span className="ghd-saved-stat-value">{design.dimensions.width}m × {design.dimensions.length}m</span>
                      </div>
                      <div className="ghd-saved-stat-row">
                        <Grid3x3 size={12} />
                        <span className="ghd-saved-stat-label">Zones</span>
                        <span className="ghd-saved-stat-value">{design.num_zones} ({design.zone_grid.rows}×{design.zone_grid.cols})</span>
                      </div>
                      <div className="ghd-saved-stat-row">
                        <FileText size={12} />
                        <span className="ghd-saved-stat-label">Saved</span>
                        <span className="ghd-saved-stat-value">{new Date(design.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="ghd-saved-card-action">
                      <span>Open Design</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ghd-empty-state">
              <div className="ghd-empty-icon-wrap">
                <FileText size={48} />
              </div>
              <h3>No Saved Designs</h3>
              <p>Create and save a greenhouse layout to see it here.</p>
              <button className="ghd-btn-primary ghd-btn-glow" onClick={() => setActiveTab('new')}>
                <Plus size={18} />
                <span>Start Designing</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ═══════ DESIGNER WORKSPACE ═══════ */
        <div className="ghd-fade-in">
          <StepIndicator currentStep={step} />

          {step === 1 ? (
            /* ─── STEP 1: CONFIGURATION ─── */
            <div className="ghd-config-layout">
              {/* Top stats bar */}
              <div className="ghd-stats-bar">
                <StatPill icon={Maximize2} label="Total Area" value={`${totalArea} m²`} color="#0ea5e9" />
                <StatPill icon={Grid3x3} label="Zones" value={numZones} color="#8b5cf6" />
                <StatPill icon={Layers} label="Grid" value={`${zoneGrid.rows} × ${zoneGrid.cols}`} color="#10b981" />
                <StatPill icon={Box} label="Capacity" value={`${zones.reduce((a, z) => a + z.rows * z.cols, 0)} plants`} color="#f59e0b" />
              </div>

              {/* Main config card */}
              <div className="ghd-config-card">
                <div className="ghd-config-card-shine" />
                <div className="ghd-config-sections">
                  {/* Left: Dimensions */}
                  <div className="ghd-config-section">
                    <div className="ghd-section-header">
                      <div className="ghd-section-icon" style={{ background: 'rgba(14,165,233,0.12)', borderColor: 'rgba(14,165,233,0.25)' }}>
                        <Ruler size={16} color="#0ea5e9" />
                      </div>
                      <div>
                        <div className="ghd-section-title">Greenhouse Dimensions</div>
                        <div className="ghd-section-sub">Define the physical footprint</div>
                      </div>
                    </div>
                    <div className="ghd-dim-grid">
                      <NumStepper
                        label="Width"
                        unit="m"
                        value={dimensions.width}
                        onDec={() => handleIncrement('width', -1)}
                        onInc={() => handleIncrement('width', 1)}
                        color="#0ea5e9"
                        max={50}
                      />
                      <NumStepper
                        label="Length"
                        unit="m"
                        value={dimensions.length}
                        onDec={() => handleIncrement('length', -1)}
                        onInc={() => handleIncrement('length', 1)}
                        color="#0ea5e9"
                        max={100}
                      />
                    </div>
                    {/* Mini visual preview */}
                    <div className="ghd-dim-preview">
                      <div
                        className="ghd-dim-preview-box"
                        style={{
                          aspectRatio: `${dimensions.width} / ${Math.min(dimensions.length, dimensions.width * 2)}`,
                        }}
                      >
                        <span>{dimensions.width}m × {dimensions.length}m</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="ghd-config-divider" />

                  {/* Right: Zone Grid */}
                  <div className="ghd-config-section">
                    <div className="ghd-section-header">
                      <div className="ghd-section-icon" style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.25)' }}>
                        <Grid3x3 size={16} color="#8b5cf6" />
                      </div>
                      <div>
                        <div className="ghd-section-title">Zone Arrangement</div>
                        <div className="ghd-section-sub">Configure zone grid layout</div>
                      </div>
                    </div>
                    <div className="ghd-dim-grid ghd-dim-grid-3">
                      <NumStepper
                        label="Total Zones"
                        value={numZones}
                        onDec={() => setNumZones(prev => Math.max(1, prev - 1))}
                        onInc={() => setNumZones(prev => Math.min(12, prev + 1))}
                        color="#8b5cf6"
                        max={12}
                      />
                      <NumStepper
                        label="Grid Rows"
                        value={zoneGrid.rows}
                        onDec={() => setZoneGrid(prev => ({ ...prev, rows: Math.max(1, prev.rows - 1) }))}
                        onInc={() => setZoneGrid(prev => ({ ...prev, rows: Math.min(6, prev.rows + 1) }))}
                        color="#8b5cf6"
                        max={6}
                      />
                      <NumStepper
                        label="Grid Cols"
                        value={zoneGrid.cols}
                        onDec={() => setZoneGrid(prev => ({ ...prev, cols: Math.max(1, prev.cols - 1) }))}
                        onInc={() => setZoneGrid(prev => ({ ...prev, cols: Math.min(6, prev.cols + 1) }))}
                        color="#8b5cf6"
                        max={6}
                      />
                    </div>
                    {zoneGrid.rows * zoneGrid.cols < numZones && (
                      <div className="ghd-warning">
                        ⚠️ Grid ({zoneGrid.rows}×{zoneGrid.cols} = {zoneGrid.rows * zoneGrid.cols} slots) is too small for {numZones} zones!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zone configuration cards */}
              <div className="ghd-zone-config-header">
                <div className="ghd-section-header">
                  <div className="ghd-section-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.25)' }}>
                    <Sprout size={16} color="#10b981" />
                  </div>
                  <div>
                    <div className="ghd-section-title">Zone Configuration</div>
                    <div className="ghd-section-sub">Set rows and columns for each zone</div>
                  </div>
                </div>
              </div>

              <div className="ghd-zone-cards-grid">
                {zones.map((zone, idx) => {
                  const zc = getZoneColor(idx);
                  return (
                    <div key={zone.id} className="ghd-zone-card" style={{ '--zone-accent': zc.accent, '--zone-glow': zc.glow, '--zone-bg': zc.bg, '--zone-border': zc.border }}>
                      <div className="ghd-zone-card-accent" />
                      <div className="ghd-zone-card-header">
                        <div className="ghd-zone-card-name">
                          <Leaf size={14} color={zc.accent} />
                          <span>{zone.name}</span>
                        </div>
                        <span className="ghd-zone-card-badge" style={{ background: zc.bg, color: zc.accent, borderColor: zc.border }}>
                          {zone.rows * zone.cols} plants
                        </span>
                      </div>
                      <div className="ghd-zone-card-inputs">
                        <div className="ghd-zone-input-group">
                          <label>Rows</label>
                          <input
                            type="number"
                            value={zone.rows}
                            onChange={(e) => updateZoneConfig(zone.id, 'rows', e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="ghd-zone-input-group">
                          <label>Columns</label>
                          <input
                            type="number"
                            value={zone.cols}
                            onChange={(e) => updateZoneConfig(zone.id, 'cols', e.target.value)}
                            min="1"
                          />
                        </div>
                      </div>
                      {/* Mini grid preview */}
                      <div className="ghd-zone-mini-grid">
                        {Array.from({ length: Math.min(zone.rows, 4) }).map((_, r) => (
                          <div key={r} className="ghd-zone-mini-row">
                            {Array.from({ length: Math.min(zone.cols, 6) }).map((_, c) => (
                              <div key={c} className="ghd-zone-mini-cell" style={{ background: zc.bg, borderColor: zc.border }} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create button */}
              <div className="ghd-create-btn-wrap">
                <button className="ghd-btn-primary ghd-btn-glow ghd-btn-large" onClick={initializeLayout}>
                  <Eye size={20} />
                  <span>Preview Design</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* ─── STEP 2: LAYOUT PREVIEW ─── */
            <div className="ghd-preview-layout">
              {/* Toolbar */}
              <div className="ghd-toolbar">
                <div className="ghd-toolbar-left">
                  <button className="ghd-toolbar-btn" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <div className="ghd-name-input-wrap">
                    <FileText size={15} color="var(--primary)" />
                    <input
                      type="text"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      placeholder="Design Name..."
                      className="ghd-name-input"
                    />
                  </div>
                </div>
                <div className="ghd-toolbar-right">
                  {errorMessage && (
                    <div className="ghd-error-chip">⚠️ {errorMessage}</div>
                  )}
                  <button className="ghd-toolbar-btn" onClick={handleReset}>
                    <RotateCcw size={15} />
                    <span>Reset</span>
                  </button>
                  <button
                    className={`ghd-save-btn ${saveStatus === 'error' ? 'error' : saveStatus === 'success' ? 'success' : ''}`}
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                  >
                    {saveStatus === 'saving' ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        {saveStatus === 'success' ? <CheckCircle2 size={16} /> :
                         saveStatus === 'error' ? <XCircle size={16} /> :
                         <Save size={16} />}
                        <span>{saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Layout'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Floor plan */}
              <div className="ghd-floorplan-card">
                <div className="ghd-floorplan-header">
                  <div className="ghd-floorplan-title">
                    <Move size={16} />
                    <span>Greenhouse Floor Plan</span>
                    <span className="ghd-floorplan-dims">{dimensions.width}m × {dimensions.length}m</span>
                  </div>
                  <div className="ghd-floorplan-legend">
                    <div className="ghd-legend-item">
                      <div className="ghd-legend-swatch" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)' }} />
                      <span>Zone Area</span>
                    </div>
                    <div className="ghd-legend-item">
                      <Leaf size={12} color="var(--accent-green)" />
                      <span>Plant</span>
                    </div>
                  </div>
                </div>

                <div className="ghd-floorplan-body">
                  <div
                    className="ghd-greenhouse-structure"
                    style={{
                      aspectRatio: `${dimensions.width} / ${dimensions.length}`,
                      gridTemplateColumns: `repeat(${zoneGrid.cols}, 1fr)`,
                      gridTemplateRows: `repeat(${zoneGrid.rows}, 1fr)`,
                    }}
                  >
                    {layout.map((zone, idx) => {
                      const zc = getZoneColor(idx);
                      return (
                        <div key={zone.id} className="ghd-zone-area" style={{ '--zone-accent': zc.accent, '--zone-bg': zc.bg, '--zone-border': zc.border }}>
                          <div className="ghd-zone-label-badge" style={{ background: zc.accent }}>
                            {zone.name}
                          </div>
                          <div
                            className="ghd-plant-grid"
                            style={{
                              gridTemplateColumns: `repeat(${zone.cols}, 1fr)`,
                              gridTemplateRows: `repeat(${zone.rows}, 1fr)`,
                            }}
                          >
                            {zone.plants.map((plant) => (
                              <div
                                key={plant.id}
                                className={`ghd-plant-slot ${plant.active ? 'has-plant' : ''}`}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, zone.id, plant.row, plant.col)}
                                onClick={() => togglePlant(zone.id, plant.id)}
                                style={{ '--zone-accent': zc.accent }}
                              >
                                {plant.active && (
                                  <div
                                    className="ghd-plant-icon"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, zone.id, plant.id)}
                                    style={{ '--plant-color': zc.accent }}
                                  >
                                    <Leaf size={16} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Plant summary */}
              <div className="ghd-summary-bar">
                {layout.map((zone, idx) => {
                  const zc = getZoneColor(idx);
                  const activeCount = zone.plants.filter(p => p.active).length;
                  return (
                    <div key={zone.id} className="ghd-summary-chip" style={{ '--chip-color': zc.accent }}>
                      <Leaf size={14} color={zc.accent} />
                      <span className="ghd-summary-chip-name">{zone.name}</span>
                      <span className="ghd-summary-chip-count">{activeCount}</span>
                    </div>
                  );
                })}
                <div className="ghd-summary-total">
                  <Sprout size={16} />
                  <span>Total</span>
                  <span className="ghd-summary-total-count">
                    {layout.reduce((acc, z) => acc + z.plants.filter(p => p.active).length, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PREMIUM STYLES ═══════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Container ─── */
        .ghd-container {
          padding-bottom: 40px;
          position: relative;
        }

        /* ─── Fade-in animation ─── */
        .ghd-fade-in {
          position: relative;
          z-index: 1;
          animation: ghdFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ghdFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── Tab Bar ─── */
        .ghd-tab-bar {
          display: flex;
          gap: 4px;
          padding: 6px;
          background: var(--v4-panel-bg);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          width: fit-content;
          margin-bottom: 28px;
          backdrop-filter: blur(16px);
          box-shadow: 0 18px 50px rgba(0,0,0,0.28);
        }
        .ghd-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: var(--brand-sans);
          position: relative;
          overflow: hidden;
        }
        .ghd-tab::before {
          content: '';
          position: absolute;
          inset: 0;
          background: transparent;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 12px;
        }
        .ghd-tab:hover { color: var(--text-primary); }
        .ghd-tab:hover::before { opacity: 0.5; }
        .ghd-tab.active {
          background: var(--v4-card-bg);
          color: var(--text-primary);
          border-color: rgba(14,165,233,0.3);
          box-shadow: 0 0 20px rgba(14,165,233,0.18), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .ghd-tab.active::before { opacity: 1; }
        .ghd-tab-icon {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .ghd-tab > span { position: relative; z-index: 1; }
        .ghd-tab-badge {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        /* ─── Light Mode Overrides for Greenhouse Designer ─── */
        [data-theme="light"] .ghd-tab-bar {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
        }
        [data-theme="light"] .ghd-tab {
          color: #475569;
        }
        [data-theme="light"] .ghd-tab:hover {
          color: #0f172a;
        }
        [data-theme="light"] .ghd-tab.active {
          background: #ffffff !important;
          color: #1d4ed8 !important;
          border: 1px solid #93c5fd !important;
          box-shadow: 0 2px 10px rgba(29, 78, 216, 0.12) !important;
        }
        [data-theme="light"] .ghd-tab.active .ghd-tab-icon {
          color: #1d4ed8 !important;
        }
        [data-theme="light"] .ghd-config-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .ghd-config-divider {
          background: #e2e8f0 !important;
        }
        [data-theme="light"] .ghd-stat-pill {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
        }
        [data-theme="light"] .ghd-stat-pill-label {
          color: #64748b !important;
        }
        [data-theme="light"] .ghd-stat-pill-value {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-zone-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .ghd-zone-card-name {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-zone-input-group input {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-stepper-btn {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
        }
        [data-theme="light"] .ghd-stepper-value {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }
        [data-theme="light"] .ghd-stepper-num {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-dim-preview-box {
          background: #eff6ff !important;
          border-color: #93c5fd !important;
        }
        [data-theme="light"] .ghd-dim-preview-box span {
          color: #0284c7 !important;
        }
        [data-theme="light"] .ghd-step-dot-inner {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #64748b !important;
        }
        [data-theme="light"] .ghd-step-dot.active .ghd-step-dot-inner {
          background: #eff6ff !important;
          border-color: #0284c7 !important;
          color: #0284c7 !important;
        }
        [data-theme="light"] .ghd-step-line {
          background: #e2e8f0 !important;
        }
        [data-theme="light"] .ghd-toolbar-btn {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        [data-theme="light"] .ghd-toolbar-btn:hover {
          background: #f1f5f9 !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-name-input-wrap {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
        }
        [data-theme="light"] .ghd-name-input {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-floorplan-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .ghd-floorplan-header {
          border-bottom: 1px solid #f1f5f9 !important;
        }
        [data-theme="light"] .ghd-floorplan-title {
          color: #334155 !important;
        }
        [data-theme="light"] .ghd-greenhouse-structure {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
        }
        [data-theme="light"] .ghd-summary-bar {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .ghd-summary-chip-name {
          color: #475569 !important;
        }
        [data-theme="light"] .ghd-summary-chip-count {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-summary-total-count {
          color: #0f172a !important;
        }
        [data-theme="light"] .ghd-saved-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05) !important;
        }
        [data-theme="light"] .ghd-saved-card-title {
          color: #0f172a !important;
        }

        /* ─── Step Indicator ─── */
        .ghd-step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 28px;
        }
        .ghd-step-dot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .ghd-step-dot-inner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.08);
          background: rgba(15,23,42,0.8);
          color: var(--text-dim);
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ghd-step-dot.active .ghd-step-dot-inner {
          border-color: #0ea5e9;
          background: linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.08));
          color: #0ea5e9;
          box-shadow: 0 0 20px rgba(14,165,233,0.3), 0 0 40px rgba(14,165,233,0.1);
        }
        .ghd-step-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: color 0.3s;
        }
        .ghd-step-dot.active .ghd-step-label {
          color: #0ea5e9;
        }
        .ghd-step-line {
          width: 80px;
          height: 2px;
          background: rgba(255,255,255,0.06);
          margin: 0 12px;
          margin-bottom: 22px;
          border-radius: 1px;
          position: relative;
          overflow: hidden;
        }
        .ghd-step-line::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #0ea5e9;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ghd-step-line.active::after {
          transform: scaleX(1);
        }

        /* ─── Stats Bar ─── */
        .ghd-stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .ghd-stat-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: var(--v4-card-bg);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 10px 26px rgba(0,0,0,0.18);
          position: relative;
          overflow: hidden;
        }
        .ghd-stat-pill::before {
          content: none;
        }
        .ghd-stat-pill:hover {
          border-color: color-mix(in srgb, var(--pill-color) 30%, transparent);
          transform: translateY(-3px);
          box-shadow: 0 16px 34px rgba(0,0,0,0.28);
        }
        .ghd-stat-pill-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--pill-color) 12%, transparent);
          color: var(--pill-color);
          flex-shrink: 0;
        }
        .ghd-stat-pill-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ghd-stat-pill-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .ghd-stat-pill-value {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        /* ─── Config Card ─── */
        .ghd-config-card {
          background: var(--v4-panel-bg);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 26px 70px rgba(0,0,0,0.38);
          margin-bottom: 28px;
        }
        .ghd-config-card-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(14,165,233,0.4), rgba(139,92,246,0.3), transparent);
        }
        .ghd-config-sections {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
        }
        .ghd-config-divider {
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 0 28px;
        }
        .ghd-config-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ─── Section Headers ─── */
        .ghd-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ghd-section-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }
        .ghd-section-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .ghd-section-sub {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 2px;
        }

        /* ─── Dimension Grid ─── */
        .ghd-dim-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .ghd-dim-grid-3 {
          grid-template-columns: 1fr 1fr 1fr;
        }

        /* ─── NumStepper ─── */
        .ghd-num-stepper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ghd-num-stepper-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .ghd-num-stepper-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ghd-stepper-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          font-family: var(--brand-sans);
        }
        .ghd-stepper-btn:hover:not(:disabled) {
          background: rgba(14,165,233,0.1);
          border-color: rgba(14,165,233,0.3);
          color: #0ea5e9;
        }
        .ghd-stepper-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .ghd-stepper-value {
          flex: 1;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 4px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .ghd-stepper-num {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          font-family: var(--brand-sans);
        }
        .ghd-stepper-unit {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-dim);
        }

        /* ─── Dimension preview ─── */
        .ghd-dim-preview {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }
        .ghd-dim-preview-box {
          max-width: 120px;
          width: 100%;
          border: 2px dashed rgba(14,165,233,0.28);
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(14,165,233,0.08), rgba(14,165,233,0.03));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          transition: all 0.3s;
        }
        .ghd-dim-preview-box span {
          font-size: 12px;
          font-weight: 800;
          color: #7dd3fc;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        /* ─── Warning ─── */
        .ghd-warning {
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 12px;
          font-weight: 700;
          color: #f87171;
        }

        /* ─── Zone Config Header ─── */
        .ghd-zone-config-header {
          margin-bottom: 16px;
        }

        /* ─── Zone Cards Grid ─── */
        .ghd-zone-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .ghd-zone-card {
          background: var(--v4-card-bg);
          border: 1px solid color-mix(in srgb, var(--zone-border) 90%, rgba(255,255,255,0.04));
          border-radius: 18px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }
        .ghd-zone-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 42px rgba(0,0,0,0.42), 0 0 0 1px var(--zone-border);
        }
        .ghd-zone-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--zone-accent), transparent);
          opacity: 0.8;
        }
        .ghd-zone-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .ghd-zone-card-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .ghd-zone-card-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid;
        }
        .ghd-zone-card-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .ghd-zone-input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ghd-zone-input-group label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .ghd-zone-input-group input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.3);
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 800;
          text-align: center;
          outline: none;
          transition: all 0.2s;
          font-family: var(--brand-sans);
          -moz-appearance: textfield;
        }
        .ghd-zone-input-group input::-webkit-inner-spin-button,
        .ghd-zone-input-group input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .ghd-zone-input-group input:focus {
          border-color: var(--zone-accent);
          box-shadow: 0 0 0 3px var(--zone-glow);
        }

        /* ─── Zone Mini Grid ─── */
        .ghd-zone-mini-grid {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
        }
        .ghd-zone-mini-row {
          display: flex;
          gap: 3px;
        }
        .ghd-zone-mini-cell {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          border: 1px solid;
          transition: all 0.2s;
        }

        /* ─── Create Button ─── */
        .ghd-create-btn-wrap {
          display: flex;
          justify-content: center;
          margin-top: 8px;
        }
        .ghd-btn-primary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 28px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: var(--brand-sans);
          position: relative;
          overflow: hidden;
        }
        .ghd-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .ghd-btn-primary:hover {
          transform: translateY(-2px);
        }
        .ghd-btn-primary:hover::before { opacity: 1; }
        .ghd-btn-glow {
          box-shadow: 0 4px 20px rgba(14,165,233,0.3), 0 0 40px rgba(99,102,241,0.15);
        }
        .ghd-btn-large {
          padding: 16px 40px;
          font-size: 16px;
          border-radius: 16px;
        }

        /* ═══════ PREVIEW STEP STYLES ═══════ */

        /* ─── Toolbar ─── */
        .ghd-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ghd-toolbar-left, .ghd-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ghd-toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.22s;
          font-family: var(--brand-sans);
        }
        .ghd-toolbar-btn:hover {
          background: rgba(14,165,233,0.12);
          border-color: rgba(14,165,233,0.28);
          color: #0ea5e9;
          transform: translateY(-1px);
        }
        .ghd-name-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 12px;
          background: rgba(0,0,0,0.34);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ghd-name-input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-weight: 800;
          font-size: 14px;
          outline: none;
          width: 220px;
          font-family: var(--brand-sans);
        }
        .ghd-name-input::placeholder {
          color: var(--text-dim);
        }
        .ghd-error-chip {
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 11px;
          font-weight: 700;
          color: #f87171;
        }
        .ghd-save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          font-family: var(--brand-sans);
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .ghd-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(16,185,129,0.4);
        }
        .ghd-save-btn.success {
          background: linear-gradient(135deg, #10b981, #34d399);
        }
        .ghd-save-btn.error {
          background: linear-gradient(135deg, #ef4444, #f87171);
          box-shadow: 0 4px 16px rgba(239,68,68,0.3);
        }

        /* ─── Floor Plan Card ─── */
        .ghd-floorplan-card {
          background: var(--v4-panel-bg);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 28px 72px rgba(0,0,0,0.42);
          position: relative;
        }
        .ghd-floorplan-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(14,165,233,0.3), rgba(139,92,246,0.2), transparent);
        }
        .ghd-floorplan-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .ghd-floorplan-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary);
        }
        .ghd-floorplan-dims {
          padding: 3px 10px;
          border-radius: 8px;
          background: rgba(14,165,233,0.1);
          border: 1px solid rgba(14,165,233,0.2);
          color: #0ea5e9;
          font-size: 11px;
          letter-spacing: 0;
          text-transform: none;
        }
        .ghd-floorplan-legend {
          display: flex;
          gap: 16px;
        }
        .ghd-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .ghd-legend-swatch {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        /* ─── Floor Plan Body ─── */
        .ghd-floorplan-body {
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 520px;
          background: radial-gradient(circle at 50% 50%, rgba(14,165,233,0.03), transparent 60%);
        }
        .ghd-greenhouse-structure {
          width: 100%;
          max-width: 900px;
          max-height: 65vh;
          border: 3px solid rgba(30,41,59,0.84);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(2,6,23,0.95), rgba(5,10,30,0.98));
          display: grid;
          gap: 3px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 20px 60px rgba(0,0,0,0.5),
            inset 0 0 120px rgba(14,165,233,0.03);
        }

        /* ─── Zone Area ─── */
        .ghd-zone-area {
          position: relative;
          background: var(--zone-bg);
          border: 1px dashed var(--zone-border);
          display: flex;
          flex-direction: column;
          transition: background 0.3s;
        }
        .ghd-zone-area:hover {
          background: color-mix(in srgb, var(--zone-bg) 100%, rgba(255,255,255,0.02));
        }
        .ghd-zone-label-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 9px;
          font-weight: 800;
          color: #fff;
          padding: 3px 9px;
          border-radius: 8px;
          z-index: 10;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ─── Plant Grid ─── */
        .ghd-plant-grid {
          flex: 1;
          display: grid;
          gap: 3px;
          padding: 30px 10px 10px 10px;
        }
        .ghd-plant-slot {
          border-radius: 4px;
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 24px;
        }
        .ghd-plant-slot:hover {
          background: color-mix(in srgb, var(--zone-accent) 8%, transparent);
          border-color: color-mix(in srgb, var(--zone-accent) 25%, transparent);
        }
        .ghd-plant-slot.has-plant {
          background: color-mix(in srgb, var(--zone-accent) 5%, transparent);
        }
        .ghd-plant-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          color: var(--plant-color);
          filter: drop-shadow(0 0 4px color-mix(in srgb, var(--plant-color) 40%, transparent));
          transition: all 0.2s;
        }
        .ghd-plant-icon:hover {
          transform: scale(1.15);
          filter: drop-shadow(0 0 8px color-mix(in srgb, var(--plant-color) 60%, transparent));
        }

        /* ─── Summary Bar ─── */
        .ghd-summary-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 20px;
          padding: 16px 18px;
          border-radius: 16px;
          background: var(--v4-card-bg);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ghd-summary-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--chip-color) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--chip-color) 20%, transparent);
          transition: all 0.2s;
        }
        .ghd-summary-chip:hover {
          border-color: color-mix(in srgb, var(--chip-color) 40%, transparent);
          transform: translateY(-1px);
        }
        .ghd-summary-chip-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .ghd-summary-chip-count {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .ghd-summary-total {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06));
          border: 1px solid rgba(16,185,129,0.25);
          margin-left: auto;
          color: #10b981;
          font-size: 13px;
          font-weight: 800;
        }
        .ghd-summary-total-count {
          font-size: 20px;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.03em;
        }

        /* ═══════ SAVED LAYOUTS ═══════ */
        .ghd-saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 18px;
        }
        .ghd-saved-card {
          background: var(--v4-card-bg);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 22px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
        }
        .ghd-saved-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--card-accent), transparent);
          opacity: 0.6;
        }
        .ghd-saved-card:hover {
          border-color: color-mix(in srgb, var(--card-accent) 40%, transparent);
          transform: translateY(-5px);
          box-shadow: 0 20px 44px rgba(0,0,0,0.42), 0 0 20px color-mix(in srgb, var(--card-accent) 12%, transparent);
        }
        .ghd-saved-card-glow {
          position: absolute;
          top: -50%;
          right: -20%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, color-mix(in srgb, var(--card-accent) 6%, transparent), transparent 70%);
          pointer-events: none;
        }
        .ghd-saved-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          position: relative;
        }
        .ghd-saved-card-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }
        .ghd-saved-card-title {
          flex: 1;
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .ghd-delete-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.15);
          background: rgba(239,68,68,0.06);
          color: rgba(248,113,113,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ghd-delete-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }
        .ghd-saved-card-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          border-radius: 10px;
          background: rgba(0,0,0,0.25);
          margin-bottom: 16px;
          position: relative;
        }
        .ghd-saved-stat-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .ghd-saved-stat-label {
          flex: 1;
        }
        .ghd-saved-stat-value {
          font-weight: 700;
          color: var(--text-secondary);
        }
        .ghd-saved-card-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid color-mix(in srgb, var(--card-accent) 20%, transparent);
          background: color-mix(in srgb, var(--card-accent) 5%, transparent);
          color: var(--card-accent);
          font-size: 12px;
          font-weight: 700;
          transition: all 0.2s;
          position: relative;
        }
        .ghd-saved-card:hover .ghd-saved-card-action {
          background: color-mix(in srgb, var(--card-accent) 12%, transparent);
          border-color: color-mix(in srgb, var(--card-accent) 35%, transparent);
        }

        /* ─── Empty State ─── */
        .ghd-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .ghd-empty-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(14,165,233,0.06);
          border: 1px solid rgba(14,165,233,0.15);
          color: rgba(14,165,233,0.3);
          margin-bottom: 20px;
        }
        .ghd-empty-state h3 {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .ghd-empty-state p {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .ghd-config-sections {
            grid-template-columns: 1fr;
          }
          .ghd-config-divider {
            width: 100%;
            height: 1px;
            margin: 20px 0;
          }
          .ghd-stats-bar {
            grid-template-columns: 1fr 1fr;
          }
          .ghd-dim-grid-3 {
            grid-template-columns: 1fr;
          }
          .ghd-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .ghd-toolbar-left, .ghd-toolbar-right {
            justify-content: center;
            flex-wrap: wrap;
          }
          .ghd-saved-grid {
            grid-template-columns: 1fr;
          }
          .ghd-zone-cards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      ` }} />
    </div>
  );
};

export default GreenhouseDesigner;
