import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildShapes, buildSky, N, STATES, State } from "./shapes";
import { clamp, easeInOut, easeOutExpo, keyNum, rng } from "../components/anim";
import timeline from "../../../episodes/EP00_人类/timeline.json";

const STYLE: Record<State, { color: [number, number, number]; color2: [number, number, number]; size: number; gain: number }> = {
  point: { color: [1.0, 0.92, 0.78], color2: [1.0, 0.8, 0.55], size: 0.5, gain: 0.35 },
  hand: { color: [1.0, 0.78, 0.48], color2: [0.55, 0.75, 1.0], size: 1.15, gain: 1.25 },
  nebula: { color: [0.55, 0.75, 1.0], color2: [0.85, 0.6, 1.0], size: 1.6, gain: 0.9 },
  star: { color: [1.0, 0.82, 0.5], color2: [1.0, 0.55, 0.3], size: 0.9, gain: 0.75 },
  burst: { color: [1.0, 0.6, 0.45], color2: [0.6, 0.65, 1.0], size: 1.5, gain: 1.3 },
  planet: { color: [0.35, 0.65, 1.0], color2: [0.9, 0.95, 1.0], size: 1.0, gain: 1.35 },
};

const vert = /* glsl */ `
  attribute vec3 p0; attribute vec3 p1; attribute vec3 p2; attribute vec3 p3; attribute vec3 p4; attribute vec3 p5;
  attribute float seed;
  uniform vec3 wA; uniform vec3 wB; uniform float uTime; uniform float uSize; uniform float uPx;
  uniform vec3 cA; uniform vec3 cB;
  varying vec3 vColor; varying float vSeed;
  void main() {
    vec3 p = p0*wA.x + p1*wA.y + p2*wA.z + p3*wB.x + p4*wB.y + p5*wB.z;
    // gentle life: tiny drift so nothing is ever frozen
    p += 0.018 * vec3(sin(uTime*0.9 + seed*61.0), cos(uTime*0.7 + seed*37.0), sin(uTime*0.8 + seed*13.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.55 + 0.9 * fract(seed * 7.13));
    gl_PointSize = s * uPx / -mv.z;
    vColor = mix(cA, cB, step(0.82, fract(seed * 3.7)));
    vSeed = seed;
  }
`;
const frag = /* glsl */ `
  uniform float uGain; varying vec3 vColor; varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    float a = smoothstep(0.5, 0.0, d); a *= a;
    float tw = 0.75 + 0.25 * fract(vSeed * 91.7);
    gl_FragColor = vec4(vColor * a * uGain * tw, 1.0);
  }
`;

const keys = timeline.particles as [number, State][];

/** Weights over the six states at time t (only two are non-zero at any moment). */
export const stateMix = (t: number) => {
  const w: Record<State, number> = { point: 0, hand: 0, nebula: 0, star: 0, burst: 0, planet: 0 };
  if (t <= keys[0][0]) { w[keys[0][1]] = 1; return w; }
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, s0] = keys[i], [t1, s1] = keys[i + 1];
    if (t < t1) {
      const x = (t - t0) / (t1 - t0);
      const e = s0 === "star" && s1 === "burst" ? easeOutExpo(x) : easeInOut(x);
      w[s0] += 1 - e; w[s1] += e;
      return w;
    }
  }
  w[keys[keys.length - 1][1]] = 1;
  return w;
};

export const ParticleField: React.FC<{ t: number; width: number; height: number }> = ({ t, height }) => {
  const { camera } = useThree();
  const { geom, mat, sky } = useMemo(() => {
    const shapes = buildShapes();
    const g = new THREE.BufferGeometry();
    STATES.forEach((s, i) => g.setAttribute(`p${i}`, new THREE.BufferAttribute(shapes[s], 3)));
    g.setAttribute("position", new THREE.BufferAttribute(shapes.hand, 3));
    const r = rng(42);
    const seeds = new Float32Array(N).map(() => r());
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        wA: { value: new THREE.Vector3() }, wB: { value: new THREE.Vector3() },
        cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() },
        uTime: { value: 0 }, uSize: { value: 1 }, uPx: { value: 1 }, uGain: { value: 1 },
      },
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(buildSky(), 3));
    const sm = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0x9fb4d8, transparent: true, opacity: 0.0, depthWrite: false });
    return { geom: g, mat: m, sky: { g: sg, m: sm } };
  }, []);

  const w = stateMix(t);
  const blend = (f: (s: State) => number) => STATES.reduce((a, s) => a + w[s] * f(s), 0);
  const blendC = (k: "color" | "color2") =>
    [0, 1, 2].map((j) => STATES.reduce((a, s) => a + w[s] * STYLE[s][k][j], 0)) as [number, number, number];

  const u = mat.uniforms;
  u.wA.value.set(w.point, w.hand, w.nebula);
  u.wB.value.set(w.star, w.burst, w.planet);
  u.cA.value.setRGB(...blendC("color"));
  u.cB.value.setRGB(...blendC("color2"));
  u.uTime.value = t;
  u.uPx.value = height * 0.022;
  u.uSize.value = blend((s) => STYLE[s].size);
  // fade in from black; dim behind the title card
  const fadeIn = clamp((t - 0.5) / 1.5);
  const dim = 1 - 0.6 * clamp((t - timeline.title.in) / 1.2);
  u.uGain.value = blend((s) => STYLE[s].gain) * fadeIn * dim;
  sky.m.opacity = 0.55 * clamp((t - 5.5) / 3) * clamp((24 - t) / 3);

  camera.position.set(0, 0.25, keyNum(t, timeline.camera as [number, number][]));
  camera.lookAt(0, 0.3, 0);

  const [f0, f1] = timeline.flip;
  const flip = Math.PI * easeInOut(clamp((t - f0) / (f1 - f0)));
  const spin = keyNum(t, [[5.6, 0], [18.4, 1.4], [22.0, Math.PI * 2]]);
  const sway = 0.12 * Math.sin(t * 0.35);

  return (
    <>
      <points geometry={sky.g} material={sky.m} />
      <group rotation={[0.05 * Math.sin(t * 0.25), flip + spin + sway, 0]}>
        <points geometry={geom} material={mat} frustumCulled={false} />
      </group>
    </>
  );
};
