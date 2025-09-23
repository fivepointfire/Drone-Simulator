import { DroneStats } from '../types/DroneTypes';
import './StatsDisplay.css';

interface StatsDisplayProps {
  stats: DroneStats | null;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  if (!stats) return null;

  const formatNumber = (num: number): string => num.toFixed(4);

  return (
    <div className="stats-display">
      <div className="stats-section">
        <h3>Position</h3>
        <div className="stats-row">
          <span className="label">X:</span>
          <span className="value">{formatNumber(stats.position.x)}</span>
        </div>
        <div className="stats-row">
          <span className="label">Y:</span>
          <span className="value">{formatNumber(stats.position.y)}</span>
        </div>
        <div className="stats-row">
          <span className="label">Z:</span>
          <span className="value">{formatNumber(stats.position.z)}</span>
        </div>
      </div>

      <div className="stats-section">
        <h3>Rotation</h3>
        <div className="stats-row">
          <span className="label">Roll:</span>
          <span className="value">{formatNumber(stats.rotation.roll)}</span>
        </div>
        <div className="stats-row">
          <span className="label">Pitch:</span>
          <span className="value">{formatNumber(stats.rotation.pitch)}</span>
        </div>
        <div className="stats-row">
          <span className="label">Yaw:</span>
          <span className="value">{formatNumber(stats.rotation.yaw)}</span>
        </div>
      </div>

      <div className="stats-section">
        <h3>Time</h3>
        <div className="stats-row">
          <span className="label">Elapsed:</span>
          <span className="value">{formatNumber(stats.time)}s</span>
        </div>
      </div>
    </div>
  );
}