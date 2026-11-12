// Style C particle stage: orthographic, pixel-space particles whose targets come from silhouettes.
// Positions/colours are blended on the CPU every frame, so any number of shapes is possible.
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { easeInOut, rng } from "../components/anim";

export const N = 14000;
const W = 1920, H = 1080;

export type StateDef = {
  pos: Float32Array | ((t: number, out: Float32Array) => void); // x,y screen px (y down)
  col: Float32Array; // r,g,b per particle
  bright?: Float32Array | ((t: number, out: Float32Array) => void);
};
export type Key = [number, string];

const vert = /* glsl */ `
  attribute vec3 aCol; attribute float aB; attribute float aSeed;
  uniform float uSize;
  varying vec3 vC;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.6 + 0.9 * fract(aSeed * 7.13));
    vC = aCol * aB * (0.75 + 0.25 * fract(aSeed * 91.7));
  }`;
const frag = /* glsl */ `
  uniform float uGain; varying vec3 vC;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d); a *= a;
    vec3 c = max(vC * a * uGain, 0.0);
    gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
  }`;

/** Build state definitions asynchronously (silhouette rasterising) and block rendering until ready. */
export const useStates = (build: () => Promise<Record<string, StateDef>>) => {
  const [states, setStates] = useState<Record<string, StateDef> | null>(null);
  const [handle] = useState(() => delayRender("particle states"));
  useEffect(() => {
    build().then((s) => { setStates(s); continueRender(handle); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return states;
};

const tmpA = new Float32Array(N * 2), tmpB = new Float32Array(N * 2), bA = new Float32Array(N), bB = new Float32Array(N);

/** cam = world point (screen-pixel coords) at the centre of the frame, and zoom. Overlays must use the same camera. */
export type Cam = { x: number; y: number; z: number };
export const Stage: React.FC<{ t: number; states: Record<string, StateDef>; keys: Key[]; gain: number; size?: number; cam?: Cam }> = ({ t, states, keys, gain, size = 2.6, cam = { x: 960, y: 540, z: 1 } }) => {
  const { geom, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute("aB", new THREE.BufferAttribute(new Float32Array(N), 1));
    const r = rng(42);
    g.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: N }, () => r()), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const m = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uSize: { value: size }, uGain: { value: 1 } },
    });
    return { geom: g, mat: m };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // which two states, and how far between them
  let s0 = keys[0][1], s1 = s0, e = 0;
  if (t > keys[0][0]) {
    s0 = s1 = keys[keys.length - 1][1];
    for (let k = 0; k < keys.length - 1; k++) {
      if (t < keys[k + 1][0]) {
        s0 = keys[k][1]; s1 = keys[k + 1][1];
        e = s0 === s1 ? 0 : easeInOut((t - keys[k][0]) / (keys[k + 1][0] - keys[k][0]));
        break;
      }
    }
  }
  const A = states[s0], B = states[s1];
  const pa = typeof A.pos === "function" ? (A.pos(t, tmpA), tmpA) : A.pos;
  const pb = typeof B.pos === "function" ? (B.pos(t, tmpB), tmpB) : B.pos;
  const ba = A.bright ? (typeof A.bright === "function" ? (A.bright(t, bA), bA) : A.bright) : null;
  const bb = B.bright ? (typeof B.bright === "function" ? (B.bright(t, bB), bB) : B.bright) : null;
  const pos = geom.attributes.position.array as Float32Array;
  const col = geom.attributes.aCol.array as Float32Array;
  const br = geom.attributes.aB.array as Float32Array;
  const seed = geom.attributes.aSeed.array as Float32Array;
  const swirl = Math.sin(e * Math.PI); // particles loosen mid-morph
  for (let i = 0; i < N; i++) {
    const sd = seed[i];
    const x = pa[i * 2] + (pb[i * 2] - pa[i * 2]) * e + swirl * 60 * Math.sin(sd * 40 + t * 2);
    const y = pa[i * 2 + 1] + (pb[i * 2 + 1] - pa[i * 2 + 1]) * e + swirl * 60 * Math.cos(sd * 37 + t * 2);
    const jx = 1.2 * Math.sin(t * 0.9 + sd * 61), jy = 1.2 * Math.cos(t * 0.7 + sd * 37);
    pos[i * 3] = x + jx - W / 2;
    pos[i * 3 + 1] = H / 2 - (y + jy);
    pos[i * 3 + 2] = 0;
    for (let c = 0; c < 3; c++) col[i * 3 + c] = A.col[i * 3 + c] + (B.col[i * 3 + c] - A.col[i * 3 + c]) * e;
    br[i] = (ba ? ba[i] : 1) * (1 - e) + (bb ? bb[i] : 1) * e;
  }
  geom.attributes.position.needsUpdate = true;
  geom.attributes.aCol.needsUpdate = true;
  geom.attributes.aB.needsUpdate = true;
  mat.uniforms.uGain.value = gain;
  mat.uniforms.uSize.value = size * Math.max(0.9, Math.sqrt(cam.z));
  return (
    <group scale={[cam.z, cam.z, 1]} position={[-(cam.x - W / 2) * cam.z, (cam.y - H / 2) * cam.z, 0]}>
      <points geometry={geom} material={mat} frustumCulled={false} />
    </group>
  );
};

/** Fill a colour array from a palette function. */
export const paint = (fn: (i: number, r: () => number) => [number, number, number], seed = 3) => {
  const r = rng(seed);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) out.set(fn(i, r), i * 3);
  return out;
};
export const solid = (a: [number, number, number], b: [number, number, number] = [0.85, 0.9, 1.0], share = 0.15, seed = 3) =>
  paint((_, r) => (r() < share ? b : a), seed);
