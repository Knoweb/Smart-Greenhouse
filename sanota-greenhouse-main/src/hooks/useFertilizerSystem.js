import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useFertilizerSystem = (user) => {
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // systemStatus: 'IDLE' | 'MIXING' | 'ERROR'
  const [systemStatus, setSystemStatus] = useState('IDLE');
  const [activeMixingId, setActiveMixingId] = useState(null);
  const [pendingModule, setPendingModule] = useState(null);

  // Poll for real device discovery from ESP32
  useEffect(() => {
    if (!user) return;

    const checkDiscovery = async () => {
      const { data, error } = await supabase
        .from('device_discovery')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const dev = data[0];
        const lastSeen = new Date(dev.last_seen);
        const now = new Date();

        // If device was seen in the last 30 seconds and has ports defined
        if (now - lastSeen < 30000 && dev.metadata?.available_ports) {
          // If we don't have a pending module or it's a different one
          if (!pendingModule || pendingModule.mac !== dev.mac_address) {
            setPendingModule({
              mac: dev.mac_address,
              ports: dev.metadata.available_ports,
              detectedAt: lastSeen
            });
          }
        } else if (pendingModule) {
          // Device went offline or timed out
          setPendingModule(null);
        }
      }
    };

    const interval = setInterval(checkDiscovery, 5000);
    return () => clearInterval(interval);
  }, [user, pendingModule]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [invRes, recRes, schRes, logRes] = await Promise.all([
        supabase.from('fertilizer_inventory').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('fertilizer_recipes').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('fertilizer_schedules').select('*').eq('owner_id', user.id).order('start_time'),
        supabase.from('fertilizer_logs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(50)
      ]);

      if (invRes.data) setInventory(invRes.data);
      if (recRes.data) {
        setRecipes(recRes.data);
      }

      if (schRes.data) {
        const mappedSchedules = schRes.data.map(s => ({
          id: s.id,
          recipeId: s.recipe_id,
          time: s.start_time.substring(0, 5),
          daysOfWeek: s.days_of_week || [],
          isActive: s.is_active,
          scheduledDate: s.scheduled_date
        }));
        setSchedules(mappedSchedules);
      }

      if (logRes.data) {
        const mappedLogs = logRes.data.map(l => ({
          id: l.id,
          timestamp: l.created_at,
          recipeName: l.recipe_name,
          ingredients: l.ingredients
        }));
        setLogs(mappedLogs);
      }
    } catch (err) {
      console.error("Fertilizer fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('fertilizer-system')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fertilizer_inventory' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fertilizer_recipes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fertilizer_schedules' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fertilizer_logs' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchData]);

  const registerModule = useCallback(async (name, unit, stock, port, nodeId) => {
    if (!nodeId) {
      alert("No device selected!");
      return;
    }

    if (!user) {
      alert("Error: No authenticated user found.");
      return;
    }

    console.log("Attempting to register:", { name, unit, stock, port, owner_id: user.id, node_id: nodeId });

    const { error } = await supabase.from('fertilizer_inventory').insert([{
      name,
      unit,
      stock: Number(stock),
      port: port,
      owner_id: user.id,
      node_id: nodeId
    }]);

    if (error) {
      console.error("Supabase Error:", error);
      alert("❌ Database Error: " + error.message);
    } else {
      alert("🚀 Success! Fertilizer registered on port " + port);
      setPendingModule(null);
      await fetchData();
    }
  }, [user, fetchData]);

  const cancelModuleRegistration = useCallback(() => {
    setPendingModule(null);
  }, []);

  const saveRecipe = useCallback(async (recipe) => {
    const { error } = await supabase.from('fertilizer_recipes').insert([{ ...recipe, owner_id: user.id }]);
    if (!error) fetchData();
  }, [user?.id, fetchData]);

  const deleteRecipe = useCallback(async (id) => {
    const { error } = await supabase.from('fertilizer_recipes').delete().eq('id', id);
    if (!error) fetchData();
  }, [fetchData]);

  const addSchedule = useCallback(async (schedule) => {
    const { error } = await supabase.from('fertilizer_schedules').insert([{
      recipe_id: schedule.recipeId,
      start_time: schedule.time,
      days_of_week: schedule.daysOfWeek,
      scheduled_date: schedule.scheduledDate || null,
      is_active: true,
      owner_id: user.id
    }]);
    if (!error) fetchData();
  }, [user?.id, fetchData]);

  const deleteSchedule = useCallback(async (id) => {
    const { error } = await supabase.from('fertilizer_schedules').delete().eq('id', id);
    if (!error) fetchData();
  }, [fetchData]);

  const toggleSchedule = useCallback(async (id) => {
    const sch = schedules.find(s => s.id === id);
    if (!sch) return;

    const newActiveState = !sch.isActive;

    // Optimistic update
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: newActiveState } : s));

    const { error } = await supabase
      .from('fertilizer_schedules')
      .update({ is_active: newActiveState })
      .eq('id', id);

    if (error) {
      console.error("Failed to toggle schedule:", error.message);
      // Revert on error
      fetchData();
    }
  }, [schedules, fetchData]);

  const simulateMixing = useCallback(async (recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      console.error("Recipe not found:", recipeId);
      return;
    }

    console.log("Starting mix for recipe:", recipe.name);
    setSystemStatus('MIXING');
    setActiveMixingId(recipeId);
    
    setTimeout(async () => {
      try {
        for (const ingredient of recipe.ingredients) {
          const item = inventory.find(i => i.id === ingredient.fertilizerId);
          if (item && item.node_id) {
            console.log(`Injecting ${ingredient.amount}${item.unit} of ${item.name} via node ${item.node_id}`);
            await supabase.from('pending_fertilizer_tasks').insert([{
              fertilizer_name: item.name,
              hardware_port: item.port,
              amount: ingredient.amount,
              unit: item.unit,
              owner_id: user.id,
              node_id: item.node_id
            }]);
            const newStock = Math.max(0, item.stock - ingredient.amount);
            await supabase.from('fertilizer_inventory').update({ stock: newStock }).eq('id', item.id);
          }
        }

        const logIngredients = recipe.ingredients.map(ing => {
          const invItem = inventory.find(i => i.id === ing.fertilizerId);
          return {
            name: invItem ? invItem.name : 'Unknown Ingredient',
            amount: ing.amount,
            unit: invItem ? invItem.unit : ''
          };
        });

        await supabase.from('fertilizer_logs').insert([{
          recipe_name: recipe.name,
          ingredients: logIngredients,
          owner_id: user.id
        }]);

      } catch (err) {
        console.error("Error during mixing sequence:", err);
      } finally {
        setSystemStatus('IDLE');
        setActiveMixingId(null);
        fetchData();
      }
    }, 3000);
  }, [inventory, recipes, user?.id, fetchData]);

  return {
    inventory,
    recipes,
    schedules,
    logs,
    systemStatus,
    activeMixingId,
    pendingModule,
    loading,
    registerModule,
    cancelModuleRegistration,
    saveRecipe,
    deleteRecipe,
    addSchedule,
    deleteSchedule,
    toggleSchedule,
    simulateMixing
  };
};
