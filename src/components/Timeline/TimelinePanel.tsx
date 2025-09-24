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
  onSetDroneOffset: (droneId: string, offsetSeconds: number) => void;
}

export function TimelinePanel({
  drones,
  timelineState,
  playbackRange: _playbackRange,
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
  onSetDroneOffset,
}: TimelinePanelProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [draggingTrack, setDraggingTrack] = useState<{ droneId: string; startX: number; startOffset: number; secondsPerPixel: number } | null>(null);
  const [showMarkerDialog, setShowMarkerDialog] = useState(false);
  const [markerDialogTime, setMarkerDialogTime] = useState(0);
  const [newMarkerLabel, setNewMarkerLabel] = useState('');
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportOffset, setViewportOffset] = useState(0); // Timeline panning offset

  const timelineWidth = Math.max(800, viewportWidth - 350); // Fixed width based on viewport
  const effectiveWidth = timelineWidth; // Width stays constant, zoom affects time scale
  // const pixelsPerSecond = effectiveWidth / Math.max(timelineState.totalTime, 1);

  const timeToPixels = useCallback((time: number) => {
    // Calculate visible time range based on zoom level
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    // const visibleTimeRange = baseTimeRange / timelineState.zoomLevel;
    const pixelPosition = (time / baseTimeRange) * effectiveWidth * timelineState.zoomLevel;
    return pixelPosition - viewportOffset;
  }, [timelineState.totalTime, timelineState.zoomLevel, effectiveWidth, viewportOffset]);

  const pixelsToTime = useCallback((pixels: number) => {
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const adjustedPixels = pixels + viewportOffset;
    return (adjustedPixels / (effectiveWidth * timelineState.zoomLevel)) * baseTimeRange;
  }, [timelineState.totalTime, timelineState.zoomLevel, effectiveWidth, viewportOffset]);

  // Helpers to compute tick intervals consistently (used by ruler, grid, snapping)
  const getTickIntervals = useCallback(() => {
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const totalPixelWidth = effectiveWidth * timelineState.zoomLevel;
    const pixelsPerSecond = totalPixelWidth / baseTimeRange;
    const minPixelsBetweenLabels = 80;
    const minTimeStep = minPixelsBetweenLabels / pixelsPerSecond;

    const niceIntervals = [
      0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
      1, 2, 5, 10, 15, 30,
      60, 120, 300, 600, 900, 1800,
      3600, 7200, 10800, 21600, 43200, 86400
    ];

    let timeStep = niceIntervals.find(interval => interval >= minTimeStep) || niceIntervals[niceIntervals.length - 1];

    let minorStep = timeStep;
    if (timeStep >= 60) {
      minorStep = timeStep / 10;
    } else if (timeStep >= 10) {
      minorStep = timeStep / 5;
    } else if (timeStep >= 1) {
      minorStep = timeStep / 5;
    } else if (timeStep >= 0.1) {
      minorStep = timeStep / 5;
    } else {
      minorStep = timeStep / 2;
    }

    // Visible time window for rendering
    const startTime = (viewportOffset / totalPixelWidth) * baseTimeRange;
    const endTime = ((viewportOffset + effectiveWidth) / totalPixelWidth) * baseTimeRange;

    return { timeStep, minorStep, startTime, endTime };
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
      // const baseTimeRange = Math.max(timelineState.totalTime, 60);
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
    setDraggingTrack(null);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingTrack) {
        const deltaPixels = e.clientX - draggingTrack.startX;
        // Snap deltaTime to nearest minor tick interval
        const { minorStep } = getTickIntervals();
        const rawDeltaTime = deltaPixels * draggingTrack.secondsPerPixel;
        const snappedDelta = Math.round(rawDeltaTime / minorStep) * minorStep;
        const newOffset = Math.max(0, draggingTrack.startOffset + snappedDelta);
        onSetDroneOffset(draggingTrack.droneId, newOffset);
        return;
      }
      handleMouseMove(e);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, draggingTrack, pixelsToTime, onSetDroneOffset]);

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
      // const baseTimeRange = Math.max(timelineState.totalTime, 60);
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
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, effectiveWidth));

    // Compute focal time under cursor BEFORE zoom
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const focalTime = ((mouseX + viewportOffset) / (effectiveWidth * timelineState.zoomLevel)) * baseTimeRange;

    const zoomFactor = 1.1;
    const currentZoom = timelineState.zoomLevel;
    const newZoom = e.deltaY < 0 ? Math.min(currentZoom * zoomFactor, 20) : Math.max(currentZoom / zoomFactor, 0.1);

    // Update zoom
    onSetZoomLevel(newZoom);

    // Adjust viewportOffset to keep focalTime anchored under cursor
    const totalPixelWidth = effectiveWidth * newZoom;
    let newOffset = (focalTime / baseTimeRange) * totalPixelWidth - mouseX;
    const maxOffset = Math.max(0, totalPixelWidth - effectiveWidth);
    newOffset = Math.max(0, Math.min(maxOffset, newOffset));
    setViewportOffset(newOffset);
  }, [timelineRef, effectiveWidth, timelineState.totalTime, timelineState.zoomLevel, viewportOffset, onSetZoomLevel]);

  const handleAddMarker = () => {
    if (newMarkerLabel.trim()) {
      onAddMarker(markerDialogTime, newMarkerLabel.trim(), 'bookmark');
      setNewMarkerLabel('');
      setShowMarkerDialog(false);
    }
  };

  const renderTimeRuler = () => {
    const { timeStep, minorStep, startTime, endTime } = getTickIntervals();
    const baseTimeRange = Math.max(timelineState.totalTime, 60);
    const totalPixelWidth = effectiveWidth * timelineState.zoomLevel;
    const pixelsPerSecond = totalPixelWidth / baseTimeRange;

    const majorTicks: JSX.Element[] = [];
    const minorTicks: JSX.Element[] = [];

    const startTick = Math.floor(startTime / timeStep) * timeStep;
    const endTick = Math.ceil(endTime / timeStep) * timeStep;
    for (let time = startTick; time <= endTick; time += timeStep) {
      const x = timeToPixels(time);
      if (x >= -50 && x <= effectiveWidth + 50) {
        majorTicks.push(
          <div key={`major-${time}`} className="time-tick major">
            <div className="tick-line major" style={{ left: x }} />
            <div className="tick-label" style={{ left: x }}>
              {formatTime(time)}
            </div>
          </div>
        );
      }
    }

    if (pixelsPerSecond > 2) {
      const startMinorTick = Math.floor(startTime / minorStep) * minorStep;
      const endMinorTick = Math.ceil(endTime / minorStep) * minorStep;
      for (let time = startMinorTick; time <= endMinorTick; time += minorStep) {
        if (Math.abs(time % timeStep) > 0.001) {
          const x = timeToPixels(time);
          if (x >= -10 && x <= effectiveWidth + 10) {
            minorTicks.push(
              <div key={`minor-${time}`} className="time-tick minor">
                <div className="tick-line minor" style={{ left: x }} />
              </div>
            );
          }
        }
      }
    }
    return [...minorTicks, ...majorTicks];
  };

  const renderGridLines = () => {
    const { timeStep, minorStep, startTime, endTime } = getTickIntervals();
    const lines: JSX.Element[] = [];

    const startMinorTick = Math.floor(startTime / minorStep) * minorStep;
    const endMinorTick = Math.ceil(endTime / minorStep) * minorStep;
    for (let time = startMinorTick; time <= endMinorTick; time += minorStep) {
      const x = timeToPixels(time);
      if (x < -20 || x > effectiveWidth + 20) continue;
      const isMajor = Math.abs(time % timeStep) <= 0.001;
      lines.push(
        <div
          key={`grid-${time}`}
          className={`grid-line ${isMajor ? 'major' : 'minor'}`}
          style={{ left: x }}
        />
      );
    }
    return <div className="grid-lines" aria-hidden>{lines}</div>;
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
    // Only render tracks for drones marked inTimeline and not timelineHidden
    const tracks = drones.filter(d => d.inTimeline && !d.timelineHidden);
    return tracks.map((drone, index) => {
      const isSelected = timelineState.selectedDrones.includes(drone.id);
      const trackHeight = 40;
      const y = index * (trackHeight + 2);
      
      // Calculate the track width and position based on viewport
      const droneStartTime = drone.frames[0]?.time || 0;
      const droneEndTime = drone.frames[drone.frames.length - 1]?.time || 0;
      const offset = timelineState.droneOffsets[drone.id] || 0;
      
      const startX = timeToPixels(droneStartTime + offset);
      const endX = timeToPixels(droneEndTime + offset);
      const trackWidth = Math.max(0, endX - startX);
      
      // Only render if the track is visible in the viewport
      if (endX < -50 || startX > effectiveWidth + 50) {
        return null;
      }
      
      return (
        <div
          key={drone.id}
          className={`drone-track ${isSelected ? 'selected' : ''} ${draggingTrack?.droneId === drone.id ? 'dragging' : ''}`}
          style={{ 
            top: y,
            left: Math.max(0, startX),
            width: trackWidth,
            height: trackHeight,
            backgroundColor: `${drone.color}20`,
            borderLeft: `3px solid ${drone.color}`,
          }}
          onClick={() => onToggleDroneSelection(drone.id)}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Capture seconds-per-pixel at drag start to make dragging independent of later zoom changes
            const baseTimeRange = Math.max(timelineState.totalTime, 60);
            const secondsPerPixel = baseTimeRange / (effectiveWidth * timelineState.zoomLevel);
            setDraggingTrack({ droneId: drone.id, startX: e.clientX, startOffset: offset, secondsPerPixel });
          }}
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
                  width: '100%',
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
                {/* Grid Lines aligned with ticks */}
                {renderGridLines()}
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
