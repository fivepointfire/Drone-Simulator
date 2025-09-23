import React from 'react';
import { PlaybackState } from '../types/DroneTypes';
import { formatTime } from '../utils/csvLoader';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onSeek: (frameIndex: number) => void;
}

export function PlaybackControls({ 
  playbackState, 
  onPlayPause, 
  onSeek 
}: PlaybackControlsProps) {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const frameIndex = parseInt(event.target.value, 10);
    onSeek(frameIndex);
  };

  const progressPercentage = playbackState.totalFrames > 0 
    ? (playbackState.currentFrameIndex / Math.max(1, playbackState.totalFrames - 1)) * 100
    : 0;

  return (
    <div className="playback-controls">
      <button 
        className="play-pause-btn"
        onClick={onPlayPause}
        aria-label={playbackState.isPlaying ? 'Pause' : 'Play'}
      >
        {playbackState.isPlaying ? '⏸' : '▶'}
      </button>
      
      <span className="time-display current-time">
        {formatTime(playbackState.currentTime)}
      </span>
      
      <div className="slider-container">
        <input
          type="range"
          className="time-slider"
          min="0"
          max={Math.max(0, playbackState.totalFrames - 1)}
          step="1"
          value={playbackState.currentFrameIndex}
          onChange={handleSliderChange}
          style={{
            background: `linear-gradient(to right, #ffffff ${progressPercentage}%, #333333 ${progressPercentage}%)`
          }}
        />
      </div>
      
      <span className="time-display total-time">
        {formatTime(playbackState.totalTime)}
      </span>
    </div>
  );
}