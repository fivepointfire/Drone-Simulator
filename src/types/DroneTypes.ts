export interface DroneFrame {
  x: number;
  y: number;
  z: number;
  roll: number;
  pitch: number;
  yaw: number;
  time: number;
}

export interface DroneStats {
  position: { x: number; y: number; z: number };
  rotation: { roll: number; pitch: number; yaw: number };
  time: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalTime: number;
  currentFrameIndex: number;
  totalFrames: number;
}

export interface SimulationConfig {
  scaleFactor: number;
  csvFileName?: string; // Optional for backward compatibility
}

export interface DroneInstance {
  id: string;
  name: string;
  file: File;
  frames: DroneFrame[];
  color: string;
  visible: boolean;
}

export interface DroneManagerState {
  drones: DroneInstance[];
  activeDroneId: string | null;
  isLoading: boolean;
  error: string | null;
}