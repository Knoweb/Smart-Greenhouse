import React, { useState } from 'react';
import { Beaker, Database, CalendarClock, LayoutDashboard, Zap, Activity, Droplets } from 'lucide-react';
import { useFertilizerSystem } from '../hooks/useFertilizerSystem';

import FertilizerDashboard from './Fertilizer/FertilizerDashboard';
import FertilizerInventory from './Fertilizer/FertilizerInventory';
import FertilizerRecipes from './Fertilizer/FertilizerRecipes';
import FertilizerSchedule from './Fertilizer/FertilizerSchedule';
import FertilizerLogs from './Fertilizer/FertilizerLogs';
import FertilizerTankManagement from './Fertilizer/FertilizerTankManagement';

const FertilizerManager = ({ actuators = [], nodes = [], user }) => {
  const systemState = useFertilizerSystem(user);
  const [activeTab, setActiveTab] = useState('dashboard');

  const TABS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Database },
    { id: 'recipes', label: 'Recipe Builder', icon: Beaker },
    { id: 'schedule', label: 'Scheduler', icon: CalendarClock },
    { id: 'tanks', label: 'Tank Management', icon: Droplets },
    { id: 'logs', label: 'Analytics', icon: Activity },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sleek Sub-navigation capsule bar matching the Pump Control layout */}
      <div style={{ 
        padding: '8px 0px', 
        display: 'flex', 
        alignItems: 'center',
        gap: 12, 
        overflowX: 'auto',
        marginBottom: '10px'
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '10px 22px', 
                borderRadius: 50,
                border: isActive ? '1px solid var(--primary)' : '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--primary)',
                boxShadow: isActive ? '0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)' : 'none',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}
              className="premium-tab-btn"
            >
              <tab.icon size={15} style={{ opacity: isActive ? 1 : 0.6 }} /> 
              {tab.label}
            </button>
          );
        })}
        
        {/* Hardware Status Indicator (Floating right) */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: systemState.systemStatus === 'MIXING' ? '#f59e0b' : '#10b981',
            boxShadow: `0 0 10px ${systemState.systemStatus === 'MIXING' ? '#f59e0b' : '#10b981'}`,
            animation: systemState.systemStatus === 'MIXING' ? 'pulse 1s infinite' : 'none'
          }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {systemState.systemStatus === 'MIXING' ? 'ESP32 MIXING' : 'NODE ACTIVE'}
          </span>
        </div>
      </div>

      {/* Content Rendering */}
      {activeTab === 'dashboard' && <FertilizerDashboard {...systemState} actuators={actuators} />}
      {activeTab === 'tanks' && <FertilizerTankManagement />}
      {activeTab === 'inventory' && <FertilizerInventory {...systemState} nodes={nodes} />}
      {activeTab === 'recipes' && <FertilizerRecipes {...systemState} />}
      {activeTab === 'schedule' && <FertilizerSchedule {...systemState} actuators={actuators} />}
      {activeTab === 'logs' && <FertilizerLogs {...systemState} />}
    </div>
  );
};

export default FertilizerManager;
