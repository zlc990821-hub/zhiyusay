import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildAux, buildShapes, buildSky, N, STATES, State } from "./shapes";
import { clamp, easeInOut, easeOutExpo, keyNum } from "../components/anim";
import timeline from "../../../episodes/EP00_人类/timeline.json";

type RGB = [number, number, number];
const STYLE: Record<State, { color: RGB; color2: RGB; size: number; gain: number }> = {
  point: { color: [1.0, 0.92, 0.78], color2: [1.0, 0.8, 0.55], size: 0.5, gain: 0.35 },
  hand: { color: [1.0, 0.78, 0.48], color2: [0.55, 0.75, 1.0], size: 1.15, gain: 1.25 },
  nebula: { color: [0.55, 0.75, 1.0], color2: [0.85, 0.6, 1.0], size: 1.6, gain: 0.9 },
  star: { color: [1.0, 0.82, 0.5], color2: [1.0, 0.55, 0.3], size: 0.9, gain: 0.75 },
  burst: { color: [1.0, 0.6, 0.45], color2: [0.6, 0.65, 1.0], size: 1.5, gain: 1.3 },
  planet: { color: [0.35, 0.65, 1.0], color2: [0.9, 0.95, 1.0], size: 1.0, gain: 1.35 },
  cells: { color: [1.0, 0.55, 0.5], color2: [1.0, 0.85, 0.75], size: 1.1, gain: 1.5 },
  network: { color: [0.5, 0.75, 1.0], color2: [0.9, 0.95, 1.0], size: 1.0, gain: 1.35 },
  wave: { color: [0.45, 0.85, 1.0], color2: [0.7, 0.6, 1.0], size: 1.0, gain: 1.15 },
  twohands: { color: [1.0, 0.78, 0.48], color2: [0.55, 0.75, 1.0], size: 1.0, gain: 1.2 },
  eye: { color: [0.85, 0.9, 1.0], color2: [0.6, 0.72, 1.0], size: 0.95, gain: 1.05 },
  human: { color: [0.98, 0.86, 0.68], color2: [0.6, 0.75, 1.0], size: 1.0, gain: 1.15 },
};
// "the same melody played by another band": wave changes colour, keeps its shape
const WAVE_ALT: { color: RGB; color2: RGB } = { color: [1.0, 0.62, 0.78], color2: [1.0, 0.86, 0.5] };

const K = STATES.length;
const vert = /* glsl */ `
  ${STATES.map((_, i) => `attribute vec3 p${i};`).join(" ")}
  attribute vec3 aux; // seed, group, param
  uniform float uW[${K}];
  uniform float uTime; uniform float uSize; uniform float uPx;
  uniform vec3 cA; uniform vec3 cB;
  uniform float uFlicker; uniform float uNeuron; uniform float uPulse;
  varying vec3 vColor; varying float vSeed; varying float vBright;
  void main() {
    float seed = aux.x;
    vec3 p = ${STATES.map((_, i) => `p${i}*uW[${i}]`).join(" + ")};
    p += 0.018 * vec3(sin(uTime*0.9 + seed*61.0), cos(uTime*0.7 + seed*37.0), sin(uTime*0.8 + seed*13.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.55 + 0.9 * fract(seed * 7.13));
    gl_PointSize = s * uPx / -mv.z;
    vColor = mix(cA, cB, step(0.82, fract(seed * 3.7)));
    float b = 1.0;
    // cell turnover: each cell (group) blinks out and is reborn on its own clock; neurons (group < .07) stay lit
    float isN = step(aux.y, 0.07);
    float ph = fract(aux.y * 17.31 + uTime * 0.23);
    float alive = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.84, 0.92, ph));
    b *= mix(1.0, mix(0.08 + 0.92 * alive, 1.0, isN), uFlicker);
    vColor = mix(vColor, vec3(1.0, 0.82, 0.4), isN * uNeuron);
    b *= 1.0 + isN * uNeuron * 1.6 - (1.0 - isN) * uNeuron * 0.45;
    // signal pulses running along network edges
    float onEdge = step(0.0, aux.z);
    float pulse = pow(fract(aux.z - uTime * 0.6 + aux.y * 5.0), 14.0);
    b *= 1.0 + uPulse * onEdge * (pulse * 3.0 - 0.35);
    vBright = b;
    vSeed = seed;
  }
`;
const frag = /* glsl */ `
  uniform float uGain; varying vec3 vColor; varying float vSeed; varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    float a = smoothstep(0.5, 0.0, d); a *= a;
    float tw = 0.75 + 0.25 * fract(vSeed * 91.7);
    gl_FragColor = vec4(vColor * a * uGain * tw * vBright, 1.0);
  }
`;

