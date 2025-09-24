import { DroneInstance } from './DroneTypes';

export interface TimelineState {
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  zoomLevel: number;
  viewportStart: number;
  viewportEnd: number;
  selectedDrones: string[];
  playMode: 'simultaneous' | 'synchronous';
  loopEnabled: boolean;
  markers: TimelineMarker[];
  // Per-drone start time offsets in seconds (can be negative)
  droneOffsets: Record<string, number>;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
  type: 'event' | 'bookmark' | 'sync';
}

export interface DroneTrack {
  drone: DroneInstance;
  isVisible: boolean;
  isMuted: boolean;
  isSelected: boolean;
  height: number;
  color: string;
}

export interface TimelineViewport {
  start: number;
  end: number;
  duration: number;
  pixelsPerSecond: number;
}

export interface PlaybackRange {
  start: number;
  end: number;
  enabled: boolean;
}
