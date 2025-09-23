import { DroneFrame } from '../types/DroneTypes';

export async function loadCsvData(source: string | File): Promise<DroneFrame[]> {
  try {
    let text: string;
    
    if (source instanceof File) {
      // Handle File object
      text = await source.text();
    } else {
      // Handle URL string
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      text = await response.text();
    }
    const lines = text.split(/\r?\n/).filter(Boolean);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const header = lines.shift()!.split(',');
    
    // Find column indices
    const getColumnIndex = (name: string): number => {
      const index = header.indexOf(name);
      if (index === -1) {
        throw new Error(`Column '${name}' not found in CSV`);
      }
      return index;
    };
    
    const indices = {
      x: getColumnIndex('drone_x'),
      y: getColumnIndex('drone_y'),
      z: getColumnIndex('drone_z'),
      roll: getColumnIndex('drone_roll'),
      pitch: getColumnIndex('drone_pitch'),
      yaw: getColumnIndex('drone_yaw'),
      time: getColumnIndex('elapsed_time'),
    };
    
    const result: DroneFrame[] = [];
    
    for (const line of lines) {
      const cols = line.split(',');
      
      // Skip lines with insufficient columns
      if (cols.length <= Math.max(...Object.values(indices))) {
        continue;
      }
      
      const frame: DroneFrame = {
        x: parseFloat(cols[indices.x]) || 0,
        y: parseFloat(cols[indices.y]) || 0,
        z: parseFloat(cols[indices.z]) || 0,
        roll: parseFloat(cols[indices.roll]) || 0,
        pitch: parseFloat(cols[indices.pitch]) || 0,
        yaw: parseFloat(cols[indices.yaw]) || 0,
        time: parseFloat(cols[indices.time]) || 0,
      };
      
      // Skip invalid frames
      if (isNaN(frame.time)) {
        continue;
      }
      
      result.push(frame);
    }
    
    // Sort by time to ensure proper playback order
    result.sort((a, b) => a.time - b.time);
    
    return result;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00.0000';
  
  const totalSeconds = Math.max(0, seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Format seconds with 4 decimal places, ensuring proper padding
  const secs = remainingSeconds.toFixed(4);
  const [wholePart, decimalPart] = secs.split('.');
  const formattedSecs = wholePart.padStart(2, '0') + '.' + decimalPart;
  
  return `${minutes}:${formattedSecs}`;
}

export function findFrameIndexAtTime(frames: DroneFrame[], targetTime: number): number {
  if (frames.length === 0) return 0;
  
  // Binary search for efficiency with large datasets
  let left = 0;
  let right = frames.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = frames[mid].time;
    
    if (midTime === targetTime) {
      return mid;
    } else if (midTime < targetTime) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  // Return the closest frame (right will be the last frame <= targetTime)
  return Math.max(0, Math.min(right, frames.length - 1));
}