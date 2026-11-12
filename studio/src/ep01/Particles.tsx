import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AUX, buildShapes, buildSky, BUBBLES, FLAGS, N, STATES, State, TARGET } from "./shapes";
import { clamp, easeInOut, easeOutExpo, keyNum } from "../components/anim";
import timeline from "../../../episodes/EP01_存在/timeline.json";

type RGB = [number, number, number];
const STYLE: Record<State, { color: RGB; color2: RGB; size: number; gain: number }> = {
  point: { color: [1.0, 0.92, 0.78], color2: [1.0, 0.8, 0.55], size: 0.5, gain: 0.35 },
  lineage: { color: [1.0, 0.8, 0.5], color2: [0.6, 0.78, 1.0], size: 1.25, gain: 2.1 },
  race: { color: [0.85, 0.9, 1.0], color2: [1.0, 0.85, 0.6], size: 1.0, gain: 1.4 },
  earth: { color: [0.35, 0.65, 1.0], color2: [0.9, 0.95, 1.0], size: 1.0, gain: 1.3 },
  cosmos: { color: [0.75, 0.82, 1.0], color2: [1.0, 0.8, 0.6], size: 1.2, gain: 1.5 },
  haze: { color: [0.6, 0.7, 0.95], color2: [0.7, 0.75, 1.0], size: 1.3, gain: 1.2 },
  holes: { color: [1.0, 0.55, 0.4], color2: [0.9, 0.4, 0.9], size: 1.1, gain: 0.9 },
  star: { color: [1.0, 0.82, 0.5], color2: [1.0, 0.6, 0.35], size: 0.9, gain: 0.8 },
  triple: { color: [1.0, 0.85, 0.6], color2: [0.7, 0.85, 1.0], size: 0.9, gain: 1.1 },
  carbon: { color: [1.0, 0.82, 0.45], color2: [0.6, 0.8, 1.0], size: 0.9, gain: 1.15 },
  puddle: { color: [0.85, 0.65, 0.42], color2: [0.95, 0.8, 0.6], size: 1.0, gain: 1.2 },
  bubbles: { color: [0.55, 0.65, 0.9], color2: [0.7, 0.75, 1.0], size: 1.2, gain: 1.7 },
};

