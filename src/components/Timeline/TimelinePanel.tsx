import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DroneInstance } from '../../types/DroneTypes';
import { TimelineState, TimelineMarker, PlaybackRange } from '../../types/TimelineTypes';
import { formatTime } from '../../utils/csvLoader';
import './TimelinePanel.css';

interface TimelinePanelProps {
  drones: DroneInstance[];
  timelineState: TimelineState;
  playbackRange: PlaybackRange;
  onSeekTo: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetPlaybackSpeed: (speed: number) => void;
  onSetZoomLevel: (zoom: number) => void;
  onTogglePlayMode: () => void;
  onToggleLoop: () => void;
  onAddMarker: (time: number, label: string, type?: TimelineMarker['type']) => void;
  onRemoveMarker: (markerId: string) => void;
  onToggleDroneSelection: (droneId: string) => void;
}

export function TimelinePanel({
  drones,
  timelineState,
  playbackRange,
  onSeekTo,
  onPlay,
  onPause,
  onStop,
  onSetPlaybackSpeed,
  onSetZoomLevel,
  onTogglePlayMode,
  onToggleLoop,
  onAddMarker,
  onRemoveMarker,
  onToggleDroneSelection,
}: TimelinePanelProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [showMarkerDialog, setShowMarkerDialog] = useState(false);
  const [markerDialogTime, setMarkerDialogTime] = useState(0);
  const [newMarkerLabel, setNewMarkerLabel] = useState('');
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportOffset, setViewportOffset] = useState(0); // Timeline panning offset

  const timelineWidth = Math.max(800, viewportWidth - 350); // Fixed width based on viewport
  const effectiveWidth = timelineWidth; // Width stays constant, zoom affects time scale
  const pixelsPerSecond = effectiveWidth / Math.max(timelineState.totalTime, 1);

  const timeToPixels = useCallback((time: number) => {
    // Calculate visible time range based on zoom level
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const visibleTimeRange = baseTimeRange / timelineState.zoomLevel;
    const pixelPosition = (time / baseTimeRange) * effectiveWidth * timelineState.zoomLevel;
    return pixelPosition - viewportOffset;
  }, [timelineState.totalTime, timelineState.zoomLevel, effectiveWidth, viewportOffset]);

  const pixelsToTime = useCallback((pixels: number) => {
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const adjustedPixels = pixels + viewportOffset;
    return (adjustedPixels / (effectiveWidth * timelineState.zoomLevel)) * baseTimeRange;
  }, [timelineState.totalTime, timelineState.zoomLevel, effectiveWidth, viewportOffset]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x);
    
    if (e.shiftKey) {
      // Add marker when Shift+Click
      setMarkerDialogTime(time);
      setShowMarkerDialog(true);
    } else {
      // Seek to time
      onSeekTo(Math.max(0, Math.min(time, timelineState.totalTime)));
    }
  }, [pixelsToTime, onSeekTo, timelineState.totalTime]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStartX(e.clientX);
      if (!e.shiftKey) {
        handleTimelineClick(e);
      }
    }
  }, [handleTimelineClick]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    
    if (e.shiftKey) {
      // Panning mode
      const baseTimeRange = Math.max(timelineState.totalTime, 60);
      const maxOffset = (effectiveWidth * timelineState.zoomLevel) - effectiveWidth;
      const newOffset = Math.max(0, Math.min(maxOffset, viewportOffset - deltaX));
      setViewportOffset(newOffset);
      setDragStartX(e.clientX);
    } else {
      // Seeking mode
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = pixelsToTime(x);
      onSeekTo(Math.max(0, Math.min(time, timelineState.totalTime)));
    }
  }, [isDragging, dragStartX, pixelsToTime, onSeekTo, timelineState.totalTime, viewportOffset, effectiveWidth, timelineState.zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Auto-pan timeline to follow current time
  useEffect(() => {
    const currentTimePixel = timeToPixels(timelineState.currentTime);
    const margin = effectiveWidth * 0.1; // 10% margin from edges
    
    if (currentTimePixel < margin) {
      // Pan left to show current time
      const newOffset = Math.max(0, viewportOffset - (margin - currentTimePixel));
      setViewportOffset(newOffset);
    } else if (currentTimePixel > effectiveWidth - margin) {
      // Pan right to show current time
      const baseTimeRange = Math.max(timelineState.totalTime, 60);
      const maxOffset = (effectiveWidth * timelineState.zoomLevel) - effectiveWidth;
      const newOffset = Math.min(maxOffset, viewportOffset + (currentTimePixel - (effectiveWidth - margin)));
      setViewportOffset(newOffset);
    }
  }, [timelineState.currentTime, timelineState.zoomLevel, effectiveWidth, viewportOffset, timeToPixels]);

  // Handle window resize for responsive timeline
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = 1.1;
    const currentZoom = timelineState.zoomLevel;
    
    let newZoom;
    if (e.deltaY < 0) {
      // Zoom in
      newZoom = Math.min(currentZoom * zoomFactor, 20);
    } else {
      // Zoom out
      newZoom = Math.max(currentZoom / zoomFactor, 0.1);
    }
    
    onSetZoomLevel(newZoom);
  }, [timelineState.zoomLevel, onSetZoomLevel]);

  const handleAddMarker = () => {
    if (newMarkerLabel.trim()) {
      onAddMarker(markerDialogTime, newMarkerLabel.trim(), 'bookmark');
      setNewMarkerLabel('');
      setShowMarkerDialog(false);
    }
  };

  const renderTimeRuler = () => {
    // Calculate visible time range based on zoom and viewport
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const totalPixelWidth = effectiveWidth * timelineState.zoomLevel;
    const pixelsPerSecond = totalPixelWidth / baseTimeRange;
    const minPixelsBetweenLabels = 80; // Minimum pixels between labels to prevent overlap
    
    // Calculate the minimum time step needed to avoid overlap
    const minTimeStep = minPixelsBetweenLabels / pixelsPerSecond;
    
    // Calculate visible time range in the current viewport
    const startTime = (viewportOffset / totalPixelWidth) * baseTimeRange;
    const endTime = ((viewportOffset + effectiveWidth) / totalPixelWidth) * baseTimeRange;
    
    // Define nice time intervals in seconds (more granular for better zoom support)
    const niceIntervals = [
      0.01, 0.02, 0.05, 0.1, 0.2, 0.5, // Fine intervals for high zoom
      1, 2, 5, 10, 15, 30, // Sub-minute intervals
      60, 120, 300, 600, 900, 1800, // 1min, 2min, 5min, 10min, 15min, 30min
      3600, 7200, 10800, 21600, 43200, 86400 // 1hr, 2hr, 3hr, 6hr, 12hr, 24hr
    ];
    
    // Find the smallest nice interval that's larger than our minimum
    let timeStep = niceIntervals.find(interval => interval >= minTimeStep) || niceIntervals[niceIntervals.length - 1];
    
    // Generate major tick marks
    const majorTicks = [];
    const minorTicks = [];
    
    // Calculate minor tick interval with better granularity
    let minorStep = timeStep;
    if (timeStep >= 60) {
      minorStep = timeStep / 10; // For minutes/hours, use 1/10
    } else if (timeStep >= 10) {
      minorStep = timeStep / 5; // For 10+ seconds, use 1/5
    } else if (timeStep >= 1) {
      minorStep = timeStep / 5; // For 1+ seconds, use 1/5
    } else if (timeStep >= 0.1) {
      minorStep = timeStep / 5; // For 0.1+ seconds, use 1/5
    } else {
      minorStep = timeStep / 2; // For very fine intervals, use 1/2
    }
    
    // Generate major ticks for visible time range
    const startTick = Math.floor(startTime / timeStep) * timeStep;
    const endTick = Math.ceil(endTime / timeStep) * timeStep;
    
    for (let time = startTick; time <= endTick; time += timeStep) {
      const x = timeToPixels(time);
      
      // Only render if visible in viewport
      if (x >= -50 && x <= effectiveWidth + 50) {
        majorTicks.push(
          <div key={`major-${time}`} className="time-tick major">
            <div 
              className="tick-line major"
              style={{ left: x }}
            />
            <div 
              className="tick-label"
              style={{ left: x }}
            >
              {formatTime(time)}
            </div>
          </div>
        );
      }
    }
    
    // Generate minor ticks (only if zoom level is high enough)
    if (pixelsPerSecond > 2) { // Show minor ticks when zoomed in enough
      const startMinorTick = Math.floor(startTime / minorStep) * minorStep;
      const endMinorTick = Math.ceil(endTime / minorStep) * minorStep;
      
      for (let time = startMinorTick; time <= endMinorTick; time += minorStep) {
        // Skip if this coincides with a major tick
        if (Math.abs(time % timeStep) > 0.001) { // Use small epsilon for floating point comparison
          const x = timeToPixels(time);
          
          // Only render if visible in viewport
          if (x >= -10 && x <= effectiveWidth + 10) {
            minorTicks.push(
              <div key={`minor-${time}`} className="time-tick minor">
                <div 
                  className="tick-line minor"
                  style={{ left: x }}
                />
              </div>
            );
          }
        }
      }
    }
    
    return [...minorTicks, ...majorTicks];
  };

  const renderMarkers = () => {
    return timelineState.markers.map(marker => (
      <div
        key={marker.id}
        className={`timeline-marker ${marker.type}`}
        style={{
          left: timeToPixels(marker.time),
          borderColor: marker.color,
        }}
        title={`${marker.label} (${formatTime(marker.time)})`}
        onDoubleClick={() => onRemoveMarker(marker.id)}
      >
        <div className="marker-line" style={{ backgroundColor: marker.color }} />
        <div className="marker-label">{marker.label}</div>
      </div>
    ));
  };

  const renderDroneTracks = () => {
    return drones.map((drone, index) => {
      const isSelected = timelineState.selectedDrones.includes(drone.id);
      const trackHeight = 40;
      const y = index * (trackHeight + 2);
      
      // Calculate the track width and position based on viewport
      const droneStartTime = drone.frames[0]?.time || 0;
      const droneEndTime = drone.frames[drone.frames.length - 1]?.time || 0;
      
      const startX = timeToPixels(droneStartTime);
      const endX = timeToPixels(droneEndTime);
      const trackWidth = Math.max(0, endX - startX);
      
      // Only render if the track is visible in the viewport
      if (endX < -50 || startX > effectiveWidth + 50) {
        return null;
      }
      
      return (
        <div
          key={drone.id}
          className={`drone-track ${isSelected ? 'selected' : ''}`}
          style={{ 
            top: y,
            left: Math.max(0, startX),
            width: trackWidth,
            height: trackHeight,
            backgroundColor: `${drone.color}20`,
            borderLeft: `3px solid ${drone.color}`,
          }}
          onClick={() => onToggleDroneSelection(drone.id)}
        >
          <div className="track-header">
            <div 
              className="track-color"
              style={{ backgroundColor: drone.color }}
            />
            <span className="track-name">{drone.name}</span>
            <span className="track-duration">
              {drone.frames.length > 0 ? formatTime(drone.frames[drone.frames.length - 1].time) : '0:00.0000'}
            </span>
          </div>
          
          {/* Drone flight path visualization */}
          <div className="track-content">
            {drone.frames.length > 1 && (
              <div 
                className="flight-bar"
                style={{
                  width: timeToPixels(drone.frames[drone.frames.length - 1].time),
                  background: `linear-gradient(90deg, ${drone.color}40, ${drone.color}80)`,
                }}
              />
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="timeline-panel-container">
      {/* Timeline Controls */}
      <div className="timeline-controls">
        <div className="playback-controls">
          <button 
            className="control-btn"
            onClick={onStop}
            title="Stop"
          >
            ⏹️
          </button>
          <button 
            className="control-btn"
            onClick={timelineState.isPlaying ? onPause : onPlay}
            title={timelineState.isPlaying ? 'Pause' : 'Play'}
          >
            {timelineState.isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="speed-control">
            <label>Speed:</label>
            <select 
              value={timelineState.playbackSpeed}
              onChange={(e) => onSetPlaybackSpeed(parseFloat(e.target.value))}
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1x</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2x</option>
              <option value={4.0}>4x</option>
            </select>
          </div>
          
          <button 
            className={`control-btn ${timelineState.playMode === 'synchronous' ? 'active' : ''}`}
            onClick={onTogglePlayMode}
            title={`Mode: ${timelineState.playMode === 'simultaneous' ? 'Simultaneous' : 'Synchronous'}`}
          >
            {timelineState.playMode === 'simultaneous' ? '⏯️' : '🔄'}
          </button>
          
          <button 
            className={`control-btn ${timelineState.loopEnabled ? 'active' : ''}`}
            onClick={onToggleLoop}
            title="Toggle Loop"
          >
            🔁
          </button>
        </div>

        <div className="timeline-info">
          <span className="current-time">{formatTime(timelineState.currentTime)}</span>
          <span className="separator">/</span>
          <span className="total-time">{formatTime(timelineState.totalTime)}</span>
        </div>

        <div className="zoom-display">
          <span>Zoom: {timelineState.zoomLevel.toFixed(1)}x</span>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="timeline-container" onWheel={handleWheel}>
        <div className="timeline-tracks-container">
          {drones.length > 0 ? (
            <>
              {/* Time Ruler */}
              <div className="time-ruler">
                {renderTimeRuler()}
              </div>

              {/* Timeline Canvas */}
              <div 
                className="timeline-canvas"
                ref={timelineRef}
                onMouseDown={handleMouseDown}
                style={{ 
                  width: '100%'
                }}
              >
                {/* Current Time Indicator */}
                <div 
                  className="current-time-indicator"
                  style={{ left: timeToPixels(timelineState.currentTime) }}
                >
                  <div className="time-line" />
                  <div className="time-handle" />
                </div>

                {/* Markers */}
                {renderMarkers()}

                {/* Drone Tracks */}
                <div className="drone-tracks">
                  {renderDroneTracks()}
                </div>
              </div>
            </>
          ) : (
            <div className="no-drones-message">
              <p>No drones loaded. Upload CSV files to see timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Marker Dialog */}
      {showMarkerDialog && (
        <div className="marker-dialog-overlay">
          <div className="marker-dialog">
            <h3>Add Marker</h3>
            <p>Time: {formatTime(markerDialogTime)}</p>
            <input
              type="text"
              placeholder="Marker label"
              value={newMarkerLabel}
              onChange={(e) => setNewMarkerLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMarker()}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={handleAddMarker} disabled={!newMarkerLabel.trim()}>
                Add
              </button>
              <button onClick={() => setShowMarkerDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
