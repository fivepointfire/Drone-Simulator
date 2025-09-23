import React from 'react';

interface SceneControlsProps {
  config: {
    showGrid: boolean;
    showAxes: boolean;
    showFlightPaths: boolean;
    cameraMode: 'free' | 'follow' | 'orbit';
    scaleFactor: number;
  };
  onChange: (config: any) => void;
  droneCount: number;
}

export function SceneControls({ config, onChange, droneCount }: SceneControlsProps) {
  const handleToggle = (key: string) => {
    onChange({ ...config, [key]: !config[key as keyof typeof config] });
  };

  const handleCameraModeChange = (mode: 'free' | 'follow' | 'orbit') => {
    onChange({ ...config, cameraMode: mode });
  };

  const handleScaleChange = (scale: number) => {
    onChange({ ...config, scaleFactor: scale });
  };

  return (
    <div className="scene-controls">
      <div className="control-group">
        <h4>Display Options</h4>
        <label className="control-item">
          <input
            type="checkbox"
            checked={config.showGrid}
            onChange={() => handleToggle('showGrid')}
          />
          <span className="control-label">Show Grid</span>
        </label>
        <label className="control-item">
          <input
            type="checkbox"
            checked={config.showAxes}
            onChange={() => handleToggle('showAxes')}
          />
          <span className="control-label">Show Axes</span>
        </label>
        <label className="control-item">
          <input
            type="checkbox"
            checked={config.showFlightPaths}
            onChange={() => handleToggle('showFlightPaths')}
          />
          <span className="control-label">Show Flight Paths</span>
        </label>
      </div>

      <div className="control-group">
        <h4>Camera Mode</h4>
        <div className="radio-group">
          <label className="control-item">
            <input
              type="radio"
              name="cameraMode"
              checked={config.cameraMode === 'free'}
              onChange={() => handleCameraModeChange('free')}
            />
            <span className="control-label">Free Camera</span>
          </label>
          <label className="control-item">
            <input
              type="radio"
              name="cameraMode"
              checked={config.cameraMode === 'follow'}
              onChange={() => handleCameraModeChange('follow')}
              disabled={droneCount === 0}
            />
            <span className="control-label">Follow Drone</span>
          </label>
          <label className="control-item">
            <input
              type="radio"
              name="cameraMode"
              checked={config.cameraMode === 'orbit'}
              onChange={() => handleCameraModeChange('orbit')}
              disabled={droneCount === 0}
            />
            <span className="control-label">Orbit Drone</span>
          </label>
        </div>
      </div>

      <div className="control-group">
        <h4>Scale</h4>
        <div className="scale-control">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={config.scaleFactor}
            onChange={(e) => handleScaleChange(parseInt(e.target.value))}
            className="scale-slider"
          />
          <span className="scale-value">{config.scaleFactor}x</span>
        </div>
        <div className="scale-presets">
          {[50, 100, 200, 300].map(scale => (
            <button
              key={scale}
              className={`preset-btn ${config.scaleFactor === scale ? 'active' : ''}`}
              onClick={() => handleScaleChange(scale)}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