const K = STATES.length;
const iHaze = STATES.indexOf("haze");
const ATTR = STATES.filter((_, i) => i !== iHaze);
const iRace = STATES.indexOf("race"), iEarth = STATES.indexOf("earth"), iPuddle = STATES.indexOf("puddle"), iBub = STATES.indexOf("bubbles"), iLin = STATES.indexOf("lineage");
const vert = /* glsl */ `
  ${STATES.map((_, i) => (i === iHaze ? "" : `attribute vec3 p${i};`)).join(" ")}
  attribute vec3 aux;   // seed, lineage height, branch id
  attribute vec4 flags; // winner, zone, bubble id, water
  uniform float uW[${K}];
  uniform float uTime; uniform float uSize; uniform float uPx;
  uniform vec3 cA; uniform vec3 cB;
  uniform float uGrow; uniform float uRace; uniform float uRaceVis; uniform float uZone; uniform float uLit; uniform float uEvap;
  uniform vec3 uTarget;
  varying vec3 vColor; varying float vSeed; varying float vBright;
  void main() {
    float seed = aux.x;
    // race: everyone swims toward the target; only the winner arrives
    float spd = 0.55 + 0.75 * fract(seed * 3.1);
    float prog = clamp(uRace * spd, 0.0, mix(0.86, 1.0, flags.x));
    vec3 raceP = p${iRace} + (uTarget - p${iRace}) * prog + vec3(0.0, 0.25 * sin(uTime * 3.0 + seed * 40.0) * (1.0 - prog), 0.0);
    vec3 hazeP = vec3((fract(sin(seed * 127.1) * 43758.5453) - 0.5) * 11.0, (fract(sin(seed * 311.7) * 24634.6345) - 0.5) * 6.0 + 0.3, (fract(sin(seed * 74.7) * 31415.9265) - 0.5) * 6.0);
    vec3 p = ${STATES.map((_, i) => (i === iRace ? `raceP*uW[${i}]` : i === iHaze ? `hazeP*uW[${i}]` : `p${i}*uW[${i}]`)).join(" + ")};
    // evaporation lifts water particles
    float wet = flags.w * uW[${iPuddle}];
    p.y += wet * uEvap * (0.6 + 2.6 * fract(seed * 5.3));
    p.x += wet * uEvap * 0.4 * sin(seed * 31.0 + uTime);
    p += 0.016 * vec3(sin(uTime*0.9 + seed*61.0), cos(uTime*0.7 + seed*37.0), sin(uTime*0.8 + seed*13.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float s = uSize * (0.55 + 0.9 * fract(seed * 7.13));
    gl_PointSize = s * uPx / -mv.z;
    vColor = mix(cA, cB, step(0.82, fract(seed * 3.7)));
    float b = 1.0;
    // lineage growth: reveal upward; branches die once growth has passed them; trunk tip glows
    float wl = uW[${iLin}];
    float shown = smoothstep(aux.y - 0.015, aux.y, uGrow);
    float isBranch = step(0.0001, aux.z);
    float dead = isBranch * smoothstep(aux.y + 0.05, aux.y + 0.2, uGrow);
    float dt = (aux.y - uGrow) / 0.025;
    float tip = (1.0 - isBranch) * exp(-dt * dt);
    b *= mix(1.0, shown * (1.0 - 0.92 * dead) * (1.0 + 2.5 * tip), wl);
    vColor = mix(vColor, vec3(1.0, 0.85, 0.55), wl * (1.0 - isBranch) * 0.6);
    // race: losers fade out as they near the target
    float lose = (1.0 - flags.x) * smoothstep(0.45, 0.84, prog);
    b *= 1.0 - uRaceVis * lose;
    b *= 1.0 + uRaceVis * flags.x * 2.5;
    // earth: the deadly 13% glows red
    float zone = flags.y * uZone * uW[${iEarth}];
    vColor = mix(vColor, vec3(1.0, 0.25, 0.18), zone);
    b *= 1.0 + 0.6 * zone;
    // puddle: water is blue; it fades as it evaporates
    vColor = mix(vColor, vec3(0.45, 0.75, 1.0), wet);
    b *= 1.0 - wet * uEvap * 0.85 * fract(seed * 2.9 + 0.3);
    // bubbles: only ours is lit
    float ours = step(flags.z, ${(0.5 / BUBBLES).toFixed(4)}) * uW[${iBub}];
    float others = (1.0 - step(flags.z, ${(0.5 / BUBBLES).toFixed(4)})) * uW[${iBub}];
    vColor = mix(vColor, vec3(1.0, 0.82, 0.45), ours * uLit);
    b *= 1.0 + ours * uLit * 1.8 - others * uLit * 0.55;
    vBright = b; vSeed = seed;
  }
`;
const frag = /* glsl */ `
  uniform float uGain; varying vec3 vColor; varying float vSeed; varying float vBright;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    float a = smoothstep(0.5, 0.0, d); a *= a;
    float tw = 0.75 + 0.25 * fract(vSeed * 91.7);
    vec3 col = max(vColor * a * uGain * tw * vBright, 0.0);
    gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
  }
`;

const keys = timeline.particles as [number, State][];
const FAST = new Set(["holes"]);
export const stateMix = (t: number) => {
  const w = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<State, number>;
  if (t <= keys[0][0]) { w[keys[0][1]] = 1; return w; }
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, s0] = keys[i], [t1, s1] = keys[i + 1];
    if (t < t1) {
      const x = (t - t0) / (t1 - t0);
      const e = FAST.has(s1) ? easeOutExpo(x) : easeInOut(x);
      w[s0] += 1 - e; w[s1] += e;
      return w;
    }
  }
  w[keys[keys.length - 1][1]] = 1;
  return w;
};

