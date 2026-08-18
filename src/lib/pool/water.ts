// Water simulation adapted from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
import * as THREE from 'three';

import { WATER_Y, type PoolColors } from './constants';

// 판단 필요 (J4): 정오의 잔물결 — 낮은 진폭. 방향(xz) / 파장 / 진폭 / 속도.
const WAVES = [
  { dir: [1.0, 0.3], length: 1.8, amp: 0.025, speed: 0.6 },
  { dir: [-0.6, 1.0], length: 1.1, amp: 0.018, speed: 0.9 },
  { dir: [0.3, -1.0], length: 0.6, amp: 0.01, speed: 1.3 },
] as const;

function waveConstants(): string {
  return WAVES.map((w, i) => {
    const [dx, dz] = w.dir;
    const len = Math.hypot(dx, dz);
    return `const vec4 W${i} = vec4(${(dx / len).toFixed(4)}, ${(dz / len).toFixed(4)}, ${(
      (Math.PI * 2) /
      w.length
    ).toFixed(4)}, ${w.speed.toFixed(4)});
const float A${i} = ${w.amp.toFixed(4)};`;
  }).join('\n');
}

const VERT = /* glsl */ `
${waveConstants()}

uniform float uTime;
uniform sampler2D uRippleTex;
uniform float uRippleAmount;
uniform vec2 uWaterMinMaxZ;

varying vec3 vWorld;
varying vec3 vNormal2;
varying vec2 vScreenUv;
varying float vDepthT;

// 높이장과 그 해석적 미분. 진폭이 낮아 순수 사인 합으로 두고, 노멀은 미분에서 얻는다.
float waveH(vec2 p, vec4 w, float a) {
  return a * sin(dot(w.xy, p) * w.z + uTime * w.w);
}
vec2 waveD(vec2 p, vec4 w, float a) {
  float c = a * w.z * cos(dot(w.xy, p) * w.z + uTime * w.w);
  return vec2(c * w.x, c * w.y);
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vec2 p = world.xz;

  float h = waveH(p, W0, A0) + waveH(p, W1, A1) + waveH(p, W2, A2);
  vec2 d = waveD(p, W0, A0) + waveD(p, W1, A1) + waveD(p, W2, A2);

  // Task 7의 물결 시뮬 높이. uRippleAmount가 0이면 무시된다.
  // plane을 -90° 눕히면 uv.y가 world z와 반대 방향이 된다.
  vec2 rippleUv = vec2(uv.x, 1.0 - uv.y);
  vec4 ripple = texture2D(uRippleTex, rippleUv);
  h += ripple.r * uRippleAmount;
  d += ripple.ba * uRippleAmount;

  world.y = ${WATER_Y.toFixed(1)} + h;
  vWorld = world.xyz;
  vNormal2 = normalize(vec3(-d.x, 1.0, -d.y));
  vDepthT = clamp(
    (world.z - uWaterMinMaxZ.x) / (uWaterMinMaxZ.y - uWaterMinMaxZ.x),
    0.0, 1.0
  );

  vec4 clip = projectionMatrix * viewMatrix * world;
  vScreenUv = clip.xy / clip.w * 0.5 + 0.5;
  gl_Position = clip;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uShallow;
uniform vec3 uMid;
uniform vec3 uDeep;
uniform sampler2D uSceneTex;
uniform vec3 uSunDir;
uniform vec3 uVirtualEye;

varying vec3 vWorld;
varying vec3 vNormal2;
varying vec2 vScreenUv;
varying float vDepthT;

void main() {
  vec3 n = normalize(vNormal2);

  // #1 수심 밴드 — 부드러운 그라디언트가 아니라 하드 경계 3단.
  // 양자화 대상은 **수심 필드**다 (합성 이미지가 아니라). 스펙 「시각 스타일」.
  vec3 waterColor = uShallow;
  waterColor = mix(waterColor, uMid, step(0.33, vDepthT));
  waterColor = mix(waterColor, uDeep, step(0.66, vDepthT));

  // #3 굴절 + #4 어긋남이 수심에 비례
  vec2 refractUv = vScreenUv + n.xz * (0.02 + 0.06 * vDepthT);
  vec3 floorSeen = texture2D(uSceneTex, clamp(refractUv, 0.001, 0.999)).rgb;

  // #2 프레넬. 탑다운 정사영이라 실제 카메라로 계산하면 화면 전체가 균일해진다.
  // 데크 위쪽에 놓인 가상 시점을 써서 먼 쪽일수록 시선각이 낮아지게 한다.
  vec3 viewDir = normalize(uVirtualEye - vWorld);
  // 가상 시점만으로는 깊은 쪽 물색이 어두워 상쇄되어 먼 가장자리가 밝아지지 않았다.
  // 계획이 지정한 대체 근사: 수심 가중을 더해 먼 쪽 반사를 확실히 세운다.
  float grazing = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  float fresnel = smoothstep(0.6, 1.0, vDepthT) * 0.5 + grazing;
  vec3 sky = vec3(0.92, 0.97, 1.0);

  vec3 color = mix(floorSeen * waterColor, sky, clamp(fresnel, 0.0, 1.0) * 0.6);

  // 정오 스페큘러 — 좁고 하드한 하이라이트
  float spec = pow(max(dot(reflect(-uSunDir, n), viewDir), 0.0), 240.0);
  color += spec * 0.8;

  gl_FragColor = vec4(color, 1.0);
}
`;

