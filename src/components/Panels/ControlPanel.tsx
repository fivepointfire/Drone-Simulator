import { useState } from 'react';
import { DroneInstance } from '../../types/DroneTypes';
import { TimelineState } from '../../types/TimelineTypes';
import { StatsDisplay } from '../StatsDisplay';
import { SceneControls } from './SceneControls';
import './ControlPanel.css';

interface ControlPanelProps {
  // Drone Manager Props
  drones: DroneInstance[];
  activeDroneId: string | null;
  isLoading: boolean;
  error: string | null;
  onAddDrone: (file: File) => Promise<DroneInstance>;
  onRemoveDrone: (droneId: string) => void;
  onSetActiveDrone: (droneId: string | null) => void;
  onToggleVisibility: (droneId: string) => void;
  onUpdateName: (droneId: string, newName: string) => void;
  onClearError: () => void;
  // Timeline lifecycle actions
  onAddToTimeline: (droneId: string) => void;
  onRemoveFromTimeline: (droneId: string) => void;
  onToggleTimelineHidden: (droneId: string) => void;
  
  // Stats and Timeline
  currentStats: any;
  timelineState: TimelineState;
  
  // Scene Controls
  sceneConfig: {
    showGrid: boolean;
    showAxes: boolean;
    showFlightPaths: boolean;
    cameraMode: 'free' | 'follow';
    scaleFactor: number;
  };
  onSceneConfigChange: (config: any) => void;
}

type PanelSection = 'drones' | 'stats' | 'scene';