const keys = timeline.particles as [number, State][];

/** Weights over the states at time t (at most two non-zero). */
export const stateMix = (t: number) => {
  const w = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<State, number>;
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

const fx = timeline.fx;

export const ParticleField: React.FC<{ t: number; width: number; height: number }> = ({ t, height }) => {
  const { camera } = useThree();
  const { geom, mat, sky } = useMemo(() => {
    const shapes = buildShapes();
    const g = new THREE.BufferGeometry();
    STATES.forEach((s, i) => g.setAttribute(`p${i}`, new THREE.BufferAttribute(shapes[s], 3)));
    g.setAttribute("position", new THREE.BufferAttribute(shapes.hand, 3));
    g.setAttribute("aux", new THREE.BufferAttribute(buildAux(), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uW: { value: new Array(K).fill(0) },
        cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() },
        uTime: { value: 0 }, uSize: { value: 1 }, uPx: { value: 1 }, uGain: { value: 1 },
        uFlicker: { value: 0 }, uNeuron: { value: 0 }, uPulse: { value: 0 },
      },
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(buildSky(), 3));
    const sm = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0x9fb4d8, transparent: true, opacity: 0.0, depthWrite: false });
    return { geom: g, mat: m, sky: { g: sg, m: sm } };
  }, []);

  const w = stateMix(t);
  const alt = clamp((t - fx.bandSwap) / 1.2);
  const style = (s: State) =>
    s === "wave" ? { ...STYLE.wave, color: lerp3(STYLE.wave.color, WAVE_ALT.color, alt), color2: lerp3(STYLE.wave.color2, WAVE_ALT.color2, alt) } : STYLE[s];
  const blend = (f: (s: State) => number) => STATES.reduce((a, s) => a + w[s] * f(s), 0);
  const blendC = (k: "color" | "color2") => [0, 1, 2].map((j) => STATES.reduce((a, s) => a + w[s] * style(s)[k][j], 0)) as RGB;

  const u = mat.uniforms;
  u.uW.value = STATES.map((s) => w[s]);
  u.cA.value.setRGB(...blendC("color"));
  u.cB.value.setRGB(...blendC("color2"));
  u.uTime.value = t;
  u.uPx.value = height * 0.022;
  u.uSize.value = blend((s) => STYLE[s].size);
  u.uFlicker.value = w.cells * keyNum(t, fx.flicker as [number, number][]);
  u.uNeuron.value = w.cells * keyNum(t, fx.neuron as [number, number][]);
  u.uPulse.value = w.network;
  const fadeIn = clamp((t - 0.5) / 1.5);
  u.uGain.value = blend((s) => STYLE[s].gain) * fadeIn * keyNum(t, fx.dim as [number, number][]);
  sky.m.opacity = 0.55 * keyNum(t, fx.sky as [number, number][]);

  camera.position.set(0, 0.25, keyNum(t, timeline.camera as [number, number][]));
  camera.lookAt(0, 0.3, 0);

  const [f0, f1] = timeline.flip;
  const flip = Math.PI * easeInOut(clamp((t - f0) / (f1 - f0)));
  const spin = keyNum(t, fx.spin as [number, number][]);
  const sway = 0.12 * Math.sin(t * 0.35) * (1 - w.wave - w.cells - w.eye) + 0.35 * Math.sin(t * 0.3) * w.network;

  return (
    <>
      <points geometry={sky.g} material={sky.m} />
      <group rotation={[0.05 * Math.sin(t * 0.25), flip + spin + sway, 0]}>
        <points geometry={geom} material={mat} frustumCulled={false} />
      </group>
    </>
  );
};

const lerp3 = (a: RGB, b: RGB, x: number): RGB => [a[0] + (b[0] - a[0]) * x, a[1] + (b[1] - a[1]) * x, a[2] + (b[2] - a[2]) * x];
