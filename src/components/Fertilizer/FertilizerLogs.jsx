import React, { useState, useMemo } from 'react';
import { Activity, Clock, Droplets, X, Download, BarChart2, PieChart as PieIcon, Beaker, Leaf, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

const FertilizerLogs = ({ logs }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      let valid = true;
      const logTime = new Date(log.timestamp).getTime();
      if (startDate) {
        if (logTime < new Date(startDate).getTime()) valid = false;
      }
      if (endDate) {
        if (logTime > new Date(endDate).getTime()) valid = false;
      }
      return valid;
    });
  }, [logs, startDate, endDate]);

  const stats = useMemo(() => {
    if (filteredLogs.length === 0) return { totalInjections: 0, topRecipe: 'N/A', totalIngredients: 0, uniqueRecipes: 0, chartData: [], areaData: [] };

    const recipeCounts = {};
    let ingredientCount = 0;
    const injectionsByDate = {};
    
    filteredLogs.forEach(log => {
      // Bar Chart Data
      recipeCounts[log.recipeName] = (recipeCounts[log.recipeName] || 0) + 1;
      ingredientCount += log.ingredients.length;

      // Area Chart Data
      const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      injectionsByDate[dateStr] = (injectionsByDate[dateStr] || 0) + 1;
    });

    const chartData = Object.entries(recipeCounts).map(([name, value]) => ({ name, value }));
    const topRecipe = Object.entries(recipeCounts).sort((a, b) => b[1] - a[1])[0][0];
    const uniqueRecipes = Object.keys(recipeCounts).length;
    
    const areaData = Object.entries(injectionsByDate).map(([date, count]) => ({ date, count })).slice(-7);

    return {
      totalInjections: filteredLogs.length,
      topRecipe,
      totalIngredients: ingredientCount,
      uniqueRecipes,
      chartData,
      areaData
    };
  }, [filteredLogs]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    
    let csvContent = "Date,Time,Recipe Name,Ingredients\n";

    filteredLogs.forEach(log => {
      const dateObj = new Date(log.timestamp);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const ingredientsStr = log.ingredients.map(ing => `${ing.name}: ${ing.amount} ${ing.unit}`).join(" | ");
      
      csvContent += `${dateStr},${timeStr},"${log.recipeName}","${ingredientsStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fertilizer_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* HEADER SECTION matching screenshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--v4-text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Data Analytics & Reporting
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--v4-text-secondary)', margin: 0 }}>
            Historical data analysis and performance insights
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: 'var(--v4-mode-bg)', border: '1px solid rgba(255,255,255,0.08)', 
            padding: '4px 12px', borderRadius: 8 
          }}>
            <span style={{ fontSize: 12, color: 'var(--v4-text-secondary)' }}>Filter:</span>
            <input 
              type="date" 
              style={{ background: 'transparent', border: 'none', color: 'var(--v4-text-primary)', fontSize: 13, outline: 'none' }} 
              value={startDate.split('T')[0]} 
              onChange={e => setStartDate(e.target.value ? `${e.target.value}T00:00` : '')} 
            />
            <span style={{ color: '#475569' }}>-</span>
            <input 
              type="date" 
              style={{ background: 'transparent', border: 'none', color: 'var(--v4-text-primary)', fontSize: 13, outline: 'none' }} 
              value={endDate.split('T')[0]} 
              onChange={e => setEndDate(e.target.value ? `${e.target.value}T23:59` : '')} 
            />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            style={{ 
              background: '#0ea5e9', color: 'var(--v4-text-primary)', border: 'none', 
              padding: '10px 18px', borderRadius: 8, fontWeight: 700, 
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              opacity: filteredLogs.length === 0 ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}
          >
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      {/* 4 STAT CARDS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        
        {/* Card 1 */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Droplets size={18} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v4-text-primary)', marginBottom: 4 }}>{stats.totalInjections}</div>
          <div style={{ fontSize: 13, color: 'var(--v4-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Total Injections</div>
          <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Consistent usage</div>
        </div>

        {/* Card 2 */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <TrendingUp size={18} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v4-text-primary)', marginBottom: 4 }}>{stats.topRecipe}</div>
          <div style={{ fontSize: 13, color: 'var(--v4-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Top Recipe</div>
          <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Most frequently mixed</div>
        </div>

        {/* Card 3 */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Leaf size={18} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v4-text-primary)', marginBottom: 4 }}>{stats.totalIngredients}</div>
          <div style={{ fontSize: 13, color: 'var(--v4-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Ingredients Dispensed</div>
          <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Across all logs</div>
        </div>

        {/* Card 4 */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <BarChart2 size={18} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v4-text-primary)', marginBottom: 4 }}>{stats.uniqueRecipes}</div>
          <div style={{ fontSize: 13, color: 'var(--v4-text-secondary)', fontWeight: 600, marginBottom: 8 }}>Unique Recipes Used</div>
          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Active formulas</div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* Left Chart: Bar Chart */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
          <h3 style={{ color: 'var(--v4-text-primary)', fontSize: 18, margin: '0 0 4px 0' }}>Recipe Frequency</h3>
          <p style={{ color: 'var(--v4-text-secondary)', fontSize: 13, margin: '0 0 24px 0' }}>Total mixes grouped by recipe</p>
          <div style={{ height: 260, width: '100%' }}>
            {filteredLogs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: 'var(--v4-card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--v4-text-primary)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v4-text-muted)' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Right Chart: Area Chart */}
        <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
          <h3 style={{ color: 'var(--v4-text-primary)', fontSize: 18, margin: '0 0 4px 0' }}>Timeline</h3>
          <p style={{ color: 'var(--v4-text-secondary)', fontSize: 13, margin: '0 0 24px 0' }}>Daily fertilizer injection frequency</p>
          <div style={{ height: 260, width: '100%' }}>
            {filteredLogs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInjections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--v4-card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--v4-text-primary)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorInjections)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v4-text-muted)' }}>No data available</div>
            )}
          </div>
        </div>

      </div>

      {/* DATA TABLE (Environmental Data Log style) */}
      <div style={{ background: 'var(--v4-panel-bg)', borderRadius: 12, border: '1px solid var(--v4-border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '24px 24px 20px 24px', borderBottom: '1px solid var(--v4-border)' }}>
          <h3 style={{ color: 'var(--v4-text-primary)', fontSize: 18, margin: '0 0 4px 0' }}>Detailed Injection Log</h3>
          <p style={{ color: 'var(--v4-text-secondary)', fontSize: 13, margin: 0 }}>Chronological record of all fertilizer mixing tasks</p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700, background: 'var(--v4-mode-bg)' }}>Date</th>
                <th style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700, background: 'var(--v4-mode-bg)' }}>Time</th>
                <th style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700, background: 'var(--v4-mode-bg)' }}>Recipe</th>
                <th style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700, background: 'var(--v4-mode-bg)' }}>Ingredients Dispensed</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--v4-text-muted)' }}>
                    No injection logs match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const dateObj = new Date(log.timestamp);
                  const dateStr = dateObj.toLocaleDateString();
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={log.id} style={{ borderTop: '1px solid var(--v4-border)' }}>
                      <td style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 700 }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--v4-text-secondary)', fontSize: 14 }}>
                        {timeStr}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--v4-text-primary)', fontSize: 14, fontWeight: 600 }}>
                        {log.recipeName}
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--v4-text-secondary)', fontSize: 14 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {log.ingredients.map((ing, idx) => (
                            <span key={idx} style={{ background: 'var(--v4-mode-bg)', border: '1px solid var(--v4-border-light)', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                              {ing.name}: <span style={{ color: 'var(--v4-text-primary)', fontWeight: 700 }}>{ing.amount}{ing.unit}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FertilizerLogs;