export function ControlPanel({
  drones,
  activeDroneId,
  isLoading,
  error,
  onAddDrone,
  onRemoveDrone,
  onSetActiveDrone,
  onToggleVisibility,
  onUpdateName: _onUpdateName,
  onClearError,
  onAddToTimeline,
  onRemoveFromTimeline,
  onToggleTimelineHidden,
  currentStats,
  timelineState,
  sceneConfig,
  onSceneConfigChange,
}: ControlPanelProps) {
  const [activeSection, setActiveSection] = useState<PanelSection>('drones');
  const [collapsedSections, setCollapsedSections] = useState<Set<PanelSection>>(new Set());

  const toggleSection = (section: PanelSection) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const renderSectionHeader = (section: PanelSection, title: string, icon: string) => {
    const isCollapsed = collapsedSections.has(section);
    const isActive = activeSection === section;
    
    return (
      <div 
        className={`section-header ${isActive ? 'active' : ''}`}
        onClick={() => {
          setActiveSection(section);
          if (isCollapsed) {
            toggleSection(section);
          }
        }}
      >
        <div className="section-title">
          <span className="section-icon">{icon}</span>
          <span className="section-name">{title}</span>
          <span className="section-count">
            {section === 'drones' && `(${drones.length})`}
            {section === 'stats' && currentStats && '●'}
          </span>
        </div>
        <button
          className="collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleSection(section);
          }}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
      </div>
    );
  };

  return (
    <div className="control-panel-container">
      {/* Drone Manager Section */}
      <div className="panel-section">
        {renderSectionHeader('drones', 'Drone Manager', '▶')}
        {!collapsedSections.has('drones') && (
          <div className="section-content">
            <div className="integrated-drone-manager">
                    {error && (
                      <div className="error-message">
                        <span className="error-icon">!</span>
                  <span>{error}</span>
                  <button onClick={onClearError} className="clear-error">×</button>
                </div>
              )}

              {/* File Upload */}
              <div className="upload-section">
                <div className="upload-area">
                      <div className="upload-icon">+</div>
                  <p>Upload CSV Files</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onAddDrone(file);
                    }}
                    className="file-input"
                    id="drone-file-input"
                  />
                  <label htmlFor="drone-file-input" className="upload-button">
                    Choose CSV File
                  </label>
                </div>
              </div>

              {/* Drone List */}
              {drones.length > 0 && (
                <div className="drone-list-section">
                  <h4>Loaded Drones ({drones.length})</h4>
                  <div className="drone-list">
                    {drones.map((drone) => (
                      <div
                        key={drone.id}
                        className={`drone-item ${activeDroneId === drone.id ? 'active' : ''}`}
                      >
                        <div className="drone-info">
                          <div
                            className="drone-color-indicator"
                            style={{ backgroundColor: drone.color }}
                          />
                          <span className="drone-name">{drone.name}</span>
                          <span className="drone-frames">
                            {drone.frames.length} frames
                          </span>
                        </div>

                        <div className="drone-controls">
                          <button
                            className={`visibility-btn ${drone.visible ? 'visible' : 'hidden'}`}
                            onClick={() => onToggleVisibility(drone.id)}
                                  title={drone.visible ? 'Hide drone' : 'Show drone'}
                                >
                                  {drone.visible ? '●' : '○'}
                          </button>

                      {/* Timeline lifecycle */}
                      {!drone.inTimeline ? (
                        <button
                          className="select-btn"
                          onClick={() => onAddToTimeline(drone.id)}
                          title="Add to timeline"
                        >
                          ➕
                        </button>
                      ) : (
                        <>
                          <button
                            className={`select-btn ${drone.timelineHidden ? '' : 'selected'}`}
                            onClick={() => onToggleTimelineHidden(drone.id)}
                            title={drone.timelineHidden ? 'Show track' : 'Hide track'}
                          >
                            {drone.timelineHidden ? '🙈' : '👁️'}
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => onRemoveFromTimeline(drone.id)}
                            title="Remove from timeline"
                          >
                            −
                          </button>
                        </>
                      )}

                          <button
                            className={`select-btn ${activeDroneId === drone.id ? 'selected' : ''}`}
                            onClick={() => onSetActiveDrone(drone.id)}
                                  title="Set as active drone"
                                >
                                  {activeDroneId === drone.id ? '●' : '○'}
                          </button>

                          <button
                            className="remove-btn"
                            onClick={() => onRemoveDrone(drone.id)}
                                  title="Remove drone"
                                >
                                  ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Loading drone data...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      <div className="panel-section">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">📊</span>
            <span className="section-name">Analytics</span>
          </div>
        </div>
        <div className="section-content">
          <div className="analytics-section">
            <button 
              className="analytics-btn"
              onClick={() => {
                // Prepare drone data for analytics
                const analyticsData = drones
                  .filter(drone => drone.frames.length > 0)
                  .map(drone => ({
                    name: drone.name,
                    color: drone.color,
                    frames: drone.frames.map(frame => ({
                      drone_x: frame.x,
                      drone_y: frame.y,
                      drone_z: frame.z,
                      drone_roll: frame.roll,
                      drone_pitch: frame.pitch,
                      drone_yaw: frame.yaw,
                      elapsed_time: frame.time
                    }))
                  }));
                
                // Open analytics with data
                const analyticsWindow = window.open('/analytics.html', '_blank', 'width=1400,height=900');
                
                // Wait for analytics window to load, then send data
                if (analyticsWindow) {
                  const sendData = () => {
                    try {
                      analyticsWindow.postMessage({
                        type: 'LOAD_DRONE_DATA',
                        data: analyticsData
                      }, '*');
                    } catch (error) {
                      console.warn('Failed to send data to analytics window:', error);
                    }
                  };
                  
                  // Try sending data after window loads
                  setTimeout(sendData, 1000);
                  // Retry mechanism in case first attempt fails
                  setTimeout(sendData, 2000);
                }
              }}
              title={drones.length === 0 ? "Load drone data first" : "Open analytics dashboard with loaded data"}
              disabled={drones.length === 0}
            >
              📈 Open Analytics Dashboard
              {drones.length > 0 ? ` (${drones.length} drones)` : ''}
            </button>
            <p className="analytics-description">
              {drones.length === 0 
                ? "Load CSV drone data to enable analytics" 
                : `View charts and statistics for ${drones.length} loaded drone${drones.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="panel-section">
        {renderSectionHeader('stats', 'Telemetry', '▣')}
        {!collapsedSections.has('stats') && (
          <div className="section-content">
            {currentStats ? (
              <StatsDisplay stats={currentStats} />
            ) : (
              <div className="no-data-message">
                <p>No active drone selected</p>
                <small>Select a drone to view telemetry data</small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scene Controls Section */}
      <div className="panel-section">
        {renderSectionHeader('scene', 'Scene', '🎬')}
        {!collapsedSections.has('scene') && (
          <div className="section-content">
            <SceneControls
              config={sceneConfig}
              onChange={onSceneConfigChange}
              droneCount={drones.length}
            />
          </div>
        )}
      </div>

      {/* Synchronization Section removed */}

      {/* Quick Actions */}
      <div className="panel-section quick-actions">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">⚡</span>
            <span className="section-name">Quick Actions</span>
          </div>
        </div>
        <div className="section-content">
          <div className="quick-action-grid">
            <button 
              className="quick-action-btn"
              onClick={() => {
                // Reset all drone positions to start
                console.log('Reset to start');
              }}
              title="Reset all drones to start"
            >
              ⏮️ Reset
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => {
                // Center camera on active drone
                console.log('Center camera');
              }}
              title="Center camera on active drone"
            >
              🎯 Center
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => {
                // Export timeline data
                console.log('Export data');
              }}
              title="Export timeline data"
            >
              💾 Export
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => {
                // Take screenshot
                console.log('Screenshot');
              }}
              title="Take screenshot"
            >
              📷 Capture
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="timeline-summary">
        <h4>Timeline Summary</h4>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Duration:</span>
            <span className="stat-value">{(timelineState.totalTime / 60).toFixed(2)}m</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Drones:</span>
            <span className="stat-value">{drones.filter(d => d.visible).length}/{drones.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Play Mode:</span>
            <span className="stat-value">{timelineState.playMode}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Speed:</span>
            <span className="stat-value">{timelineState.playbackSpeed}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
