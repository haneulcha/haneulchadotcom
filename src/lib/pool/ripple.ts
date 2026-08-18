// Ripple simulation ported from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
// 2D 파동 방정식을 핑퐁 렌더 타깃 위에서 푼다.
import * as THREE from 'three';

export type RippleBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type RippleSim = {
  texture: THREE.Texture;
  setBounds(b: RippleBounds): void;
  addImpulse(
    worldX: number,
    worldZ: number,
    strength: number,
    radius: number,
  ): void;
  step(dt: number): void;
  /** 매 프레임 1회 64² 스냅숏에서 읽는다 — 부표마다 GPU 동기화를 일으키지 않도록. */
  readback(): void;
  sampleHeight(worldX: number, worldZ: number): number;
  sampleNormal(worldX: number, worldZ: number): { x: number; z: number };
  setPaused(v: boolean): void;
  dispose(): void;
};

const FIXED_STEP = 1 / 60;

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// r = 높이, g = 속도, ba = 월드 단위 높이 기울기 (water.ts가 노멀 보정에 쓴다)
const UPDATE_FRAG = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform float uDamping;
uniform vec2 uWorldPerTexel;
varying vec2 vUv;

void main() {
  vec4 s = texture2D(uPrev, vUv);
  // ClampToEdgeWrapping이므로 경계에서 라플라시안이 자연 반사 조건이 된다 (#9).
  float l = texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r;
  float d = texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float u = texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r;

  // Evan Wallace의 검증된 형태를 그대로 쓴다. 적분 스텝을 렌더 dt에 묶으면
  // 프레임률이 떨어질 때 계수가 커져 발산한다 (실제로 겪었다) — 호출 측에서
  // 고정 타임스텝으로 부르고, 셰이더는 스텝당 항상 같은 계수를 쓴다.
  float avg = (l + r + d + u) * 0.25;
  float vel = (s.g + (avg - s.r)) * uDamping;
  float h = clamp(s.r + vel, -2.0, 2.0); // 안전 클램프

  vec2 grad = vec2((r - l) / (2.0 * uWorldPerTexel.x), (u - d) / (2.0 * uWorldPerTexel.y));
  gl_FragColor = vec4(h, vel, grad);
}
`;

const DROP_FRAG = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec4 s = texture2D(uPrev, vUv);
  float d = distance(vUv, uCenter);
  float drop = uStrength * exp(-(d * d) / (uRadius * uRadius));
  gl_FragColor = vec4(s.r + drop, s.g, s.ba);
}
`;

