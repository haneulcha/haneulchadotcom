// Differential-area caustics ported from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
// 원리 해설: https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c
import * as THREE from 'three';

import { WAVE_GLSL } from './water';

export type CausticsBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * 커스틱은 **시뮬레이션된 수면에서 계산**한다 — 스크롤 텍스처가 아니다.
 * 태양광선을 수면 노멀로 굴절시켜 바닥 히트 지점으로 정점을 옮기고,
 * 변형 전/후 면적비를 강도로 쓴다. 그래서 파문을 만들면 그 자리 커스틱이 함께 변한다
 * (체크리스트 #5 — 이 항목이 아마추어와 프로를 가른다).
 */
const CAUSTIC_VERT = /* glsl */ `
${WAVE_GLSL}

uniform float uTime;
uniform sampler2D uRippleTex;
uniform float uRippleAmount;
uniform vec4 uBounds;   // minX, maxX, minZ, maxZ
uniform float uFloorY;
uniform vec3 uSunDir;
uniform float uGain;

varying vec3 vOldPos;
varying vec3 vNewPos;

vec2 toNdc(vec2 world) {
  vec2 t = vec2(
    (world.x - uBounds.x) / (uBounds.y - uBounds.x),
    (world.y - uBounds.z) / (uBounds.w - uBounds.z)
  );
  return t * 2.0 - 1.0;
}

void main() {
  // position은 물 평면과 같은 격자. uv로 월드 좌표를 복원한다.
  vec2 world = vec2(
    mix(uBounds.x, uBounds.y, uv.x),
    mix(uBounds.z, uBounds.w, 1.0 - uv.y)
  );

  float h = surfaceH(world, uTime);
  vec2 d = surfaceD(world, uTime);
  vec4 ripple = texture2D(uRippleTex, vec2(uv.x, 1.0 - uv.y));
  h += ripple.r * uRippleAmount;
  d += ripple.ba * uRippleAmount;

  // 정오의 잔물결은 진폭이 0.025로 낮아 그대로는 굴절이 거의 수렴하지 않는다.
  // 커스틱 패스에서만 기울기를 증폭한다 — 수면 자체의 모양은 건드리지 않는다.
  vec3 n = normalize(vec3(-d.x * uGain, 1.0, -d.y * uGain));
  vec3 surface = vec3(world.x, h, world.y);

  // 물속으로 굴절 (공기 → 물, 1/1.333)
  vec3 refracted = refract(-uSunDir, n, 1.0 / 1.333);
  float t = (uFloorY - surface.y) / min(refracted.y, -0.05);
  vec3 hit = surface + refracted * t;

  // 교란이 없었다면 닿았을 자리 (평평한 수면 기준)
  vOldPos = vec3(world.x, uFloorY, world.y);
  vNewPos = hit;

  gl_Position = vec4(toNdc(hit.xz), 0.0, 1.0);
}
`;

const CAUSTIC_FRAG = /* glsl */ `
precision highp float;
uniform float uThreshold;
varying vec3 vOldPos;
varying vec3 vNewPos;

void main() {
  // 면적비 — 광선이 모이면(면적이 줄면) 밝아진다.
  float oldArea = length(dFdx(vOldPos)) * length(dFdy(vOldPos));
  float newArea = length(dFdx(vNewPos)) * length(dFdy(vNewPos));
  // 평평한 수면이면 1.0. 1보다 크면 광선이 모인 것 = 밝은 마크.
  float intensity = oldArea / max(newArea, 1e-6);

  // Hockney 포스터라이즈 — **커스틱 강도 필드**에 대한 임계값이다.
  // 합성된 최종 이미지를 임계하면 스타일이 아니라 밴딩이 된다 (스펙 실패 모드).
  float mark = smoothstep(uThreshold, uThreshold + 0.02, intensity);
  float mid = smoothstep(uThreshold - 0.05, uThreshold - 0.03, intensity) * 0.35;
  gl_FragColor = vec4(vec3(max(mark, mid)), 1.0);
}
`;

export type Caustics = {
  texture: THREE.Texture;
  update(rippleTex: THREE.Texture, time: number, rippleAmount: number): void;
  setBounds(b: CausticsBounds, floorY: number): void;
  dispose(): void;
};

export function createCaustics(
  renderer: THREE.WebGLRenderer,
  size: number,
  bounds: CausticsBounds,
  floorY: number,
  sunDir: THREE.Vector3,
): Caustics {
  const target = new THREE.WebGLRenderTarget(size, size, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const segments = 192;
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRippleTex: { value: null },
      uRippleAmount: { value: 0 },
      uBounds: {
        value: new THREE.Vector4(
          bounds.minX,
          bounds.maxX,
          bounds.minZ,
          bounds.maxZ,
        ),
      },
      uFloorY: { value: floorY },
      uSunDir: { value: sunDir.clone().normalize() },
      uThreshold: { value: 1.04 }, // 판단 필요 (J4). 1.0 = 평평한 수면
      uGain: { value: 8.0 }, // 커스틱 전용 기울기 증폭. 판단 필요 (J4)
    },
    vertexShader: CAUSTIC_VERT,
    fragmentShader: CAUSTIC_FRAG,
    blending: THREE.AdditiveBlending,
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(geometry, material));

  return {
    texture: target.texture,
    update(rippleTex, time, rippleAmount) {
      material.uniforms.uRippleTex.value = rippleTex;
      material.uniforms.uRippleAmount.value = rippleAmount;
      material.uniforms.uTime.value = time;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, false, false);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
    },
    setBounds(b, y) {
      material.uniforms.uBounds.value.set(b.minX, b.maxX, b.minZ, b.maxZ);
      material.uniforms.uFloorY.value = y;
    },
    dispose() {
      target.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * 부표 실루엣의 탑다운 마스크.
 * R = 실제 크기(그림자), G = 살짝 키운 것 → G-R이 접촉 포말 링이 된다.
 * 하드 엣지가 스타일이므로 블러하지 않는다.
 */
export type FloatMask = {
  texture: THREE.Texture;
  update(meshes: THREE.Object3D[], camera: THREE.Camera): void;
  dispose(): void;
};

export function createFloatMask(
  renderer: THREE.WebGLRenderer,
  size: number,
): FloatMask {
  const target = new THREE.WebGLRenderTarget(size, size, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const inner = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const outer = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const scene = new THREE.Scene();

  return {
    texture: target.texture,
    update(meshes, camera) {
      scene.clear();
      // 바깥(초록, 살짝 키움) 먼저 → 안쪽(빨강)이 덮어쓴다. 차이가 접촉 링.
      for (const m of meshes) {
        const big = m.clone();
        big.scale.multiplyScalar(1.09);
        (big as THREE.Mesh).material = outer;
        scene.add(big);
      }
      for (const m of meshes) {
        const c = m.clone();
        (c as THREE.Mesh).material = inner;
        scene.add(c);
      }
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, true, false);
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
      scene.clear();
    },
    dispose() {
      target.dispose();
      inner.dispose();
      outer.dispose();
    },
  };
}
