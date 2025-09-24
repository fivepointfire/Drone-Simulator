import { Suspense, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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
    cameraMode: 'free' as 'free' | 'follow',
    scaleFactor: SIMULATION_CONFIG.scaleFactor,
  });

  const activeDrone = droneManager.getActiveDrone();
  const visibleDrones = droneManager.getVisibleDrones();
  const timelineDrones = droneManager.drones.filter(d => d.inTimeline);

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

  // Camera controller to implement camera modes
  function CameraController() {
    const { camera } = useThree();
    const [theta, setTheta] = useState(0);

    useFrame((_state, delta) => {
      if (!activeDrone || !currentFrame) return;
      if (sceneConfig.cameraMode === 'follow') {
        // Simple follow: place camera behind and above the drone
        const target = [currentFrame.x * sceneConfig.scaleFactor, -currentFrame.y * sceneConfig.scaleFactor, currentFrame.z * sceneConfig.scaleFactor] as const;
        const offset = [150, 80, 150] as const;
        camera.position.set(target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]);
        camera.lookAt(target[0], target[1], target[2]);
      }
      // 'free' mode leaves camera under OrbitControls
    });
    return null;
  }

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
        <CameraController />
        
        {/* Scene elements */}
        {sceneConfig.showGrid && <Grid size={1000} divisions={50} />}
        {sceneConfig.showAxes && <Axes length={100} />}
        
        {/* Flight paths for timeline drones */}
        {sceneConfig.showFlightPaths && timelineDrones.map((drone) => (
          <FlightPath
            key={`path-${drone.id}`}
            frames={drone.frames}
            scaleFactor={sceneConfig.scaleFactor}
            color={drone.color}
            opacity={1.0}
          />
        ))}
        
        {/* Render all drones currently active on the timeline at their effective time */}
        {timelineDrones.map(drone => {
          const offset = timeline.timelineState.droneOffsets[drone.id] || 0;
          const effectiveTime = timeline.timelineState.currentTime - offset;
          if (effectiveTime < 0) return null;
          const lastTime = drone.frames[drone.frames.length - 1]?.time ?? 0;
          if (effectiveTime > lastTime) return null;
          const frameIndex = findFrameIndexAtTime(drone.frames, effectiveTime);
          const frame = drone.frames[frameIndex];
          return (
            <Drone key={`drone-${drone.id}`} frame={frame} scaleFactor={sceneConfig.scaleFactor} />
          );
        })}
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={sceneConfig.cameraMode === 'free'}
          enableZoom={true}
          enableRotate={sceneConfig.cameraMode === 'free'}
          enableDamping={true}
          dampingFactor={0.08}
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
      onAddToTimeline={droneManager.addToTimeline}
      onRemoveFromTimeline={droneManager.removeFromTimeline}
      onToggleTimelineHidden={droneManager.toggleTimelineHidden}
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