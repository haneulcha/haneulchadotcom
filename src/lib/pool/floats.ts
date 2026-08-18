import * as THREE from 'three';

import { WATER_Y, type SceneFloat } from './constants';
import { worldXFromFloatX, worldZFromFloatY } from './geometry';

export type FloatObject = {
  id: string;
  mesh: THREE.Mesh;
  status: SceneFloat['status'];
  bobScale: number; // wip이면 1.5, 아니면 1.0 (Task 7에서 사용)
  phase: number;
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
    if (f.kind === 'made') mesh.rotation.x = -Math.PI / 2;
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
    };
  });
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
