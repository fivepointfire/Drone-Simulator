import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Drone } from './components/Drone';
import { Grid, Axes, FlightPath, Lights } from './components/SceneComponents';
import { AppLayout } from './components/Layout/AppLayout';
import { TimelinePanel } from './components/Timeline/TimelinePanel';
import { ControlPanel } from './components/Panels/ControlPanel';
import { useDroneManager } from './hooks/useDroneManager';
import { useTimeline } from './hooks/useTimeline';
import { DroneStats } from './types/DroneTypes';
import { findFrameIndexAtTime } from './utils/csvLoader';
import './App.css';

const SIMULATION_CONFIG = {
  scaleFactor: 100,
};

function App() {
  const droneManager = useDroneManager();
  const [sceneConfig, setSceneConfig] = useState({
    showGrid: true,
    showAxes: true,
    showFlightPaths: true,
    cameraMode: 'free' as 'free' | 'follow' | 'orbit',
    scaleFactor: SIMULATION_CONFIG.scaleFactor,
  });

  const activeDrone = droneManager.getActiveDrone();
  const visibleDrones = droneManager.getVisibleDrones();

  // Timeline management
  const timeline = useTimeline({
    drones: droneManager.drones,
    onTimeChange: useCallback((_time: number) => {
      // Update current time for all systems
    }, []),
  });

  // Get current frame and stats for active drone (respect per-drone offset)
  const getCurrentFrame = useCallback(() => {
    if (!activeDrone || activeDrone.frames.length === 0) return null;
    const offset = timeline.timelineState.droneOffsets[activeDrone.id] || 0;
    const effectiveTime = timeline.timelineState.currentTime - offset;
    if (effectiveTime < 0) return null;
    const lastTime = activeDrone.frames[activeDrone.frames.length - 1].time;
    if (effectiveTime > lastTime) return null;
    const frameIndex = findFrameIndexAtTime(activeDrone.frames, effectiveTime);
    return activeDrone.frames[frameIndex] || null;
  }, [activeDrone, timeline.timelineState.currentTime, timeline.timelineState.droneOffsets]);

  const getCurrentStats = useCallback((): DroneStats | null => {
    const frame = getCurrentFrame();
    if (!frame) return null;

    return {
      position: { x: frame.x, y: frame.y, z: frame.z },
      rotation: { roll: frame.roll, pitch: frame.pitch, yaw: frame.yaw },
      time: frame.time,
    };
  }, [getCurrentFrame]);

  const currentFrame = getCurrentFrame();
  const currentStats = getCurrentStats();

  // No welcome screen - always show the main interface

  // Main simulator interface
  const scenePanel = (
    <Canvas
      camera={{
        fov: 60,
        position: [300, 200, 300],
        near: 0.1,
        far: 10000,
      }}
      style={{ background: '#1e232d' }}
    >
      <Suspense fallback={null}>
        <Lights />
        
        {/* Scene elements */}
        {sceneConfig.showGrid && <Grid size={1000} divisions={50} />}
        {sceneConfig.showAxes && <Axes length={100} />}
        
        {/* Flight paths for all visible drones */}
        {sceneConfig.showFlightPaths && visibleDrones.map((drone) => (
          <FlightPath
            key={`path-${drone.id}`}
            frames={drone.frames}
            scaleFactor={sceneConfig.scaleFactor}
            color={drone.color}
            opacity={drone.id === activeDrone?.id ? 1.0 : 0.4}
          />
        ))}
        
        {/* Active drone model */}
        {currentFrame && (
          <Drone 
            frame={currentFrame} 
            scaleFactor={sceneConfig.scaleFactor} 
          />
        )}
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Suspense>
    </Canvas>
  );

  const timelinePanel = (
    <TimelinePanel
      drones={droneManager.drones}
      timelineState={timeline.timelineState}
      playbackRange={timeline.playbackRange}
      onSeekTo={timeline.seekTo}
      onPlay={timeline.play}
      onPause={timeline.pause}
      onStop={timeline.stop}
      onSetPlaybackSpeed={timeline.setPlaybackSpeed}
      onSetZoomLevel={timeline.setZoomLevel}
      onTogglePlayMode={timeline.togglePlayMode}
      onToggleLoop={timeline.toggleLoop}
      onAddMarker={timeline.addMarker}
      onRemoveMarker={timeline.removeMarker}
      onToggleDroneSelection={timeline.toggleDroneSelection}
      onSetDroneOffset={timeline.setDroneOffset}
    />
  );

  const controlPanel = (
    <ControlPanel
      drones={droneManager.drones}
      activeDroneId={droneManager.activeDroneId}
      isLoading={droneManager.isLoading}
      error={droneManager.error}
      onAddDrone={droneManager.addDrone}
      onRemoveDrone={droneManager.removeDrone}
      onSetActiveDrone={droneManager.setActiveDrone}
      onToggleVisibility={droneManager.toggleDroneVisibility}
      onUpdateName={droneManager.updateDroneName}
      onClearError={droneManager.clearError}
      currentStats={currentStats}
      timelineState={timeline.timelineState}
      sceneConfig={sceneConfig}
      onSceneConfigChange={setSceneConfig}
    />
  );

  return (
    <div className="app">
      <AppLayout
        timelinePanel={timelinePanel}
        scenePanel={scenePanel}
        controlPanel={controlPanel}
      />

      {/* Loading overlay */}
      {droneManager.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing drone data...</p>
        </div>
      )}

      {/* Error overlay */}
      {droneManager.error && (
        <div className="error-overlay">
          <div className="error-content">
            <h3>Error</h3>
            <p>{droneManager.error}</p>
            <button onClick={droneManager.clearError}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;