export function createRipple(
  renderer: THREE.WebGLRenderer,
  size: number,
  bounds: RippleBounds,
): RippleSim {
  const supportsFloat = renderer.capabilities.isWebGL2;
  const type = supportsFloat ? THREE.FloatType : THREE.HalfFloatType;
  const opts: THREE.RenderTargetOptions = {
    type,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  };

  let a = new THREE.WebGLRenderTarget(size, size, opts);
  let b = new THREE.WebGLRenderTarget(size, size, opts);
  const snapshotSize = 64;
  const snapshot = new THREE.WebGLRenderTarget(snapshotSize, snapshotSize, {
    ...opts,
    minFilter: THREE.LinearFilter,
  });
  const snapshotPixels = new Float32Array(snapshotSize * snapshotSize * 4);

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);

  const updateMat = new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: null },
      uTexel: { value: new THREE.Vector2(1 / size, 1 / size) },
      uDamping: { value: 0.995 }, // 판단 필요 (J4)
      uWorldPerTexel: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: QUAD_VERT,
    fragmentShader: UPDATE_FRAG,
  });
  const dropMat = new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: null },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uRadius: { value: 0.02 },
      uStrength: { value: 0.1 },
    },
    vertexShader: QUAD_VERT,
    fragmentShader: DROP_FRAG,
  });
  const copyMat = new THREE.MeshBasicMaterial();
  const quad: THREE.Mesh<THREE.PlaneGeometry, THREE.Material> = new THREE.Mesh(
    quadGeo,
    updateMat,
  );
  quadScene.add(quad);

  let box = bounds;
  let paused = false;
  let readbackPending = false;
  let accumulator = 0;

  function updateWorldPerTexel() {
    updateMat.uniforms.uWorldPerTexel.value.set(
      (box.maxX - box.minX) / size,
      (box.maxZ - box.minZ) / size,
    );
  }
  updateWorldPerTexel();

  function toUv(worldX: number, worldZ: number) {
    return {
      u: (worldX - box.minX) / (box.maxX - box.minX),
      v: (worldZ - box.minZ) / (box.maxZ - box.minZ),
    };
  }

  function runPass(material: THREE.Material, target: THREE.WebGLRenderTarget) {
    quad.material = material;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCamera);
    renderer.setRenderTarget(prevTarget);
  }

  function swap() {
    const t = a;
    a = b;
    b = t;
  }

  return {
    get texture() {
      return a.texture;
    },
    setBounds(next: RippleBounds) {
      box = next;
      updateWorldPerTexel();
    },
    addImpulse(worldX, worldZ, strength, radius) {
      if (paused) return;
      const { u, v } = toUv(worldX, worldZ);
      if (u < 0 || u > 1 || v < 0 || v > 1) return;
      dropMat.uniforms.uPrev.value = a.texture;
      dropMat.uniforms.uCenter.value.set(u, v);
      dropMat.uniforms.uRadius.value = radius;
      dropMat.uniforms.uStrength.value = strength;
      runPass(dropMat, b);
      swap();
    },
    /**
     * 고정 타임스텝(1/60초)으로 적분한다. 프레임률과 무관하게 같은 계수를 쓰므로
     * 저프레임에서도 발산하지 않는다. 밀린 시간은 최대 3스텝까지만 따라잡는다 —
     * 탭이 백그라운드에 오래 있다 돌아왔을 때 한 프레임에서 폭주하지 않도록.
     */
    step(dt) {
      if (paused) return;
      accumulator = Math.min(accumulator + dt, FIXED_STEP * 3);
      while (accumulator >= FIXED_STEP) {
        accumulator -= FIXED_STEP;
        updateMat.uniforms.uPrev.value = a.texture;
        runPass(updateMat, b);
        swap();
      }
    },
    readback() {
      // 동기 readRenderTargetPixels는 GPU 파이프라인을 멈춘다 — 매 프레임 돌리면
      // 프레임 시간을 통째로 잡아먹는다. 비동기 경로를 쓰고, 부표 8개의 부력에
      // 60Hz 정밀도가 필요하지 않으므로 주기도 낮춘다. 한 프레임 지연은 안 보인다.
      if (readbackPending) return;
      readbackPending = true;
      copyMat.map = a.texture;
      quad.material = copyMat;
      const prevTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(snapshot);
      renderer.render(quadScene, quadCamera);
      renderer.setRenderTarget(prevTarget);
      renderer
        .readRenderTargetPixelsAsync(
          snapshot,
          0,
          0,
          snapshotSize,
          snapshotSize,
          snapshotPixels,
        )
        .catch(() => {})
        .finally(() => {
          readbackPending = false;
        });
    },
    sampleHeight(worldX, worldZ) {
      const { u, v } = toUv(worldX, worldZ);
      const x = Math.min(
        snapshotSize - 1,
        Math.max(0, Math.round(u * (snapshotSize - 1))),
      );
      const y = Math.min(
        snapshotSize - 1,
        Math.max(0, Math.round(v * (snapshotSize - 1))),
      );
      return snapshotPixels[(y * snapshotSize + x) * 4] || 0;
    },
    sampleNormal(worldX, worldZ) {
      const { u, v } = toUv(worldX, worldZ);
      const x = Math.min(
        snapshotSize - 1,
        Math.max(0, Math.round(u * (snapshotSize - 1))),
      );
      const y = Math.min(
        snapshotSize - 1,
        Math.max(0, Math.round(v * (snapshotSize - 1))),
      );
      const i = (y * snapshotSize + x) * 4;
      return { x: snapshotPixels[i + 2] || 0, z: snapshotPixels[i + 3] || 0 };
    },
    setPaused(v) {
      paused = v;
    },
    dispose() {
      a.dispose();
      b.dispose();
      snapshot.dispose();
      quadGeo.dispose();
      updateMat.dispose();
      dropMat.dispose();
      copyMat.dispose();
    },
  };
}
