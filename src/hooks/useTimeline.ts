import { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineState, TimelineMarker, PlaybackRange } from '../types/TimelineTypes';
import { DroneInstance } from '../types/DroneTypes';
import { findFrameIndexAtTime } from '../utils/csvLoader';

interface UseTimelineOptions {
  drones: DroneInstance[];
  onTimeChange: (time: number) => void;
}

export function useTimeline({ drones, onTimeChange }: UseTimelineOptions) {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    totalTime: 0,
    isPlaying: false,
    playbackSpeed: 1.0,
    zoomLevel: 1.0,
    viewportStart: 0,
    viewportEnd: 100,
    selectedDrones: [],
    playMode: 'simultaneous',
    loopEnabled: false,
    markers: [],
  });

  const [playbackRange, setPlaybackRange] = useState<PlaybackRange>({
    start: 0,
    end: 0,
    enabled: false,
  });

  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Calculate total timeline duration from all drones
  const calculateTotalTime = useCallback(() => {
    if (drones.length === 0) return 0;
    
    if (timelineState.playMode === 'simultaneous') {
      // In simultaneous mode, use the longest drone duration
      return Math.max(...drones.map(drone => 
        drone.frames.length > 0 ? drone.frames[drone.frames.length - 1].time : 0
      ));
    } else {
      // In synchronous mode, sum all drone durations
      return drones.reduce((total, drone) => 
        total + (drone.frames.length > 0 ? drone.frames[drone.frames.length - 1].time : 0), 0
      );
    }
  }, [drones, timelineState.playMode]);

  // Update total time when drones or play mode changes
  useEffect(() => {
    const totalTime = calculateTotalTime();
    setTimelineState(prev => ({
      ...prev,
      totalTime,
      viewportEnd: Math.max(totalTime, 100),
    }));
    
    setPlaybackRange(prev => ({
      ...prev,
      end: totalTime,
    }));
  }, [calculateTotalTime]);

  // Animation loop
  useEffect(() => {
    if (!timelineState.isPlaying || timelineState.totalTime === 0) {
      return;
    }

    const animate = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000 * timelineState.playbackSpeed;
      const effectiveEndTime = playbackRange.enabled ? playbackRange.end : timelineState.totalTime;
      
      let newTime = (pausedTimeRef.current || 0) + elapsed;

      if (newTime > effectiveEndTime) {
        if (timelineState.loopEnabled) {
          // Loop back to start or range start
          const startTime = playbackRange.enabled ? playbackRange.start : 0;
          newTime = startTime;
          startTimeRef.current = performance.now();
          pausedTimeRef.current = startTime;
        } else {
          // Stop at end
          newTime = effectiveEndTime;
          setTimelineState(prev => ({ ...prev, isPlaying: false }));
        }
      }

      setTimelineState(prev => ({ ...prev, currentTime: newTime }));
      onTimeChange(newTime);

      if (timelineState.isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timelineState.isPlaying, timelineState.playbackSpeed, timelineState.totalTime, 
      timelineState.loopEnabled, playbackRange, onTimeChange]);

  const play = useCallback(() => {
    startTimeRef.current = performance.now();
    setTimelineState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    pausedTimeRef.current = timelineState.currentTime;
    setTimelineState(prev => ({ ...prev, isPlaying: false }));
  }, [timelineState.currentTime]);

  const stop = useCallback(() => {
    const startTime = playbackRange.enabled ? playbackRange.start : 0;
    pausedTimeRef.current = startTime;
    setTimelineState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: startTime 
    }));
    onTimeChange(startTime);
  }, [playbackRange, onTimeChange]);

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timelineState.totalTime));
    pausedTimeRef.current = clampedTime;
    
    if (timelineState.isPlaying) {
      startTimeRef.current = performance.now();
    }
    
    setTimelineState(prev => ({ ...prev, currentTime: clampedTime }));
    onTimeChange(clampedTime);
  }, [timelineState.totalTime, timelineState.isPlaying, onTimeChange]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.1, Math.min(4.0, speed));
    setTimelineState(prev => ({ ...prev, playbackSpeed: clampedSpeed }));
  }, []);

  const setZoomLevel = useCallback((zoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(10.0, zoom));
    setTimelineState(prev => ({ ...prev, zoomLevel: clampedZoom }));
  }, []);

  const setViewport = useCallback((start: number, end: number) => {
    setTimelineState(prev => ({
      ...prev,
      viewportStart: Math.max(0, start),
      viewportEnd: Math.min(timelineState.totalTime, end),
    }));
  }, [timelineState.totalTime]);

  const togglePlayMode = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      playMode: prev.playMode === 'simultaneous' ? 'synchronous' : 'simultaneous',
    }));
  }, []);

  const toggleLoop = useCallback(() => {
    setTimelineState(prev => ({ ...prev, loopEnabled: !prev.loopEnabled }));
  }, []);

  const addMarker = useCallback((time: number, label: string, type: TimelineMarker['type'] = 'bookmark') => {
    const marker: TimelineMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time,
      label,
      color: type === 'event' ? '#ff5050' : type === 'sync' ? '#50ff50' : '#4cafef',
      type,
    };

    setTimelineState(prev => ({
      ...prev,
      markers: [...prev.markers, marker].sort((a, b) => a.time - b.time),
    }));
  }, []);

  const removeMarker = useCallback((markerId: string) => {
    setTimelineState(prev => ({
      ...prev,
      markers: prev.markers.filter(marker => marker.id !== markerId),
    }));
  }, []);

  const updatePlaybackRange = useCallback((range: PlaybackRange) => {
    setPlaybackRange(range);
  }, []);

  const toggleDroneSelection = useCallback((droneId: string) => {
    setTimelineState(prev => ({
      ...prev,
      selectedDrones: prev.selectedDrones.includes(droneId)
        ? prev.selectedDrones.filter(id => id !== droneId)
        : [...prev.selectedDrones, droneId],
    }));
  }, []);

  return {
    timelineState,
    playbackRange,
    play,
    pause,
    stop,
    seekTo,
    setPlaybackSpeed,
    setZoomLevel,
    setViewport,
    togglePlayMode,
    toggleLoop,
    addMarker,
    removeMarker,
    updatePlaybackRange,
    toggleDroneSelection,
  };
}
