// ================================================================
// StageVisualizer — 3D concert stage with reactive lighting
// Built with React Three Fiber + Three.js.
// Features: volumetric lights, fog, beams, bloom, laser effects.
// ================================================================

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useLightingStore } from '../stores/lightingStore';
import { useAudioStore } from '../stores/audioStore';

// ─── STAGE FLOOR ──────────────────────────────────────────────
const StageFloor: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[24, 18, 32, 32]} />
      <meshStandardMaterial
        color="#0a0a0a"
        metalness={0.8}
        roughness={0.3}
        envMapIntensity={0.2}
      />
    </mesh>
  );
};

// ─── TRUSS STRUCTURE ──────────────────────────────────────────
const Truss: React.FC<{ position: [number, number, number]; length: number; rotation?: [number, number, number] }> = ({
  position, length, rotation = [0, 0, 0]
}) => (
  <group position={position} rotation={rotation}>
    {/* Main beams */}
    {[[-0.15, 0.15], [0.15, 0.15], [-0.15, -0.15], [0.15, -0.15]].map(([y, z], i) => (
      <mesh key={i} position={[0, y, z]}>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
    ))}
    {/* Cross braces */}
    {Array.from({ length: Math.floor(length * 2) }).map((_, i) => (
      <mesh key={`brace-${i}`} position={[i / 2 - length / 2 + 0.25, 0, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.3]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

// ─── REACTIVE LIGHT FIXTURE ───────────────────────────────────
const LightFixture: React.FC<{
  fixtureId: string;
  position: [number, number, number];
  type: string;
}> = ({ fixtureId, position, type }) => {
  const spotRef = useRef<THREE.SpotLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  // Read fixture state from store
  const fixtureState = useLightingStore((s) => s.fixtureStates[fixtureId]);

  const color = useMemo(() => {
    if (!fixtureState || fixtureState.intensity < 0.01) return new THREE.Color(0, 0, 0);
    return new THREE.Color(
      fixtureState.color.r / 255,
      fixtureState.color.g / 255,
      fixtureState.color.b / 255
    );
  }, [fixtureState?.color.r, fixtureState?.color.g, fixtureState?.color.b, fixtureState?.intensity]);

  const intensity = fixtureState?.intensity ?? 0;

  useFrame(({ clock }) => {
    // Animate target position for moving heads
    if (targetRef.current && (type === 'beam' || type === 'spot')) {
      const t = clock.getElapsedTime();
      targetRef.current.position.set(
        position[0] + Math.sin(t * 0.8) * 3,
        -1,
        position[2] + Math.cos(t * 0.5) * 2
      );
    }

    // Emissive glow on fixture housing — only when active
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (intensity > 0.05) {
        mat.emissive = color;
        mat.emissiveIntensity = intensity * 2;
      } else {
        mat.emissive.setRGB(0, 0, 0);
        mat.emissiveIntensity = 0;
      }
    }
  });

  const spotIntensity = intensity * (type === 'strobe' ? 80 : type === 'laser' ? 60 : 40);
  const angle = type === 'beam' ? 0.1 : type === 'laser' ? 0.03 : type === 'wash' ? 0.8 : 0.4;
  const penumbra = type === 'wash' ? 1 : type === 'beam' ? 0.1 : 0.5;

  return (
    <group position={position}>
      {/* Fixture housing */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lens — only emissive when intensity is meaningful */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.03, 8]} />
        <meshStandardMaterial
          color={intensity > 0.05 ? color : '#000'}
          emissive={intensity > 0.05 ? color : '#000'}
          emissiveIntensity={intensity > 0.05 ? intensity * 3 : 0}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Spotlight */}
      {intensity > 0.05 && (
        <>
          <primitive object={targetRef.current} />
          <spotLight
            ref={spotRef}
            color={color}
            intensity={spotIntensity}
            angle={angle}
            penumbra={penumbra}
            distance={20}
            decay={1.5}
            target={targetRef.current}
            castShadow={false}
          />
        </>
      )}

      {/* Volumetric cone (fake) */}
      {intensity > 0.15 && type !== 'strobe' && (
        <mesh position={[0, -3, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[Math.tan(angle) * 6, 6, 16, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={intensity * 0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

// ─── LASER EFFECT ─────────────────────────────────────────────
const LaserBeam: React.FC<{
  fixtureId: string;
  position: [number, number, number];
}> = ({ fixtureId, position }) => {
  const lineRef = useRef<THREE.Line>(null);
  const fixtureState = useLightingStore((s) => s.fixtureStates[fixtureId]);

  const intensity = fixtureState?.intensity ?? 0;
  const color = useMemo(() => {
    if (!fixtureState || intensity < 0.05) return new THREE.Color(0, 0, 0);
    return new THREE.Color(
      fixtureState.color.r / 255,
      fixtureState.color.g / 255,
      fixtureState.color.b / 255
    );
  }, [fixtureState?.color.r, fixtureState?.color.g, fixtureState?.color.b, intensity]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const t = clock.getElapsedTime();
    const points = [];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const x = position[0] + Math.sin(t + progress * 3) * 4 * progress;
      const y = position[1] - progress * (position[1] + 1);
      const z = position[2] + Math.cos(t * 0.7 + progress * 2) * 3 * progress;
      points.push(new THREE.Vector3(x, y, z));
    }

    lineRef.current.geometry.setFromPoints(points);
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.color = color;
    mat.opacity = intensity * 0.6;
  });

  if (intensity < 0.05) return null;

  return (
    <line ref={lineRef as any}>
      <bufferGeometry />
      <lineBasicMaterial color={color} transparent opacity={0.6} linewidth={2} />
    </line>
  );
};

// ─── LED BAR ──────────────────────────────────────────────────
const LEDBar: React.FC<{
  fixtureId: string;
  position: [number, number, number];
}> = ({ fixtureId, position }) => {
  const fixtureState = useLightingStore((s) => s.fixtureStates[fixtureId]);
  const intensity = fixtureState?.intensity ?? 0;
  const color = useMemo(() => {
    if (!fixtureState || intensity < 0.05) return new THREE.Color(0, 0, 0);
    return new THREE.Color(
      fixtureState.color.r / 255,
      fixtureState.color.g / 255,
      fixtureState.color.b / 255
    );
  }, [fixtureState?.color.r, fixtureState?.color.g, fixtureState?.color.b, intensity]);

  return (
    <group position={position}>
      {/* Bar housing */}
      <mesh>
        <boxGeometry args={[2, 0.08, 0.08]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* LED segments */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.875 + i * 0.25, -0.05, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.06]} />
          <meshStandardMaterial
            color={intensity > 0.05 ? color : '#000'}
            emissive={intensity > 0.05 ? color : '#000'}
            emissiveIntensity={intensity > 0.05 ? intensity * 5 : 0}
          />
        </mesh>
      ))}
      {/* Area light */}
      {intensity > 0.05 && (
        <rectAreaLight
          color={color}
          intensity={intensity * 20}
          width={2}
          height={0.1}
          position={[0, -0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      )}
    </group>
  );
};

// ─── FOG PARTICLES ────────────────────────────────────────────
const FogParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += Math.sin(t * 0.2 + i) * 0.002;
      posArray[i * 3] += Math.cos(t * 0.1 + i * 0.5) * 0.001;
      // Reset particles that go too high
      if (posArray[i * 3 + 1] > 8) posArray[i * 3 + 1] = 0;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#334"
        size={0.05}
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

// ─── SCENE CONTENT ────────────────────────────────────────────
const SceneContent: React.FC = () => {
  const fixtures = useLightingStore((s) => s.fixtures);
  const stageConfig = useLightingStore((s) => s.stageConfig);

  // Map normalized fixture positions to 3D world coordinates
  const mapPosition = (pos: { x: number; y: number; z: number }): [number, number, number] => {
    return [
      pos.x * stageConfig.stageWidth / 2,
      pos.y * 8,
      pos.z * stageConfig.stageDepth / 2 - stageConfig.stageDepth / 4,
    ];
  };

  return (
    <>
      {/* Camera setup */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2}
        target={[0, 2, 0]}
      />

      {/* Ambient lighting */}
      <ambientLight intensity={stageConfig.ambientIntensity} color="#1a1a2e" />

      {/* Fog */}
      <fog attach="fog" args={['#050508', 10, 40]} />

      {/* Stage floor */}
      <StageFloor />

      {/* Truss structures */}
      <Truss position={[0, 7, -2]} length={16} />
      <Truss position={[0, 7, 3]} length={12} />
      <Truss position={[-7, 3.5, 0]} length={8} rotation={[0, 0, Math.PI / 2]} />
      <Truss position={[7, 3.5, 0]} length={8} rotation={[0, 0, Math.PI / 2]} />

      {/* Back wall */}
      <mesh position={[0, 3.5, -7]} receiveShadow>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial color="#080808" metalness={0.5} roughness={0.8} />
      </mesh>

      {/* Render fixtures */}
      {fixtures.map(fixture => {
        const pos = mapPosition(fixture.position);

        if (fixture.type === 'laser') {
          return <LaserBeam key={fixture.id} fixtureId={fixture.id} position={pos} />;
        }
        if (fixture.type === 'led_bar') {
          return <LEDBar key={fixture.id} fixtureId={fixture.id} position={pos} />;
        }
        return (
          <LightFixture
            key={fixture.id}
            fixtureId={fixture.id}
            position={pos}
            type={fixture.type}
          />
        );
      })}

      {/* Fog particles */}
      {stageConfig.hazeEnabled && <FogParticles />}
    </>
  );
};

// ─── MAIN VISUALIZER COMPONENT ────────────────────────────────
interface StageVisualizerProps {
  className?: string;
}

export const StageVisualizer: React.FC<StageVisualizerProps> = ({ className = '' }) => {
  const stageConfig = useLightingStore((s) => s.stageConfig);

  return (
    <div className={`w-full h-full bg-black ${className}`}>
      <Canvas
        camera={{
          position: [0, 6, 12],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        shadows={false}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <SceneContent />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={stageConfig.bloomThreshold}
            luminanceSmoothing={0.9}
            intensity={stageConfig.bloomIntensity}
            mipmapBlur
          />
          <Noise opacity={0.02} />
          <Vignette darkness={0.6} offset={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
