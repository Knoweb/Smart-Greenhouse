import React, { useState } from 'react';
import { Beaker, Clock, Plus, Trash2, Syringe } from 'lucide-react';

const initRecipes = [
  { id: 1, name: 'Seedling Stage',    n: 10, p: 52, k: 10, notes: 'Low concentration, high P for root growth.' },
  { id: 2, name: 'Vegetative Growth', n: 25, p: 20, k: 20, notes: 'Balanced NPK for leaf and stem growth.' },
  { id: 3, name: 'Fruiting Stage',    n: 12, p: 12, k: 36, notes: 'High K for fruit development and quality.' },
];

const initLogs = [
  { id: 1, time: '08:30', recipe: 'Vegetative Growth', amount: 250, unit: 'ml' },
  { id: 2, time: '13:00', recipe: 'Vegetative Growth', amount: 250, unit: 'ml' },
  { id: 3, time: '09:00', recipe: 'Manual Injection',  amount: 80,  unit: 'ml' },
];

const NPKBar = ({ n, p, k }) => (
  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
    {[['N', n, '#00c853'], ['P', p, '#00e5ff'], ['K', k, '#d500f9']].map(([lbl, val, clr]) => (
      <div key={lbl} style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{lbl} {val}%</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${val}%`, background: clr }} />
        </div>
      </div>
    ))}
  </div>
);

const FertilizerManager = ({ recipes, setRecipes }) => {
  const [logs]    = useState(initLogs);
  const [dose, setDose]     = useState('');
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ name: '', n: 10, p: 10, k: 10, notes: '' });

  const deleteRecipe = (id) => setRecipes(r => r.filter(x => x.id !== id));

  const handleAddRecipe = () => {
    if (!newRecipe.name) return alert('Please enter a recipe name');
    setRecipes([...recipes, { ...newRecipe, id: Date.now() }]);
    setIsAdding(false);
    setNewRecipe({ name: '', n: 10, p: 10, k: 10, notes: '' });
  };

  const updateNPK = (id, field, val) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, [field]: parseInt(val) || 0 } : r));
  };

  return (
    <div className="fertilizer-container grid-12" style={{ alignItems: 'start' }}>
      {/* Recipes */}
      <div className="glass-card col-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}><Beaker size={15} /> Nutrient Recipes</div>
          {!isAdding && (
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              <Plus size={14} /> New Recipe
            </button>
          )}
        </div>

        {isAdding && (
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Create New Recipe</div>
            <div className="recipe-form-grid">
              <div style={{ gridColumn: 'span 3' }}>
                <label className="field-label">Recipe Name</label>
                <input className="field-input" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name:e.target.value})} />
              </div>
              <div>
                <label className="field-label">Nitrogen (N)</label>
                <input type="number" className="field-input" value={newRecipe.n} onChange={e => setNewRecipe({...newRecipe, n:parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="field-label">Phosphorus (P)</label>
                <input type="number" className="field-input" value={newRecipe.p} onChange={e => setNewRecipe({...newRecipe, p:parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="field-label">Potassium (K)</label>
                <input type="number" className="field-input" value={newRecipe.k} onChange={e => setNewRecipe({...newRecipe, k:parseInt(e.target.value)})} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label className="field-label">Notes</label>
                <input className="field-input" value={newRecipe.notes} onChange={e => setNewRecipe({...newRecipe, notes:e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleAddRecipe}>Save Recipe</button>
              <button className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recipes.map(r => (
            <div key={r.id} className={`recipe-item ${selected === r.id ? 'selected' : ''}`}>
              <div className="recipe-header">
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>{r.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{r.notes}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn ${selected === r.id ? 'btn-primary' : 'btn-ghost'}`} 
                    style={{ padding: '5px 12px', fontSize: 12 }}
                    onClick={() => setSelected(r.id === selected ? null : r.id)}>
                    {selected === r.id ? 'Active' : 'Apply'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '5px 10px' }}
                    onClick={() => deleteRecipe(r.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              <div className="recipe-npk-row">
                {[['N', 'n', '#00c853'], ['P', 'p', '#00e5ff'], ['K', 'k', '#d500f9']].map(([lbl, key, clr]) => (
                  <div key={lbl} className="recipe-npk-col">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>{lbl}</span>
                      <input 
                        type="number" 
                        value={r[key]} 
                        onChange={(e) => updateNPK(r.id, key, e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: clr, textAlign: 'right', fontWeight: 800, width: 30, padding: 0 }}
                      />
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, r[key])}%`, background: clr }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Manual Dose */}
        <div className="glass-card">
          <div className="card-title"><Syringe size={15} /> Manual Dosing</div>
          <label className="field-label">Amount (ml)</label>
          <input className="field-input" type="number" placeholder="e.g. 100" value={dose}
            onChange={e => setDose(e.target.value)} style={{ marginBottom: 10 }} />
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Inject Now
          </button>
        </div>

        {/* Dosing Log */}
        <div className="glass-card">
          <div className="card-title"><Clock size={15} /> Today's Dosing Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {logs.map(l => (
              <div key={l.id} className="dosing-log-item">
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{l.recipe}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent-water)', fontSize: 14 }}>{l.amount} {l.unit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerManager;
