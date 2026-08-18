// Water simulation adapted from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
import * as THREE from 'three';

import {
  DECK_FRACTION,
  FLOOR_DEEP,
  FLOOR_SHALLOW,
  WORLD_DEPTH,
  type PoolColors,
  type SceneFloat,
} from './constants';
import {
  createFloats,
  disposeFloats,
  repositionFloats,
  updateFloats,
  type FloatObject,
  type WaveSampler,
} from './floats';
import { worldZFromTopFraction } from './geometry';
import {
  createCaustics,
  createFloatMask,
  type Caustics,
  type FloatMask,
} from './caustics';
import { createRipple, type RippleSim } from './ripple';
import {
  createWater,
  gerstnerGradient,
  gerstnerHeight,
  RIPPLE_AMOUNT,
  type Water,
} from './water';

export type PoolSceneOptions = {
  colors: PoolColors;
  floats: SceneFloat[];
  reducedMotion: boolean;
  rippleSize: 512 | 256;
  /** 매 프레임, 부표별 화면 좌표(%)를 콜백 — PoolShell이 프록시 style에 반영 */
  onProxyMove: (id: string, leftPct: number, topPct: number) => void;
  onReady: () => void; // 첫 프레임 렌더 후 1회
};

export type PoolScene = {
  start(): void;
  stop(): void;
  dispose(): void;
  setReducedMotion(v: boolean): void;
};

const DECK_Z = worldZFromTopFraction(DECK_FRACTION); // 데크와 물의 경계

