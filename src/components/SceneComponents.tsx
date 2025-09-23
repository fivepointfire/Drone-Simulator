import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { DroneFrame } from '../types/DroneTypes';

interface GridProps {
  size?: number;
  divisions?: number;
}

export function Grid({ size = 1000, divisions = 50 }: GridProps) {
  return (
    <gridHelper args={[size, divisions, '#555555', '#555555']} />
  );
}

export function Axes({ length = 100 }: { length?: number }) {
  const axesData = useMemo(() => [
    { points: [[0, 0, 0], [length, 0, 0]], color: '#ff0000' }, // X - Red
    { points: [[0, 0, 0], [0, length, 0]], color: '#00ff00' }, // Y - Green
    { points: [[0, 0, 0], [0, 0, length]], color: '#0000ff' }, // Z - Blue
  ], [length]);

  return (
    <group>
      {axesData.map((axis, index) => (
        <Line
          key={index}
          points={axis.points}
          color={axis.color}
          lineWidth={2}
        />
      ))}
    </group>
  );
}

interface FlightPathProps {
  frames: DroneFrame[];
  scaleFactor: number;
  color?: string;
  opacity?: number;
}

export function FlightPath({ frames, scaleFactor, color = '#ffff00', opacity = 1 }: FlightPathProps) {
  const points = useMemo(() => {
    if (frames.length === 0) return [];
    
    return frames.map(frame => 
      new Vector3(
        frame.x * scaleFactor,
        -frame.y * scaleFactor, // Invert Y to match coordinate system
        frame.z * scaleFactor
      )
    );
  }, [frames, scaleFactor]);

  if (points.length === 0) return null;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

export function Lights() {
  return (
    <>
      <directionalLight
        position={[1, 1, 1]}
        intensity={1.0}
        color="#ffffff"
      />
      <ambientLight
        intensity={0.3}
        color="#ffffff"
      />
    </>
  );
}