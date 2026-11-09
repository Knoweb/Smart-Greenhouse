import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useGreenhouseData = (user) => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const selectedZoneRef = useRef(selectedZone);

  // Update ref whenever state changes
  useEffect(() => {
    selectedZoneRef.current = selectedZone;
  }, [selectedZone]);
  const [nodes, setNodes] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [readings, setReadings] = useState({});
  const [historicalReadings, setHistoricalReadings] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [actuatorLogs, setActuatorLogs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lightingProfiles, setLightingProfiles] = useState([]);
  const [lightingSchedules, setLightingSchedules] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [greenhouseDesigns, setGreenhouseDesigns] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState({}); // { [actuatorId]: { data: { ... }, timestamp: Date.now() } }

  const isInitialLoad = useRef(true);

  const assertNoError = (result, fallbackMessage) => {
    if (result?.error) {
      throw new Error(result.error.message || fallbackMessage);
    }
  };

  const fetchData = async (silent = false) => {
    if (!user) {
      setZones([]);
      setSelectedZone(null);
      setNodes([]);
      setSensors([]);
      setReadings({});
      setHistoricalReadings([]);
      setActuators([]);
      setActuatorLogs([]);
      setSchedules([]);
      setAutomationRules([]);
      setAlerts([]);
      setLightingProfiles([]);
      setLightingSchedules([]);
      setGreenhouseDesigns([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!silent && loading && !isInitialLoad.current) return;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 15000)
    );

    try {
      if (!silent) setLoading(true);

      const basePromise = Promise.all([
        supabase.from('zones').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('nodes').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('lighting_profiles').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('greenhouse_designs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('fertilizer_inventory').select('*').eq('owner_id', user.id).order('name'),
        supabase.from('system_settings').select('*').eq('owner_id', user.id).single()
      ]);

      const baseResults = await Promise.race([basePromise, timeoutPromise]);
      baseResults.forEach((result, index) => {
        if (index === 6 && result.error?.code === 'PGRST116') return; // Ignore "no rows found" for settings
        assertNoError(result, `Failed to load base data set ${index + 1}.`);
      });
      const zonesData = baseResults[0].data || [];
      const nodesData = baseResults[1].data || [];
      const lightingProfilesData = baseResults[2].data || [];
      const greenhouseDesignsData = baseResults[3]?.data || [];
      const alertsData = baseResults[4]?.data || [];
      const fertilizersData = baseResults[5]?.data || [];
      const settingsData = baseResults[6]?.data || null;

      const nodeIds = nodesData.map((node) => node.id);

      const sensorsPromise = nodeIds.length
        ? supabase.from('sensors').select('*').in('node_id', nodeIds).order('label')
        : Promise.resolve({ data: [], error: null });

      const actuatorsPromise = nodeIds.length
        ? supabase.from('actuators').select('*').in('node_id', nodeIds).order('label')
        : Promise.resolve({ data: [], error: null });

      const secondaryResults = await Promise.race([
        Promise.all([sensorsPromise, actuatorsPromise]),
        timeoutPromise
      ]);
      secondaryResults.forEach((result, index) => assertNoError(result, `Failed to load device data set ${index + 1}.`));

      const sensorsData = secondaryResults[0].data || [];
      const actuatorsData = secondaryResults[1].data || [];
      const sensorIds = sensorsData.map((sensor) => sensor.id);
      const actuatorIds = actuatorsData.map((actuator) => actuator.id);

      const tertiaryResults = await Promise.race([
        Promise.all([
          actuatorIds.length
            ? supabase.from('actuator_schedules').select('*').in('actuator_id', actuatorIds).order('start_time')
            : Promise.resolve({ data: [], error: null }),
          sensorIds.length
            ? supabase.from('sensor_readings').select('sensor_id, value, created_at').in('sensor_id', sensorIds).order('id', { ascending: false }).limit(5000)
            : Promise.resolve({ data: [], error: null }),
          actuatorIds.length
            ? supabase.from('actuator_logs').select('*, actuators(id, label, node_id)').in('actuator_id', actuatorIds).order('created_at', { ascending: false }).limit(5000)
            : Promise.resolve({ data: [], error: null }),
          actuatorIds.length
            ? supabase.from('automation_rules').select('*, sensors(id, label, sensor_type, unit), actuators(id, label, actuator_type)').in('actuator_id', actuatorIds).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          actuatorIds.length
            ? supabase.from('lighting_schedules').select('*, lighting_profiles(*)').in('actuator_id', actuatorIds).order('start_time')
            : Promise.resolve({ data: [], error: null })
        ]),
        timeoutPromise
      ]);
      tertiaryResults.forEach((result, index) => assertNoError(result, `Failed to load related data set ${index + 1}.`));

      // Apply pending updates to actuatorsData to prevent flickering
      const mergedActuators = actuatorsData.map(act => {
        const pending = pendingUpdates[act.id];
        if (pending && (Date.now() - pending.timestamp < 5000)) {
          return { ...act, ...pending.data };
        }
        return act;
      });

      setZones(zonesData);
      setNodes(nodesData);
      setSensors(sensorsData);
      setActuators(mergedActuators);
      setSchedules(tertiaryResults[0].data || []);
      setHistoricalReadings(tertiaryResults[1].data || []);
      setActuatorLogs(tertiaryResults[2].data || []);
      setAutomationRules(tertiaryResults[3].data || []);
      setLightingSchedules(tertiaryResults[4].data || []);
      setLightingProfiles(lightingProfilesData);
      setGreenhouseDesigns(greenhouseDesignsData);
      setAlerts(alertsData);
      setFertilizers(fertilizersData);
      setSystemSettings(settingsData);

      if (zonesData.length > 0) {
        // Use the REF to check the current selection (prevents stale closure)
        const currentSelection = selectedZoneRef.current;
        
        if (!currentSelection) {
          // Initial load: set first zone as default
          setSelectedZone(zonesData[0]);
        } else {
          // Check if currently selected zone still exists in the new data
          const stillExists = zonesData.find(z => z.id === currentSelection.id);
          if (!stillExists) {
            setSelectedZone(zonesData[0]);
          }
          // Note: We don't need to call setSelectedZone(stillExists) if it hasn't changed 
          // to avoid unnecessary re-renders during polling.
        }
      }

      const readingsMap = {};
      const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
      (tertiaryResults[1].data || []).forEach(r => {
        if (readingsMap[r.sensor_id] === undefined) {
          const readingTime = new Date(r.created_at).getTime();
          readingsMap[r.sensor_id] = readingTime < thirtyMinsAgo ? 0 : r.value;
        }
      });
      setReadings(readingsMap);

      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => fetchData(true), 30000);

    const channel = supabase
      .channel('realtime:sensor_readings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          const newReading = payload.new;
          setReadings(prev => ({
            ...prev,
            [newReading.sensor_id]: newReading.value
          }));
          setHistoricalReadings(prev => {
            const newArray = [newReading, ...prev];
            if (newArray.length > 5000) newArray.pop();
            return newArray;
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const triggerSync = () => fetchData(true);

  const addSchedule = async (input) => {
    const payload = typeof input === 'object' && input !== null
      ? {
          actuator_id: input.actuator_id,
          start_time: input.start_time || '12:00:00',
          duration_seconds: input.duration_seconds ?? 600,
          days_of_week: input.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
          scheduled_date: input.scheduled_date ?? null,
          is_active: input.is_active ?? true
        }
      : {
          actuator_id: input,
          start_time: '12:00:00',
          duration_seconds: 600,
          is_active: true,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          scheduled_date: null
        };

    const res = await supabase
      .from('actuator_schedules')
      .insert([payload])
      .select('*')
      .single();

    if (res?.error) {
      console.error("ADD_SCHEDULE_ERROR:", res.error);
      alert("Failed to add schedule: " + res.error.message);
    } else if (res?.data) {
      setSchedules(prev => [res.data, ...prev.filter(item => item.id !== res.data.id)]);
    }
    triggerSync();
    return res;
  };

  const updateSchedule = async (id, updates) => {
    const res = await supabase
      .from('actuator_schedules')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (res?.error) {
      console.error("UPDATE_SCHEDULE_ERROR:", res.error);
      alert("Failed to update schedule: " + res.error.message);
    } else if (res?.data) {
      setSchedules(prev => prev.map(item => item.id === id ? res.data : item));
    }
    triggerSync();
    return res;
  };

  const deleteSchedule = async (id) => {
    const res = await supabase.from('actuator_schedules').delete().eq('id', id);
    if (res?.error) {
      console.error("DELETE_SCHEDULE_ERROR:", res.error);
      alert("Failed to delete schedule: " + res.error.message);
    } else {
      setSchedules(prev => prev.filter(item => item.id !== id));
    }
    triggerSync();
    return res;
  };

  const updateActuatorMode = async (id, mode) => {
    const currentAct = actuators.find(a => a.id === id);
    if (currentAct?.control_mode === mode) return { error: null };

    // PENDING UPDATE - Keep current state but change mode
    const updateData = { control_mode: mode, target_state: { ...(currentAct.target_state || {}), override: false } };
    setPendingUpdates(prev => ({ ...prev, [id]: { data: updateData, timestamp: Date.now() } }));

    // OPTIMISTIC UPDATE
    setActuators(current =>
      current.map(a => a.id === id ? { ...a, ...updateData } : a)
    );

    // Call mode update RPC
    const { error: modeError } = await supabase.rpc('update_actuator_mode_secure', {
      p_actuator_id: id,
      p_mode: mode
    });

    if (modeError) {
      console.error("Failed to update mode:", modeError.message);
      fetchData(true);
      return { error: modeError };
    }
    return { error: null };
  };

  const updateActuatorState = async (id, isOn) => {
    // OPTIMISTIC UPDATE: Merging instead of overwriting
    setActuators(current =>
      current.map(a => a.id === id ? {
        ...a,
        target_state: { ...(a.target_state || {}), on: isOn }
      } : a)
    );

    const { error } = await supabase.rpc('update_actuator_state_secure', {
      p_actuator_id: id,
      p_is_on: isOn
    });

    if (error) {
      console.error("Failed to update state:", error.message);
      // Only refresh if there's an error to revert the UI
      fetchData(true);
      return { error };
    }

    // No immediate fetchData here to prevent flickering. 
    // The next background poll (30s) or any other action will sync it eventually.
    return { error: null };
  };

  const updateActuatorIntensity = async (id, intensity) => {
    const intensityNum = parseInt(intensity);

    // OPTIMISTIC UPDATE - Preserve state and set override
    setActuators(current =>
      current.map(a => a.id === id ? { ...a, target_state: { ...(a.target_state || {}), intensity: intensityNum, override: true } } : a)
    );

    const { error } = await supabase.rpc('update_actuator_intensity_secure', {
      p_actuator_id: id,
      p_intensity: intensityNum
    });

    if (error) {
      console.error("Failed to update intensity:", error.message);
      fetchData(true);
      return { error };
    }

    return { error: null };
  };

  const addAutomationRule = async (rule) => {
    const res = await supabase.from('automation_rules').insert([rule]);
    triggerSync();
    return res;
  };

  const updateAutomationRule = async (id, updates) => {
    const res = await supabase.from('automation_rules').update(updates).eq('id', id);
    triggerSync();
    return res;
  };

  const deleteAutomationRule = async (id) => {
    const res = await supabase.from('automation_rules').delete().eq('id', id);
    triggerSync();
    return res;
  };

  const registerDevice = async ({ macAddress, zoneName = '', nodeType = 'sub', name }) => {
    if (!user) {
      return { data: null, error: new Error('You must be logged in to register a device.') };
    }

    const normalizedMac = (macAddress || '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (normalizedMac.length !== 12) {
      return { data: null, error: new Error('Please enter a valid device MAC address.') };
    }

    const formattedMac = normalizedMac.match(/.{1,2}/g)?.join(':') || normalizedMac;
    const deviceName = name?.trim() || `Device ${formattedMac}`;
    const trimmedZoneName = zoneName.trim();
    const { data, error } = await supabase.rpc('register_device_by_mac', {
      p_mac_address: formattedMac,
      p_device_name: deviceName,
      p_node_type: nodeType,
      p_zone_name: trimmedZoneName || null
    });

    triggerSync();
    return { data, error };
  };

  const deleteDevice = async (id) => {
    const res = await supabase.from('nodes').delete().eq('id', id);
    triggerSync();
    return res;
  };

  const addLightingProfile = async (profile) => {
    const res = await supabase.from('lighting_profiles').insert([
      { ...profile, owner_id: user.id }
    ]);
    if (res.error) {
      console.error("Failed to add lighting profile:", res.error.message);
      alert("Failed to add profile: " + res.error.message);
    }
    triggerSync();
    return res;
  };

  const deleteLightingProfile = async (id) => {
    const res = await supabase.from('lighting_profiles').delete().eq('id', id);
    triggerSync();
    return res;
  };

  const updateLightingProfile = async (id, updates) => {
    const res = await supabase.from('lighting_profiles').update(updates).eq('id', id);
    triggerSync();
    return res;
  };

  const addLightingSchedule = async (schedule) => {
    const res = await supabase.from('lighting_schedules').insert([
      { ...schedule, owner_id: user.id }
    ]);
    if (res.error) {
      console.error("Failed to add lighting schedule:", res.error.message);
      alert("Failed to add schedule: " + res.error.message);
    }
    triggerSync();
    return res;
  };

  const updateLightingSchedule = async (id, updates) => {
    // OPTIMISTIC UPDATE
    setLightingSchedules(current =>
      current.map(s => s.id === id ? { ...s, ...updates } : s)
    );

    const res = await supabase.from('lighting_schedules').update(updates).eq('id', id);
    if (res.error) {
      console.error("Failed to update lighting schedule:", res.error.message);
      fetchData(true);
    }
    return res;
  };

  const deleteLightingSchedule = async (id) => {
    const res = await supabase.from('lighting_schedules').delete().eq('id', id);
    triggerSync();
    return res;
  };

  const addGreenhouseDesign = async (design) => {
    const res = await supabase.from('greenhouse_designs').insert([
      { ...design, owner_id: user.id }
    ]);
    triggerSync();
    return res;
  };

  const deleteGreenhouseDesign = async (id) => {
    const res = await supabase.from('greenhouse_designs').delete().eq('id', id);
    triggerSync();
    return res;
  };

  const addFertilizer = async (data) => {
    const { error } = await supabase.from('fertilizer_inventory').insert([
      { ...data, owner_id: user.id }
    ]);
    if (error) {
      console.error("Failed to add fertilizer:", error.message);
      return { error };
    }
    fetchData(true);
    return { error: null };
  };

  const updateSystemSettings = async (updates) => {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ owner_id: user.id, ...updates, updated_at: new Date() })
      .select()
      .single();

    if (!error) {
      setSystemSettings(data);
    }
    return { data, error };
  };

  return {
    zones, selectedZone, setSelectedZone, nodes,
    sensors, readings, historicalReadings, actuators, actuatorLogs, schedules,
    automationRules, alerts, lightingProfiles, lightingSchedules, greenhouseDesigns, fertilizers, systemSettings, loading, error,
    addSchedule, updateSchedule, deleteSchedule, updateActuatorMode, updateActuatorState, updateActuatorIntensity,
    addAutomationRule, updateAutomationRule, deleteAutomationRule, registerDevice, deleteDevice,
    addLightingProfile, deleteLightingProfile, updateLightingProfile,
    addLightingSchedule, updateLightingSchedule, deleteLightingSchedule,
    addGreenhouseDesign, deleteGreenhouseDesign, addFertilizer, updateSystemSettings
  };
};