/** 프로시저럴 타일 바닥. 텍스처 에셋을 쓰지 않는다 (스펙 「시각 스타일」). */
function createFloor(colors: PoolColors, worldWidth: number) {
  const geometry = new THREE.PlaneGeometry(
    worldWidth,
    WORLD_DEPTH / 2 - DECK_Z,
  );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      // 순백이면 커스틱(거의 순백)이 얹힐 헤드룸이 없다 — 흰 위의 흰색은 안 보인다.
      // 물빛이 밴 옅은 타일로 두어야 흰 마크가 마크로 읽힌다.
      uTile: { value: new THREE.Color(0xcfe4ea) },
      uLine: { value: new THREE.Color(colors.tileLine) },
      uScale: { value: 3.0 },
      uCaustics: { value: null },
      uMask: { value: null },
      uCaustic: { value: new THREE.Color(colors.caustic) },
      uBounds: { value: new THREE.Vector4(-1, 1, -1, 1) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTile;
      uniform vec3 uLine;
      uniform float uScale;
      uniform sampler2D uCaustics;
      uniform sampler2D uMask;
      uniform vec3 uCaustic;
      uniform vec4 uBounds;
      varying vec3 vWorld;
      void main() {
        vec2 g = fract(vWorld.xz * uScale);
        vec2 d = min(g, 1.0 - g);
        float line = 1.0 - smoothstep(0.0, 0.035, min(d.x, d.y));
        vec3 base = mix(uTile, uLine, line);

        vec2 nuv = vec2(
          (vWorld.x - uBounds.x) / (uBounds.y - uBounds.x),
          (vWorld.z - uBounds.z) / (uBounds.w - uBounds.z)
        );
        float caustic = texture2D(uCaustics, nuv).r;
        // 마스크 카메라는 v가 뒤집혀 있다.
        float shadow = texture2D(uMask, vec2(nuv.x, 1.0 - nuv.y)).r;

        // #10 그림자가 바닥을 어둡게 하고, 그 안에서 커스틱이 죽는다.
        base *= 1.0 - shadow * 0.45;
        base = mix(base, uCaustic, clamp(caustic, 0.0, 1.0) * (1.0 - shadow));
        gl_FragColor = vec4(base, 1.0);
      }
    `,
  });
  // 데크 아래(먼 쪽) 물 영역만 덮는다. 바닥은 얕은 쪽에서 깊은 쪽으로 기운다.
  const waterDepth = WORLD_DEPTH / 2 - DECK_Z;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    0,
    (FLOOR_SHALLOW + FLOOR_DEEP) / 2,
    DECK_Z + waterDepth / 2,
  );
  mesh.rotation.x =
    -Math.PI / 2 + Math.atan2(FLOOR_SHALLOW - FLOOR_DEEP, waterDepth);
  return { mesh, geometry, material };
}

function createDeck(colors: PoolColors, worldWidth: number) {
  const deckDepth = DECK_Z + WORLD_DEPTH / 2;
  const geometry = new THREE.PlaneGeometry(worldWidth, deckDepth);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colors.deck),
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.5, -WORLD_DEPTH / 2 + deckDepth / 2);
  return { mesh, geometry, material };
}

export function createPoolScene(
  canvas: HTMLCanvasElement,
  opts: PoolSceneOptions,
): PoolScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.colors.deck);

  // 고정 orthographic 탑다운. 움직이지 않는다 (스펙 「렌더링 아키텍처」).
  // up = (0,0,-1) 이므로 화면 위 = -z = 데크 쪽.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 10, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  // 정오의 태양: 거의 수직 + 약간의 기울기 → 짧고 진한 그림자
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1.5, 10, 1);
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(sun, ambient);

  const waterDepth = WORLD_DEPTH / 2 - DECK_Z;
  const waterCenterZ = DECK_Z + waterDepth / 2;
  const segments = opts.rippleSize === 256 ? 96 : 192;

  let worldWidth = WORLD_DEPTH;
  let floor = createFloor(opts.colors, worldWidth);
  let deck = createDeck(opts.colors, worldWidth);
  let water: Water = createWater(
    opts.colors,
    worldWidth,
    waterDepth,
    waterCenterZ,
    segments,
  );
  scene.add(floor.mesh, deck.mesh, water.mesh);

  // 굴절용 씬 렌더 타깃 — 수면을 끈 채로 바닥·데크·부표를 굽는다.
  const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  water.material.uniforms.uSceneTex.value = sceneRT.texture;

  const ripple: RippleSim = createRipple(renderer, opts.rippleSize, {
    minX: -worldWidth / 2,
    maxX: worldWidth / 2,
    minZ: waterCenterZ - waterDepth / 2,
    maxZ: waterCenterZ + waterDepth / 2,
  });
  water.material.uniforms.uRippleTex.value = ripple.texture;
  water.material.uniforms.uRippleAmount.value = RIPPLE_AMOUNT;

  const waterBounds = () => ({
    minX: -worldWidth / 2,
    maxX: worldWidth / 2,
    minZ: waterCenterZ - waterDepth / 2,
    maxZ: waterCenterZ + waterDepth / 2,
  });
  const floorY = (FLOOR_SHALLOW + FLOOR_DEEP) / 2;
  const sunDir = new THREE.Vector3(0.15, 1, 0.1).normalize();

  const caustics: Caustics = createCaustics(
    renderer,
    opts.rippleSize,
    waterBounds(),
    floorY,
    sunDir,
  );
  const floatMask: FloatMask = createFloatMask(renderer, 256);
  // 마스크 카메라는 물 영역만 덮는다 — 바닥·수면 셰이더의 uv와 짝이다.
  const maskCamera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 50);
  maskCamera.up.set(0, 0, -1);
  maskCamera.position.set(0, 10, 0);
  maskCamera.lookAt(0, 0, 0);

  function syncBounds() {
    const b = waterBounds();
    ripple.setBounds(b);
    caustics.setBounds(b, floorY);
    maskCamera.left = b.minX;
    maskCamera.right = b.maxX;
    maskCamera.top = -b.minZ;
    maskCamera.bottom = -b.maxZ;
    maskCamera.updateProjectionMatrix();
    const v = new THREE.Vector4(b.minX, b.maxX, b.minZ, b.maxZ);
    floor.material.uniforms.uBounds.value.copy(v);
    floor.material.uniforms.uCaustics.value = caustics.texture;
    floor.material.uniforms.uMask.value = floatMask.texture;
    water.material.uniforms.uBounds.value.copy(v);
    water.material.uniforms.uMask.value = floatMask.texture;
  }

  const waves: WaveSampler = {
    height: (x, z) =>
      gerstnerHeight(x, z, elapsed) + ripple.sampleHeight(x, z) * RIPPLE_AMOUNT,
    gradient: (x, z) => {
      const g = gerstnerGradient(x, z, elapsed);
      const r = ripple.sampleNormal(x, z);
      return {
        x: g.x + r.x * RIPPLE_AMOUNT,
        z: g.z + r.z * RIPPLE_AMOUNT,
      };
    },
    impulse: (x, z, strength, radius) =>
      ripple.addImpulse(x, z, strength, radius),
  };

  const floatObjects: FloatObject[] = createFloats(opts.floats, worldWidth);
  for (const f of floatObjects) scene.add(f.mesh);
  syncBounds();

  function rebuildForWidth(w: number) {
    scene.remove(floor.mesh, deck.mesh, water.mesh);
    floor.geometry.dispose();
    floor.material.dispose();
    deck.geometry.dispose();
    deck.material.dispose();
    water.dispose();
    floor = createFloor(opts.colors, w);
    deck = createDeck(opts.colors, w);
    water = createWater(opts.colors, w, waterDepth, waterCenterZ, segments);
    water.material.uniforms.uSceneTex.value = sceneRT.texture;
    water.material.uniforms.uRippleTex.value = ripple.texture;
    water.material.uniforms.uRippleAmount.value = RIPPLE_AMOUNT;
    scene.add(floor.mesh, deck.mesh, water.mesh);
    repositionFloats(floatObjects, opts.floats, w);
    syncBounds();
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const dpr = renderer.getPixelRatio();
    sceneRT.setSize(Math.round(w * dpr), Math.round(h * dpr));
    worldWidth = (WORLD_DEPTH * w) / h;
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.top = WORLD_DEPTH / 2;
    camera.bottom = -WORLD_DEPTH / 2;
    camera.updateProjectionMatrix();
    rebuildForWidth(worldWidth);
  }

  const observer = new ResizeObserver(() => resize());
  observer.observe(canvas);
  resize();

  const v = new THREE.Vector3();
  function syncProxies() {
    for (const f of floatObjects) {
      v.copy(f.mesh.position).project(camera);
      opts.onProxyMove(f.id, (v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100);
    }
  }

  let raf = 0;
  let elapsed = 0;
  let sinceReadback = 0;
  let last = performance.now();
  let readyFired = false;
  let reduced = opts.reducedMotion;

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    // reduced-motion이면 시간이 흐르지 않는다 — 수면이 그대로 멈춘다.
    if (!reduced) elapsed += dt;
    water.update(elapsed);
    ripple.setPaused(reduced);
    if (!reduced) {
      ripple.step(dt);
      // 부력 샘플용 readback은 ~20Hz로 충분하다 (부표 8개, 한 프레임 지연 무해).
      sinceReadback += dt;
      if (sinceReadback >= 1 / 20) {
        sinceReadback = 0;
        ripple.readback();
      }
      updateFloats(floatObjects, dt, waves);
    }
    water.material.uniforms.uRippleTex.value = ripple.texture;

    // 커스틱은 **지금 이 수면**에서 계산한다 — 파문을 만들면 그 자리가 함께 변한다 (#5).
    floatMask.update(
      floatObjects.map((f) => f.mesh),
      maskCamera,
    );
    caustics.update(ripple.texture, elapsed, RIPPLE_AMOUNT);
    floor.material.uniforms.uCaustics.value = caustics.texture;
    floor.material.uniforms.uMask.value = floatMask.texture;
    water.material.uniforms.uMask.value = floatMask.texture;
    renderer.setClearColor(opts.colors.deck, 1);

    syncProxies();

    // 1) 수면을 끄고 물 아래를 RT에 굽는다 → 2) 수면이 그것을 왜곡해 샘플한다.
    water.mesh.visible = false;
    renderer.setRenderTarget(sceneRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    water.mesh.visible = true;
    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      opts.onReady();
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      this.stop();
      observer.disconnect();
      disposeFloats(floatObjects);
      floor.geometry.dispose();
      floor.material.dispose();
      deck.geometry.dispose();
      deck.material.dispose();
      water.dispose();
      ripple.dispose();
      caustics.dispose();
      floatMask.dispose();
      sceneRT.dispose();
      renderer.dispose();
    },
    setReducedMotion(value: boolean) {
      reduced = value;
    },
  };
}
