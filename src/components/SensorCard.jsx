import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Sensor Card v4 — Premium High-Fidelity Match
 * Features: Absolute Trend, Icon Box, Large Value, Colored Prefix
 */
const SensorCard = ({ 
  label, 
  prefix,
  value, 
  unit, 
  icon: Icon, 
  color, 
  trendValue,
  trendUp = true,
  valueStyle 
}) => {
  const safeValue = value ?? 0;
  const valueText = typeof safeValue === 'number' && Number.isFinite(safeValue)
    ? safeValue.toLocaleString(undefined, {
        maximumFractionDigits: Number.isInteger(safeValue) ? 0 : 1,
      })
    : safeValue;

  return (
    <div className="sensor-card-v4">
      <div className="sensor-card-v4-content">
        <div className="sensor-card-v4-icon-box" style={{ color }}>
          <Icon size={26} />
        </div>
        
        <div className="sensor-card-v4-meta">
          <div className="sensor-card-v4-labels">
            {prefix && <span className="sensor-card-v4-prefix" style={{ color }}>{prefix}</span>}
            <span className="sensor-card-v4-label">{label}</span>
          </div>
          <div className="sensor-card-v4-value-row">
            <span className="sensor-card-v4-value" style={valueStyle}>{valueText}</span>
            <span className="sensor-card-v4-unit">{unit}</span>
          </div>
        </div>

        {trendValue && (
          <div className={`sensor-card-v4-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorCard;
