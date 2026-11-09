import React, { useState } from 'react';
import { LayoutDashboard, Beaker, CalendarClock } from 'lucide-react';

import LightingDashboard from './Lighting/LightingDashboard';
import LightingProfiles  from './Lighting/LightingProfiles';
import LightingScheduler from './Lighting/LightingScheduler';

const LightingControl = (props) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const TABS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'profiles',  label: 'Profiles',  icon: Beaker },
    { id: 'schedule',  label: 'Scheduler', icon: CalendarClock },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-navigation */}
      <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', gap: 10, overflowX: 'auto', alignItems: 'center' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}

        {/* Quick Status */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '0 10px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>IOT ACTIVE</span>
             </div>
        </div>
      </div>

      {/* Content Rendering */}
      <div className="lighting-content-area">
        {activeTab === 'dashboard' && <LightingDashboard {...props} />}
        {activeTab === 'profiles'  && <LightingProfiles  {...props} />}
        {activeTab === 'schedule'  && <LightingScheduler {...props} />}
      </div>
    </div>
  );
};
export default LightingControl;
