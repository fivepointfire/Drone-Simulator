import { useState } from 'react';
import { DroneInstance } from '../../types/DroneTypes';
import { TimelineState } from '../../types/TimelineTypes';

interface SyncControlsProps {
  drones: DroneInstance[];
  timelineState: TimelineState;
  onSyncDrones: (droneIds: string[]) => void;
  onAlignToMarker: (markerId: string) => void;
}

export function SyncControls({ 
  drones, 
  timelineState, 
  onSyncDrones, 
  onAlignToMarker: _onAlignToMarker 
}: SyncControlsProps) {
  const [selectedDrones, setSelectedDrones] = useState<string[]>([]);
  const [syncMode, setSyncMode] = useState<'start' | 'current' | 'marker'>('start');

  const handleDroneSelection = (droneId: string) => {
    setSelectedDrones(prev => 
      prev.includes(droneId)
        ? prev.filter(id => id !== droneId)
        : [...prev, droneId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDrones(drones.map(d => d.id));
  };

  const handleSelectNone = () => {
    setSelectedDrones([]);
  };

  const handleSync = () => {
    if (selectedDrones.length < 2) return;
    onSyncDrones(selectedDrones);
  };

  return (
    <div className="sync-controls">
      <div className="control-group">
        <h4>Drone Selection</h4>
        <div className="selection-buttons">
          <button onClick={handleSelectAll} className="select-btn">
            Select All
          </button>
          <button onClick={handleSelectNone} className="select-btn">
            Select None
          </button>
        </div>
        <div className="drone-list">
          {drones.map(drone => (
            <label key={drone.id} className="drone-item">
              <input
                type="checkbox"
                checked={selectedDrones.includes(drone.id)}
                onChange={() => handleDroneSelection(drone.id)}
              />
              <div className="drone-info">
                <div 
                  className="drone-color"
                  style={{ backgroundColor: drone.color }}
                />
                <span className="drone-name">{drone.name}</span>
                <span className="drone-duration">
                  {drone.frames.length > 0 
                    ? `${(drone.frames[drone.frames.length - 1].time / 60).toFixed(1)}m`
                    : '0m'
                  }
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="control-group">
        <h4>Sync Mode</h4>
        <div className="radio-group">
          <label className="control-item">
            <input
              type="radio"
              name="syncMode"
              checked={syncMode === 'start'}
              onChange={() => setSyncMode('start')}
            />
            <span className="control-label">Align to Start</span>
          </label>
          <label className="control-item">
            <input
              type="radio"
              name="syncMode"
              checked={syncMode === 'current'}
              onChange={() => setSyncMode('current')}
            />
            <span className="control-label">Align to Current Time</span>
          </label>
          <label className="control-item">
            <input
              type="radio"
              name="syncMode"
              checked={syncMode === 'marker'}
              onChange={() => setSyncMode('marker')}
              disabled={timelineState.markers.length === 0}
            />
            <span className="control-label">Align to Marker</span>
          </label>
        </div>

        {syncMode === 'marker' && timelineState.markers.length > 0 && (
          <div className="marker-selection">
            <select className="marker-select">
              {timelineState.markers.map(marker => (
                <option key={marker.id} value={marker.id}>
                  {marker.label} ({(marker.time / 60).toFixed(2)}m)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="control-group">
        <h4>Sync Actions</h4>
        <button 
          className="sync-btn primary"
          onClick={handleSync}
          disabled={selectedDrones.length < 2}
        >
          Sync Selected Drones ({selectedDrones.length})
        </button>
        
        <div className="sync-options">
          <button className="sync-btn secondary">
            Time Stretch to Match
          </button>
          <button className="sync-btn secondary">
            Trim to Shortest
          </button>
          <button className="sync-btn secondary">
            Extend to Longest
          </button>
        </div>
      </div>

      <div className="control-group">
        <h4>Auto-Sync</h4>
        <label className="control-item">
          <input type="checkbox" />
          <span className="control-label">Auto-align new drones</span>
        </label>
        <label className="control-item">
          <input type="checkbox" />
          <span className="control-label">Maintain sync during playback</span>
        </label>
      </div>
    </div>
  );
}
