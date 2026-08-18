import * as THREE from 'three';

import { WATER_Y, type SceneFloat } from './constants';
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

// 판단 필요 (J3): 몸체 색 기본값.
const BODY_COLOR: Record<SceneFloat['kind'], number> = {
  made: 0xf2545b, // 튜브
  written: 0xffd23f, // 킥판
  seen: 0xffffff, // 비치볼
};

function geometryFor(kind: SceneFloat['kind']): THREE.BufferGeometry {
  switch (kind) {
    case 'made':
      return new THREE.TorusGeometry(0.45, 0.18, 16, 48);
    case 'written':
      return new THREE.BoxGeometry(0.9, 0.08, 0.6);
    case 'seen':
      return new THREE.SphereGeometry(0.28, 32, 24);
  }
}

export function createFloats(
  floats: SceneFloat[],
  worldWidth: number,
): FloatObject[] {
  return floats.map((f, i) => {
    const color = new THREE.Color(BODY_COLOR[f.kind]);
    if (f.status === 'archived') color.offsetHSL(0, -0.35, 0);

    const mesh = new THREE.Mesh(
      geometryFor(f.kind),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0 }),
    );
    // 튜브는 눕힌다 (토러스는 기본이 XY 평면에 선 상태)
    const baseRotationX = f.kind === 'made' ? -Math.PI / 2 : 0;
    mesh.rotation.x = baseRotationX;
    mesh.userData.baseRotationX = baseRotationX;
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
  for (const o of objects) {
    const f = byId.get(o.id);
    if (f) o.mesh.position.x = worldXFromFloatX(f.x, worldWidth);
  }
}

export function disposeFloats(objects: FloatObject[]): void {
  for (const o of objects) {
    o.mesh.geometry.dispose();
    (o.mesh.material as THREE.Material).dispose();
  }
}