const fx = timeline.fx as unknown as Record<string, [number, number][]>;
const kf = (name: string, t: number) => keyNum(t, fx[name]);

export const Particles: React.FC<{ t: number; height: number; cam?: [number, number, number]; boost?: number }> = ({ t, height, cam, boost = 1 }) => {
  const { camera } = useThree();
  const { geom, mat, sky } = useMemo(() => {
    const shapes = buildShapes();
    const g = new THREE.BufferGeometry();
    STATES.forEach((s, i) => { if (i !== iHaze) g.setAttribute(`p${i}`, new THREE.BufferAttribute(shapes[s], 3)); });
    void ATTR;
    g.setAttribute("position", new THREE.BufferAttribute(shapes.point, 3));
    g.setAttribute("aux", new THREE.BufferAttribute(AUX, 3));
    g.setAttribute("flags", new THREE.BufferAttribute(FLAGS, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    const m = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
      // pure additive in colour AND alpha: dark particles add nothing (no dark halos over the CSS background)
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uW: { value: new Array(K).fill(0) }, cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() },
        uTime: { value: 0 }, uSize: { value: 1 }, uPx: { value: 1 }, uGain: { value: 1 },
        uGrow: { value: 0 }, uRace: { value: 0 }, uRaceVis: { value: 0 }, uZone: { value: 0 }, uLit: { value: 0 }, uEvap: { value: 0 },
        uTarget: { value: new THREE.Vector3(...TARGET) },
      },
    });
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(buildSky(), 3));
    const sm = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0x9fb4d8, transparent: true, opacity: 0, depthWrite: false });
    return { geom: g, mat: m, sky: { g: sg, m: sm } };
  }, []);
  void N;

  const w = stateMix(t);
  const blend = (f: (s: State) => number) => STATES.reduce((a, s) => a + w[s] * f(s), 0);
  const blendC = (k: "color" | "color2") => [0, 1, 2].map((j) => STATES.reduce((a, s) => a + w[s] * STYLE[s][k][j], 0)) as RGB;
  const u = mat.uniforms;
  u.uW.value = STATES.map((s) => w[s]);
  u.cA.value.setRGB(...blendC("color"));
  u.cB.value.setRGB(...blendC("color2"));
  u.uTime.value = t;
  u.uPx.value = height * 0.022;
  u.uSize.value = blend((s) => STYLE[s].size);
  for (const k of ["uGrow", "uRace", "uRaceVis", "uZone", "uLit", "uEvap"]) u[k].value = kf(k.slice(1, 2).toLowerCase() + k.slice(2), t);
  u.uGain.value = blend((s) => STYLE[s].gain) * clamp((t - 0.3) / 1.5) * kf("dim", t) * boost;
  sky.m.opacity = 0.55 * kf("sky", t);

  const camZ = keyNum(t, timeline.camera as [number, number][]);
  const camY = keyNum(t, timeline.cameraY as [number, number][]);
  if (cam) { camera.position.set(cam[0], cam[1], cam[2]); camera.lookAt(cam[0], cam[1] + 0.05, 0); }
  else { camera.position.set(0, camY, camZ); camera.lookAt(0, camY + 0.05, 0); }

  const spin = kf("spin", t) + 0.1 * Math.sin(t * 0.3) * (w.earth + w.cosmos + w.star + w.bubbles + w.carbon + w.triple);
  return (
    <>
      <points geometry={sky.g} material={sky.m} />
      <group rotation={[0.04 * Math.sin(t * 0.25), spin, 0]}>
        <points geometry={geom} material={mat} frustumCulled={false} />
      </group>
    </>
  );
};

export { easeInOut };