/** 물결 시뮬 높이에 곱하는 배율. 판단 필요 (J4). */
export const RIPPLE_AMOUNT = 0.35;

const CPU_WAVES = WAVES.map((w) => {
  const len = Math.hypot(w.dir[0], w.dir[1]);
  return {
    dx: w.dir[0] / len,
    dz: w.dir[1] / len,
    k: (Math.PI * 2) / w.length,
    amp: w.amp,
    speed: w.speed,
  };
});

/** 셰이더 버텍스와 같은 높이장 — 부력이 CPU에서 같은 값을 봐야 한다. */
export function gerstnerHeight(x: number, z: number, t: number): number {
  let h = 0;
  for (const w of CPU_WAVES)
    h += w.amp * Math.sin((w.dx * x + w.dz * z) * w.k + t * w.speed);
  return h;
}

export function gerstnerGradient(
  x: number,
  z: number,
  t: number,
): { x: number; z: number } {
  let gx = 0;
  let gz = 0;
  for (const w of CPU_WAVES) {
    const c = w.amp * w.k * Math.cos((w.dx * x + w.dz * z) * w.k + t * w.speed);
    gx += c * w.dx;
    gz += c * w.dz;
  }
  return { x: gx, z: gz };
}

export type Water = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  update(t: number): void;
  dispose(): void;
};

export function createWater(
  colors: PoolColors,
  worldWidth: number,
  waterDepth: number,
  centerZ: number,
  segments: number,
): Water {
  const geometry = new THREE.PlaneGeometry(
    worldWidth,
    waterDepth,
    segments,
    segments,
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(colors.shallow) },
      uMid: { value: new THREE.Color(colors.mid) },
      uDeep: { value: new THREE.Color(colors.deep) },
      uSceneTex: { value: null },
      uRippleTex: { value: null },
      uRippleAmount: { value: 0 }, // Task 7에서 켠다
      uWaterMinMaxZ: {
        value: new THREE.Vector2(
          centerZ - waterDepth / 2,
          centerZ + waterDepth / 2,
        ),
      },
      uSunDir: { value: new THREE.Vector3(0.15, 1, 0.1).normalize() },
      // 데크 쪽 위에 선 가상 시점 — 먼 쪽일수록 시선각이 낮아진다.
      uVirtualEye: {
        value: new THREE.Vector3(0, 3.0, centerZ - waterDepth / 2 - 1.0),
      },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, WATER_Y, centerZ);
  mesh.renderOrder = 1;

  return {
    mesh,
    material,
    geometry,
    update(t: number) {
      material.uniforms.uTime.value = t;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
