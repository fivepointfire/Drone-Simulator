import { useState, useEffect, useCallback, useRef } from 'react';
import { DroneFrame, PlaybackState, DroneStats, DroneInstance } from '../types/DroneTypes';
import { findFrameIndexAtTime } from '../utils/csvLoader';

interface UseSimulationOptions {
  activeDrone: DroneInstance | null;
  scaleFactor: number;
}

export function useSimulation({ activeDrone, scaleFactor }: UseSimulationOptions) {
  const frames = activeDrone?.frames || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: true,
    currentTime: 0,
    totalTime: 0,
    currentFrameIndex: 0,
    totalFrames: 0,
  });

  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Update playback state when active drone changes
  useEffect(() => {
    if (activeDrone && activeDrone.frames.length > 0) {
      const totalTime = activeDrone.frames[activeDrone.frames.length - 1].time;
      setPlaybackState(prev => ({
        ...prev,
        totalTime,
        totalFrames: activeDrone.frames.length,
        currentTime: 0,
        currentFrameIndex: 0,
        isPlaying: false, // Pause when switching drones
      }));
      
      startTimeRef.current = performance.now();
      pausedTimeRef.current = 0;
    } else {
      // No active drone
      setPlaybackState(prev => ({
        ...prev,
        totalTime: 0,
        totalFrames: 0,
        currentTime: 0,
        currentFrameIndex: 0,
        isPlaying: false,
      }));
    }
  }, [activeDrone]);

  // Animation loop
  useEffect(() => {
    if (!playbackState.isPlaying || frames.length === 0 || loading) {
      return;
    }

    const animate = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const totalDuration = playbackState.totalTime;

      if (elapsed > totalDuration && totalDuration > 0) {
        // Loop back to start
        startTimeRef.current = performance.now();
        setPlaybackState(prev => ({
          ...prev,
          currentTime: 0,
          currentFrameIndex: 0,
        }));
      } else {
        const frameIndex = findFrameIndexAtTime(frames, elapsed);
        const currentTime = frames[frameIndex]?.time || 0;

        setPlaybackState(prev => ({
          ...prev,
          currentTime,
          currentFrameIndex: frameIndex,
        }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState.isPlaying, frames, playbackState.totalTime, loading]);

  const togglePlayPause = useCallback(() => {
    setPlaybackState(prev => {
      const newIsPlaying = !prev.isPlaying;
      
      if (newIsPlaying) {
        // Resume: adjust start time to account for paused duration
        startTimeRef.current = performance.now() - pausedTimeRef.current * 1000;
      } else {
        // Pause: store current elapsed time
        pausedTimeRef.current = prev.currentTime;
      }
      
      return { ...prev, isPlaying: newIsPlaying };
    });
  }, []);

  const seekToFrame = useCallback((frameIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
    const frame = frames[clampedIndex];
    
    if (frame) {
      const newTime = frame.time;
      pausedTimeRef.current = newTime;
      
      if (playbackState.isPlaying) {
        startTimeRef.current = performance.now() - newTime * 1000;
      }
      
      setPlaybackState(prev => ({
        ...prev,
        currentTime: newTime,
        currentFrameIndex: clampedIndex,
      }));
    }
  }, [frames, playbackState.isPlaying]);

  // Get current frame and stats
  const currentFrame = frames[playbackState.currentFrameIndex] || null;
  const currentStats: DroneStats | null = currentFrame ? {
    position: { x: currentFrame.x, y: currentFrame.y, z: currentFrame.z },
    rotation: { roll: currentFrame.roll, pitch: currentFrame.pitch, yaw: currentFrame.yaw },
    time: currentFrame.time,
  } : null;

  return {
    frames,
    currentFrame,
    currentStats,
    playbackState,
    loading,
    error,
    togglePlayPause,
    seekToFrame,
  };
}