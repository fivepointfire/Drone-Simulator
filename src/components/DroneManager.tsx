import React, { useState } from 'react';
import { DroneInstance } from '../types/DroneTypes';
import { FileUpload } from './FileUpload';
import './DroneManager.css';

interface DroneManagerProps {
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
}

export function DroneManager({
  drones,
  activeDroneId,
  isLoading,
  error,
  onAddDrone,
  onRemoveDrone,
  onSetActiveDrone,
  onToggleVisibility,
  onUpdateName,
  onClearError,
}: DroneManagerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingDroneId, setEditingDroneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleFileSelect = async (file: File) => {
    try {
      await onAddDrone(file);
    } catch (error) {
      // Error is handled by the drone manager hook
    }
  };

  const handleStartEdit = (drone: DroneInstance) => {
    setEditingDroneId(drone.id);
    setEditingName(drone.name);
  };

  const handleSaveEdit = () => {
    if (editingDroneId && editingName.trim()) {
      onUpdateName(editingDroneId, editingName.trim());
    }
    setEditingDroneId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingDroneId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="drone-manager">
      <div className="drone-manager-header">
        <button
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <h2>Drone Manager</h2>
        <span className="drone-count">({drones.length})</span>
      </div>

      {isExpanded && (
        <div className="drone-manager-content">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button onClick={onClearError} className="clear-error">×</button>
            </div>
          )}

          {drones.length === 0 ? (
            <div className="no-drones">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          ) : (
            <>
              <div className="add-drone-section">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>

              <div className="drone-list">
                <h3>Loaded Drones</h3>
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
                      
                      {editingDroneId === drone.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={handleSaveEdit}
                          className="drone-name-input"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="drone-name"
                          onClick={() => handleStartEdit(drone)}
                          title="Click to edit name"
                        >
                          {drone.name}
                        </span>
                      )}

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
                        {drone.visible ? '👁️' : '🙈'}
                      </button>

                      <button
                        className={`select-btn ${activeDroneId === drone.id ? 'selected' : ''}`}
                        onClick={() => onSetActiveDrone(drone.id)}
                        title="Set as active drone"
                      >
                        {activeDroneId === drone.id ? '🎯' : '○'}
                      </button>

                      <button
                        className="remove-btn"
                        onClick={() => onRemoveDrone(drone.id)}
                        title="Remove drone"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Loading drone data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
