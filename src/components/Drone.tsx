import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { DroneFrame } from '../types/DroneTypes';

interface DroneProps {
  frame: DroneFrame | null;
  scaleFactor: number;
}

export function Drone({ frame, scaleFactor }: DroneProps) {
  const groupRef = useRef<Group>(null);
  const rotorRefs = useRef<Mesh[]>([]);

  // Drone dimensions in meters, scaled to world units
  const dimensions = useMemo(() => {
    const meter = scaleFactor;
    return {
      bodySize: 0.25 * meter,
      bodyHeight: 0.06 * meter,
      armLength: 0.35 * meter,
      armThickness: 0.02 * meter,
      rotorRadius: 0.1 * meter,
      rotorHeight: 0.01 * meter,
    };
  }, [scaleFactor]);

  // Animate rotors
  useFrame((state) => {
    rotorRefs.current.forEach((rotor, index) => {
      if (rotor) {
        // Counter-rotating pairs for realistic effect
        const direction = (index === 0 || index === 3) ? 1 : -1;
        rotor.rotation.y += direction * 0.3;
      }
    });
  });

  // Update drone position and rotation when frame changes
  React.useEffect(() => {
    if (frame && groupRef.current) {
      // Position (invert Y to match original coordinate system)
      groupRef.current.position.set(
        frame.x * scaleFactor,
        -frame.y * scaleFactor,
        frame.z * scaleFactor
      );

      // Rotation (matching original p5 rotation order: YXZ)
      groupRef.current.rotation.order = 'YXZ';
      groupRef.current.rotation.y = frame.yaw;
      groupRef.current.rotation.x = frame.pitch;
      groupRef.current.rotation.z = frame.roll;
    }
  }, [frame, scaleFactor]);

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[dimensions.bodySize, dimensions.bodyHeight, dimensions.bodySize]} />
        <meshStandardMaterial color="#c8c8dc" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Arms and rotors */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (Math.PI / 2) * i + Math.PI / 4;
        const armX = Math.cos(angle) * dimensions.armLength * 0.5;
        const armZ = Math.sin(angle) * dimensions.armLength * 0.5;
        const rotorY = dimensions.bodyHeight * 0.5 + dimensions.rotorHeight * 0.5 + 0.01 * scaleFactor;

        return (
          <React.Fragment key={i}>
            {/* Arm */}
            <mesh
              position={[armX, 0, armZ]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[dimensions.armLength, dimensions.armThickness, dimensions.armThickness]} />
              <meshStandardMaterial color="#999999" />
            </mesh>

            {/* Rotor */}
            <mesh
              ref={(ref) => {
                if (ref) rotorRefs.current[i] = ref;
              }}
              position={[armX, rotorY, armZ]}
            >
              <cylinderGeometry 
                args={[dimensions.rotorRadius, dimensions.rotorRadius, dimensions.rotorHeight, 24]} 
              />
              <meshStandardMaterial 
                color={i === 0 || i === 3 ? "#ff5050" : "#5050ff"} 
                transparent 
                opacity={0.85} 
              />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}