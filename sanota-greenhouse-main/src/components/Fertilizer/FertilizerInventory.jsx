import React, { useState } from 'react';
import { Database, Plus, RefreshCw, Cpu, Edit2, Trash2 } from 'lucide-react';

const FertilizerInventory = ({ inventory, nodes = [], pendingModule, registerModule, cancelModuleRegistration, deleteFertilizer }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('ml');
  const [port, setPort] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter nodes that are relevant (e.g., Sub Devices)
  const subNodes = nodes.filter(n => n.node_type === 'sub');

  React.useEffect(() => {
    if (pendingModule) {
      const nodeId = `DEVICE_${pendingModule.mac.replace(/:/g, '')}`;
      setSelectedNodeId(nodeId);
      
      if (pendingModule.ports && pendingModule.ports.length > 0) {
        // Auto-set first available port that isn't already used if possible
        const usedPorts = inventory.filter(i => i.node_id === nodeId).map(i => i.port);
        const availablePorts = pendingModule.ports.filter(p => !usedPorts.includes(p));
        
        if (availablePorts.length > 0) {
          setPort(availablePorts[0]);
        } else {
          setPort(pendingModule.ports[0]);
        }
      }
    } else if (subNodes.length > 0 && !selectedNodeId) {
       setSelectedNodeId(subNodes[0].id);
    }
  }, [pendingModule, inventory, subNodes, selectedNodeId]);

  const handleRegister = () => {
    if (!name || !amount || !port || !selectedNodeId) {
      return alert('Please enter name, starting amount, hardware port, and select a device.');
    }
    
    if (pendingModule && selectedNodeId === `DEVICE_${pendingModule.mac.replace(/:/g, '')}`) {
      if (!pendingModule.ports.includes(port)) {
        return alert(`❌ Hardware Mismatch! The selected port ${port} was not detected on your ESP32.`);
      }
    }

    registerModule(name, unit, amount, port, selectedNodeId);
    setName('');
    setAmount('');
    setIsAdding(false);
  };

  const closeAdding = () => {
    setIsAdding(false);
    cancelModuleRegistration();
  };

  return (
    <div className="premium-table-container">
      {/* Registration Modal Overlay */}
      {isAdding && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ width: 420, padding: 30, border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div className="premium-icon-box">
                <Cpu size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Add New Fertilizer</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {pendingModule ? `ESP32 Detected: ${pendingModule.mac}` : 'Enter details & hardware port'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 25 }}>
              <div>
                <label className="field-label">Linked Device (Fertilizer Manager)</label>
                <select className="field-input" value={selectedNodeId} onChange={e => setSelectedNodeId(e.target.value)}>
                  {subNodes.map(node => (
                    <option key={node.id} value={node.id} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                      {node.name} ({node.id})
                    </option>
                  ))}
                  {subNodes.length === 0 && <option value="">No registered sub-devices found</option>}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1.5 }}>
                  <label className="field-label">Fertilizer Name</label>
                  <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Calcium Nitrate" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Hardware Port</label>
                  <input 
                    className="field-input" 
                    value={port} 
                    onChange={e => setPort(e.target.value)} 
                    placeholder="e.g. L1" 
                  />
                </div>
              </div>

              {!pendingModule && (
                <div style={{ fontSize: 11, color: 'var(--accent-amber)', background: 'rgba(255, 170, 0, 0.1)', padding: '8px 12px', borderRadius: 8 }}>
                  ⚠️ Note: ESP32 not detected yet. Ensure it is online before registering.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label">Starting Stock</label>
                  <input type="number" className="field-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                </div>
                <div style={{ width: 80 }}>
                  <label className="field-label">Unit</label>
                  <select className="field-input" value={unit} onChange={e => setUnit(e.target.value)}>
                    <option value="ml" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>ml</option>
                    <option value="g" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>g</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleRegister}>
                Register Module
              </button>
              <button className="btn btn-ghost" onClick={closeAdding}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Header */}
      <div className="premium-table-header">
        <div className="premium-table-title-row">
          <h2 className="premium-table-title">
            <div className="premium-icon-box">
              <Database size={18} />
            </div>
            Fertilizer Inventory
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {pendingModule && (
              <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', boxShadow: '0 0 8px #0d9488' }} />
                ESP32 ONLINE
              </div>
            )}
            <button 
              className="btn btn-primary" 
              style={{ fontSize: 12, padding: '8px 16px' }}
              onClick={() => setIsAdding(true)}
            >
              <Plus size={14} /> Add New Fertilizer
            </button>
          </div>
        </div>
        <p className="premium-table-desc">Real-time nutrient stock levels and hardware port assignments</p>
      </div>

      {/* Inventory Table */}
      {inventory.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            No fertilizers registered. Plug a bottle into the ESP32 to begin.
          </div>
      ) : (
        <table className="premium-data-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Hardware Port</th>
              <th style={{ width: '40%' }}>Fertilizer Name</th>
              <th style={{ width: '20%' }}>Current Stock</th>
              <th style={{ width: '20%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => {
              const lowStock = item.stock < 500;
              return (
                <tr key={item.id}>
                  <td className="premium-td-bold">{item.port}</td>
                  <td className="premium-td-normal" style={{ fontSize: '15px' }}>{item.name}</td>
                  <td className="premium-td-normal">
                    <span style={{ fontWeight: 700, color: 'var(--v4-text-primary)' }}>{item.stock}</span>
                    <span style={{ marginLeft: '4px', opacity: 0.6 }}>{item.unit}</span>
                  </td>
                  <td>
                    {lowStock ? (
                      <span className="premium-status-badge orange">refill needed</span>
                    ) : (
                      <span className="premium-status-badge teal">active</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FertilizerInventory;
