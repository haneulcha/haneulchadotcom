import * as THREE from 'three';

import { WATER_Y, WORLD_DEPTH, type SceneFloat } from './constants';
import { worldXFromFloatX, worldZFromFloatY } from './geometry';

export type FloatObject = {
  id: string;
  mesh: THREE.Mesh;
  status: SceneFloat['status'];
  bobScale: number; // wip이면 1.5, 아니면 1.0
  phase: number;
  nextImpulse: number; // 자기 아래에 약한 임펄스를 넣을 때까지 남은 시간
};

/** 부표 기울기가 파면 법선을 따르는 정도. 판단 필요 (J4). */
const TILT = 0.6;

export type WaveSampler = {
  height(worldX: number, worldZ: number): number;
  gradient(worldX: number, worldZ: number): { x: number; z: number };
  impulse(
    worldX: number,
    worldZ: number,
    strength: number,
    radius: number,
  ): void;
};

/**
 * Hockney 팔레트 — 정오의 청록 물 위에 놓이는 보색 계열 플랫 컬러.
 * 여덟 중 여섯이 `made`라 한 가지 색으로 두면 같은 도넛만 잔뜩 보인다.
 * 종류가 모양을, 인덱스가 색을 정한다.
 */
/*
 * 백묵색은 밝은 청록 물 위에서 대비가 없어 흐릿한 UI 카드처럼 보였다 — 뺐다.
 * 청록의 보색인 따뜻한 계열로 튜브를 돌리고, 킥판은 코발트로 계열을 갈라
 * 모양뿐 아니라 색으로도 종류가 구분되게 한다.
 */
const TUBE_COLORS = [0xff5a47, 0xffc247, 0xf2588a]; // 주홍·금잔화·진분홍
const BOARD_COLOR = 0x1f4fd8; // 킥판은 코발트 폼
const BALL_COLOR = 0xff5a47;

function bodyColor(kind: SceneFloat['kind'], index: number): number {
  if (kind === 'written') return BOARD_COLOR;
  if (kind === 'seen') return BALL_COLOR;
  return TUBE_COLORS[index % TUBE_COLORS.length];
}

/**
 * 2단 계조 램프. MeshToonMaterial이 이 텍스처를 룩업해 음영을 계단으로 끊는다 —
 * 부드러운 그라디언트 대신 하드 엣지 색면이 나오는 것이 Hockney의 핵심이다.
 * (MeshStandardMaterial의 부드러운 음영은 이 스타일의 정반대였다.)
 */
function toonRamp(): THREE.DataTexture {
  const data = new Uint8Array([170, 170, 170, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 2, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

const RAMP = /* lazy */ (() => {
  let cached: THREE.DataTexture | null = null;
  return () => (cached ??= toonRamp());
})();

function geometryFor(kind: SceneFloat['kind']): THREE.BufferGeometry {
  switch (kind) {
    case 'made':
      return new THREE.TorusGeometry(0.34, 0.14, 16, 48);
    case 'written':
      return new THREE.BoxGeometry(0.72, 0.07, 0.46);
    case 'seen':
      return new THREE.SphereGeometry(0.22, 32, 24);
  }
}

/**
 * 부표 크기는 **좁은 쪽 월드 치수**를 따른다. 세로 화면에서는 월드 폭이 4~5까지
 * 좁아지는데 고정 크기로 두면 부표가 화면 폭의 20%씩 차지하며 서로 겹친다 —
 * 실제로 그랬다.
 */
export function floatScaleFor(worldWidth: number): number {
  return Math.min(1, Math.min(worldWidth, WORLD_DEPTH) / WORLD_DEPTH);
}

export function createFloats(
  floats: SceneFloat[],
  worldWidth: number,
): FloatObject[] {
  const scale = floatScaleFor(worldWidth);
  return floats.map((f, i) => {
    const color = new THREE.Color(bodyColor(f.kind, i));
    /*
     * 지나간 것은 물빛 쪽으로 가라앉는다. 처음엔 "볕에 바랜다"고 밝혔는데,
     * 깊은 밴드는 어두우므로 밝히면 오히려 화면에서 가장 튀었다 — 물러나야 할 것이
     * 앞으로 나왔다. 배경색으로 당기는 쪽이 "지나감"의 올바른 읽기다.
     */
    if (f.status === 'archived') color.lerp(new THREE.Color(0x2f7f93), 0.62);

    const mesh = new THREE.Mesh(
      geometryFor(f.kind),
      new THREE.MeshToonMaterial({ color, gradientMap: RAMP() }),
    );
    // 튜브는 눕힌다 (토러스는 기본이 XY 평면에 선 상태)
    const baseRotationX = f.kind === 'made' ? -Math.PI / 2 : 0;
    mesh.rotation.x = baseRotationX;
    mesh.userData.baseRotationX = baseRotationX;
    mesh.scale.setScalar(scale);
    mesh.position.set(
      worldXFromFloatX(f.x, worldWidth),
      WATER_Y,
      worldZFromFloatY(f.y),
    );

    return {
      id: f.id,
      mesh,
      status: f.status,
      bobScale: f.status === 'wip' ? 1.5 : 1.0,
      phase: i * 1.7,
      nextImpulse: 0.1 * i,
    };
  });
}

/**
 * 부력. 물리 엔진을 쓰지 않는다 (스펙 렌더링 레이어 5) — 파고를 샘플링해 y를 정하고,
 * 높이 기울기를 법선 삼아 기울인다. 들썩이는 몸체는 자기 아래에 약한 파문을 남긴다.
 */
export function updateFloats(
  objects: FloatObject[],
  dt: number,
  waves: WaveSampler,
): void {
  for (const o of objects) {
    const { x, z } = o.mesh.position;
    const h = waves.height(x, z);
    o.mesh.position.y = WATER_Y + h * o.bobScale;

    const g = waves.gradient(x, z);
    const base = o.mesh.userData.baseRotationX as number;
    o.mesh.rotation.x = base + g.z * TILT;
    o.mesh.rotation.z = -g.x * TILT;

    o.nextImpulse -= dt;
    if (o.nextImpulse <= 0) {
      o.nextImpulse = 0.8;
      waves.impulse(x, z, 0.05 * o.bobScale, 0.06);
    }
  }
}

export function repositionFloats(
  objects: FloatObject[],
  floats: SceneFloat[],
  worldWidth: number,
): void {
  const byId = new Map(floats.map((f) => [f.id, f]));
  const scale = floatScaleFor(worldWidth);
  for (const o of objects) {
    const f = byId.get(o.id);
    if (f) {
      o.mesh.position.x = worldXFromFloatX(f.x, worldWidth);
      o.mesh.scale.setScalar(scale);
    }
  }
}

export function disposeFloats(objects: FloatObject[]): void {
  for (const o of objects) {
    o.mesh.geometry.dispose();
    (o.mesh.material as THREE.Material).dispose();
  }
}
