// Water simulation adapted from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
import * as THREE from 'three';

import {
  DECK_FRACTION,
  FLOOR_DEEP,
  FLOOR_SHALLOW,
  WATER_Y,
  WORLD_DEPTH,
  type PoolColors,
  type SceneFloat,
} from './constants';
import {
  createFloats,
  disposeFloats,
  repositionFloats,
  type FloatObject,
} from './floats';
import { worldZFromTopFraction } from './geometry';

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
      uTile: { value: new THREE.Color(0xffffff) },
      uLine: { value: new THREE.Color(colors.tileLine) },
      uScale: { value: 3.0 },
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
      varying vec3 vWorld;
      void main() {
        vec2 g = fract(vWorld.xz * uScale);
        vec2 d = min(g, 1.0 - g);
        float line = 1.0 - smoothstep(0.0, 0.035, min(d.x, d.y));
        gl_FragColor = vec4(mix(uTile, uLine, line), 1.0);
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

/** Task 5의 물: 평평하다. Task 6이 Gerstner·굴절·프레넬로 교체한다. */
function createWater(colors: PoolColors, worldWidth: number) {
  const waterDepth = WORLD_DEPTH / 2 - DECK_Z;
  const geometry = new THREE.PlaneGeometry(worldWidth, waterDepth, 192, 192);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uShallow: { value: new THREE.Color(colors.shallow) },
      uMid: { value: new THREE.Color(colors.mid) },
      uDeep: { value: new THREE.Color(colors.deep) },
      // Task 6의 Gerstner 파가 읽는다. reduced-motion이면 멈춘 채로 남는다.
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying float vT;
      void main() {
        vT = uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // 수심 필드에 대한 3밴드 양자화 (스펙 「시각 스타일」). 합성 이미지가 아니라
    // 수심을 임계한다 — 그래야 밴딩이 아니라 스타일이 된다.
    fragmentShader: /* glsl */ `
      uniform vec3 uShallow;
      uniform vec3 uMid;
      uniform vec3 uDeep;
      varying float vT;
      void main() {
        float d = 1.0 - vT; // 0 = 데크 쪽(얕음), 1 = 먼 쪽(깊음)
        vec3 c = d < 0.333 ? uShallow : (d < 0.666 ? uMid : uDeep);
        gl_FragColor = vec4(c, 0.82);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, WATER_Y, DECK_Z + waterDepth / 2);
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

  let worldWidth = WORLD_DEPTH;
  let floor = createFloor(opts.colors, worldWidth);
  let deck = createDeck(opts.colors, worldWidth);
  let water = createWater(opts.colors, worldWidth);
  scene.add(floor.mesh, deck.mesh, water.mesh);

  const floatObjects: FloatObject[] = createFloats(opts.floats, worldWidth);
  for (const f of floatObjects) scene.add(f.mesh);

  function rebuildForWidth(w: number) {
    scene.remove(floor.mesh, deck.mesh, water.mesh);
    floor.geometry.dispose();
    floor.material.dispose();
    deck.geometry.dispose();
    deck.material.dispose();
    water.geometry.dispose();
    water.material.dispose();
    floor = createFloor(opts.colors, w);
    deck = createDeck(opts.colors, w);
    water = createWater(opts.colors, w);
    scene.add(floor.mesh, deck.mesh, water.mesh);
    repositionFloats(floatObjects, opts.floats, w);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
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
  let last = performance.now();
  let readyFired = false;
  let reduced = opts.reducedMotion;

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    // reduced-motion이면 시간이 흐르지 않는다 — 수면이 그대로 멈춘다.
    water.material.uniforms.uTime.value += reduced ? 0 : dt;
    // Task 7: 여기서 물결 시뮬레이션과 부력(updateFloats)이 들어온다.
    syncProxies();
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
      water.geometry.dispose();
      water.material.dispose();
      renderer.dispose();
    },
    setReducedMotion(value: boolean) {
      reduced = value;
    },
  };
}
