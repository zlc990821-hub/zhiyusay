import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";

// 天元意象：高维小球在高速激荡，周围是被甩出的光点
export const OscillatingSphere: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;

  const points = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // 确定性的伪随机，保证每次渲染画面一致
      const a = Math.sin(i * 12.9898) * 43758.5453;
      const b = Math.sin(i * 78.233) * 12543.123;
      const u = a - Math.floor(a), v = b - Math.floor(b);
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
      const r = 1.6 + ((i * 0.618) % 1) * 1.4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const jitter = 0.04 * intensity;
  const jx = Math.sin(t * 47) * jitter, jy = Math.cos(t * 53) * jitter;

  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 7], fov: 45 }}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={40} color="#ffd9a0" />
      <group position={[jx, jy, 0]} rotation={[t * 0.3, t * 0.5, 0]}>
        <mesh>
          <icosahedronGeometry args={[1, 5]} />
          <meshStandardMaterial color="#1a1208" emissive="#ffb35c" emissiveIntensity={1.4 + Math.sin(t * 6) * 0.3} />
        </mesh>
        <points geometry={points} rotation={[0, t * 0.8, 0]}>
          <pointsMaterial size={0.025} color="#ffe2b8" transparent opacity={0.8} />
        </points>
      </group>
    </ThreeCanvas>
  );
};
