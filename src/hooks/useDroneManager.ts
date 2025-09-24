import { useState, useCallback } from 'react';
import { DroneInstance, DroneManagerState } from '../types/DroneTypes';
import { loadCsvData } from '../utils/csvLoader';

const DRONE_COLORS = [
  '#4cafef', '#ff5050', '#50ff50', '#ffff50', '#ff50ff', 
  '#50ffff', '#ffa500', '#9370db', '#32cd32', '#ff69b4'
];

export function useDroneManager() {
  const [state, setState] = useState<DroneManagerState>({
    drones: [],
    activeDroneId: null,
    isLoading: false,
    error: null,
  });

  const generateDroneId = useCallback(() => {
    return `drone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addDrone = useCallback(async (file: File) => {
    const droneId = generateDroneId();
    const droneName = file.name.replace('.csv', '');
    const droneColor = DRONE_COLORS[state.drones.length % DRONE_COLORS.length];

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const frames = await loadCsvData(file);
      
      const newDrone: DroneInstance = {
        id: droneId,
        name: droneName,
        file,
        frames,
        color: droneColor,
        visible: true,
        inTimeline: false,
        timelineHidden: false,
      };

      setState(prev => ({
        ...prev,
        drones: [...prev.drones, newDrone],
        activeDroneId: prev.activeDroneId || droneId, // Set as active if first drone
        isLoading: false,
      }));

      return newDrone;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load drone data',
      }));
      throw error;
    }
  }, [state.drones.length, generateDroneId]);

  const removeDrone = useCallback((droneId: string) => {
    setState(prev => {
      const newDrones = prev.drones.filter(drone => drone.id !== droneId);
      const newActiveDroneId = prev.activeDroneId === droneId 
        ? (newDrones.length > 0 ? newDrones[0].id : null)
        : prev.activeDroneId;

      return {
        ...prev,
        drones: newDrones,
        activeDroneId: newActiveDroneId,
      };
    });
  }, []);

  const setActiveDrone = useCallback((droneId: string | null) => {
    setState(prev => ({
      ...prev,
      activeDroneId: droneId,
    }));
  }, []);

  const toggleDroneVisibility = useCallback((droneId: string) => {
    setState(prev => ({
      ...prev,
      drones: prev.drones.map(drone =>
        drone.id === droneId
          ? { ...drone, visible: !drone.visible }
          : drone
      ),
    }));
  }, []);

  // Timeline lifecycle management
  const addToTimeline = useCallback((droneId: string) => {
    setState(prev => ({
      ...prev,
      drones: prev.drones.map(d => d.id === droneId ? { ...d, inTimeline: true } : d),
    }));
  }, []);

  const removeFromTimeline = useCallback((droneId: string) => {
    setState(prev => ({
      ...prev,
      drones: prev.drones.map(d => d.id === droneId ? { ...d, inTimeline: false } : d),
    }));
  }, []);

  const toggleTimelineHidden = useCallback((droneId: string) => {
    setState(prev => ({
      ...prev,
      drones: prev.drones.map(d => d.id === droneId ? { ...d, timelineHidden: !d.timelineHidden } : d),
    }));
  }, []);

  const updateDroneName = useCallback((droneId: string, newName: string) => {
    setState(prev => ({
      ...prev,
      drones: prev.drones.map(drone =>
        drone.id === droneId
          ? { ...drone, name: newName }
          : drone
      ),
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getActiveDrone = useCallback(() => {
    return state.drones.find(drone => drone.id === state.activeDroneId) || null;
  }, [state.drones, state.activeDroneId]);

  const getVisibleDrones = useCallback(() => {
    return state.drones.filter(drone => drone.visible);
  }, [state.drones]);

  return {
    ...state,
    addDrone,
    removeDrone,
    setActiveDrone,
    toggleDroneVisibility,
    addToTimeline,
    removeFromTimeline,
    toggleTimelineHidden,
    updateDroneName,
    clearError,
    getActiveDrone,
    getVisibleDrones,
  };
}
