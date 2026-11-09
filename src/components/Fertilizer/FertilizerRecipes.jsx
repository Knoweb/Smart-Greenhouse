import React, { useState } from 'react';
import { Beaker, Plus, Trash2, Save, Activity, Edit2, Settings } from 'lucide-react';

const BAR_COLORS = ['#22c55e', '#f97316', '#a855f7', '#3b82f6', '#ec4899', '#eab308'];

const FertilizerRecipes = ({ recipes, inventory, saveRecipe, deleteRecipe, simulateMixing, activeMixingId }) => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [selectedFertilizerId, setSelectedFertilizerId] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('');

  const handleAddIngredient = () => {
    if (!selectedFertilizerId || !ingredientAmount) return;
    if (ingredients.find(i => i.fertilizerId === selectedFertilizerId)) {
      return alert("This fertilizer is already in the recipe.");
    }

    setIngredients([...ingredients, {
      fertilizerId: selectedFertilizerId,
      amount: Number(ingredientAmount)
    }]);

    setSelectedFertilizerId('');
    setIngredientAmount('');
  };

  const handleRemoveIngredient = (fId) => {
    setIngredients(prev => prev.filter(i => i.fertilizerId !== fId));
  };

  const handleSaveRecipe = () => {
    if (!recipeName || ingredients.length === 0) return alert('Enter a name and at least one ingredient.');
    saveRecipe({ name: recipeName, ingredients });
    setRecipeName('');
    setIngredients([]);
  };

  const getFertilizerInfo = (id) => inventory.find(i => i.id === id) || { name: 'Unknown', unit: 'ml' };

  return (
    <div className="grid-12">

      {/* RECIPE BUILDER GRID */}
      <div className="col-12 recipe-builder-grid" style={{ marginBottom: '32px' }}>

        {/* LEFT PANEL: NUTRIENT COMPOSITION */}
        <div className="recipe-panel">
          <div className="nutrient-comp-header">
            <div className="nutrient-header-title">
              <Beaker className="nutrient-icon" size={24} />
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--v4-text-primary)' }}>Nutrient Composition</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--v4-text-secondary)' }}>Adjust individual element concentrations</p>
              </div>
            </div>
            <button
              className="premium-status-badge teal"
              style={{ minWidth: 'auto', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
              onClick={() => {
                const el = document.getElementById('fertilizer-select');
                if (el) el.focus();
              }}
            >
              <Plus size={14} style={{ marginRight: '6px' }} /> Add Nutrient
            </button>
          </div>

          <div className="nutrient-progress-list">
            {ingredients.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--v4-text-muted)', background: 'var(--v4-card-bg)', borderRadius: '12px', border: '1px dashed var(--v4-border)' }}>
                No nutrients added. Start building your recipe by adding ingredients from the Mix Configuration.
              </div>
            ) : (
              ingredients.map((ing, idx) => {
                const info = getFertilizerInfo(ing.fertilizerId);
                const color = BAR_COLORS[idx % BAR_COLORS.length];
                const percentage = Math.min((ing.amount / 200) * 100, 100);

                return (
                  <div key={ing.fertilizerId} className="nutrient-row">
                    <div className="nutrient-row-header">
                      <span className="nutrient-name">{info.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="nutrient-value">{ing.amount}{info.unit}</span>
                        <button
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}
                          onClick={() => handleRemoveIngredient(ing.fertilizerId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="nutrient-bar-track">
                      <div
                        className="nutrient-bar-fill"
                        style={{ width: `${percentage}%`, background: color, boxShadow: `0 0 15px ${color}44` }}
                      />
                    </div>
                    <div className="scale-row">
                      <span className="scale-label">0{info.unit}</span>
                      <span className="scale-label">50{info.unit}</span>
                      <span className="scale-label">100{info.unit}</span>
                      <span className="scale-label">150{info.unit}</span>
                      <span className="scale-label">200{info.unit}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: MIX CONFIGURATION */}
        <div className="mix-config-panel">
          <div className="recipe-builder-section">
            <div className="nutrient-comp-header" style={{ marginBottom: '24px' }}>
              <div className="nutrient-header-title">
                <Settings size={24} style={{ color: 'var(--v4-text-muted)' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--v4-text-primary)' }}>Mix Configuration</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--v4-text-secondary)' }}>Batch settings and mixing parameters</p>
                </div>
              </div>
            </div>

            <div className="recipe-input-group">
              <label className="recipe-field-label">Recipe Name</label>
              <input
                className="recipe-main-input"
                placeholder="e.g. Tomato Blooming Phase"
                value={recipeName}
                onChange={e => setRecipeName(e.target.value)}
              />
            </div>

            <div className="mix-ingredients-box">
              <span className="mix-box-title">Mix Ingredients</span>

              <div className="mix-row">
                <div className="recipe-input-group" style={{ flex: 2 }}>
                  <label className="recipe-field-label">Fertilizer</label>
                  <select
                    id="fertilizer-select"
                    className="recipe-main-input"
                    value={selectedFertilizerId}
                    onChange={e => setSelectedFertilizerId(e.target.value)}
                    style={{ background: 'var(--v4-mode-bg)' }}
                  >
                    <option value="">-- Select --</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id} style={{ background: 'var(--v4-mode-bg)' }}>{inv.name} (Port {inv.port})</option>
                    ))}
                  </select>
                </div>

                <div className="recipe-input-group" style={{ flex: 1 }}>
                  <label className="recipe-field-label">Amount</label>
                  <input
                    type="number"
                    className="recipe-main-input"
                    placeholder="0"
                    value={ingredientAmount}
                    onChange={e => setIngredientAmount(e.target.value)}
                  />
                </div>

                <button className="btn-add-mix" onClick={handleAddIngredient}>
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>

            <button className="btn-save-recipe" style={{ marginTop: '8px' }} onClick={handleSaveRecipe}>
              <Save size={18} /> Save Recipe Mixture
            </button>
          </div>
        </div>

      </div>

      {/* SAVED RECIPES LIBRARY GRID */}
      <div className="col-12" style={{ marginTop: '16px' }}>
        <div className="premium-table-header" style={{ marginBottom: '16px' }}>
          <h2 className="premium-table-title">
            <div className="premium-icon-box">
              <Activity size={18} />
            </div>
            Saved Recipe Library
          </h2>
        </div>

        {recipes.length === 0 ? (
          <div className="recipe-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--v4-text-muted)' }}>
            No recipes saved. Build one above to get started.
          </div>
        ) : (
          <div className="recipe-cards-grid">
            {recipes.map(recipe => {
              const totalWeight = recipe.ingredients.reduce((acc, ing) => acc + ing.amount, 0);
              const ec = (1.5 + Math.random()).toFixed(1);
              const ph = (5.5 + Math.random()).toFixed(1);

              return (
                <div key={recipe.id} className="recipe-card-v4">
                  <div className="recipe-card-header">
                    <h3 className="recipe-card-title">{recipe.name}</h3>
                    <span className="premium-status-badge teal" style={{ minWidth: 'auto', padding: '4px 12px' }}>active</span>
                  </div>

                  <p className="recipe-card-subtitle">Custom nutrient blend</p>

                  <div className="recipe-nutrient-list">
                    {recipe.ingredients.map(ing => {
                      const info = getFertilizerInfo(ing.fertilizerId);
                      return (
                        <div key={ing.fertilizerId} className="recipe-nutrient-item">
                          <span className="recipe-nutrient-label">{info.name}:</span>
                          <span className="recipe-nutrient-val">{ing.amount}{info.unit}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="recipe-card-actions">
                    <button className="recipe-card-btn edit" onClick={() => {
                      setRecipeName(recipe.name);
                      setIngredients(recipe.ingredients);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      <Edit2 size={16} /> Edit
                    </button>
                    <button 
                      className={`recipe-card-btn mix ${activeMixingId === recipe.id ? 'active' : ''}`} 
                      onClick={() => simulateMixing(recipe.id)}
                      disabled={activeMixingId !== null}
                    >
                      <Activity size={16} className={activeMixingId === recipe.id ? 'pulse' : ''} /> 
                      {activeMixingId === recipe.id ? 'Mixing...' : 'Mix'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default FertilizerRecipes;
