import * as THREE from 'three';

import { WATER_Y, WORLD_DEPTH, type PoolColors } from './constants';
import type { FloatObject } from './floats';
import type { RippleSim } from './ripple';

const MAX_SPEED = WORLD_DEPTH / 5; // 풀 세로를 5초에 종단
const DAMPING = 0.92;
const DWELL_RADIUS = 0.7;
const DWELL_SECONDS = 1.0;
const WAKE_INTERVAL = 0.12;

export type Avatar = {
  mesh: THREE.Object3D;
  setKeys(dx: number, dz: number): void;
  swimTo(worldX: number, worldZ: number): void;
  update(dt: number, ripple: RippleSim, floats: FloatObject[]): void;
  /** 부표 반경 안에 DWELL_SECONDS 이상 머물렀으면 해당 id 반환 (1회성) */
  pollDwell(): string | null;
  setReducedMotion(v: boolean): void;
  dispose(): void;
};

/** 웹폰트를 새로 붙이지 않는다 — 캔버스에 글리프를 그려 텍스처로 쓴다. */
function glyphTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.font = `bold 190px 'Noto Sans KR', -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // 크림색 외곽선 — 얕은 청록부터 깊은 남색까지 어느 밴드 위에서도 읽혀야 한다.
  ctx.strokeStyle = '#f5f3ee';
  ctx.lineWidth = 22;
  ctx.strokeText('ㅊ', size / 2, size / 2 + 8);
  ctx.fillStyle = color;
  ctx.fillText('ㅊ', size / 2, size / 2 + 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createAvatar(colors: PoolColors, startZ: number): Avatar {
  const texture = glyphTexture(colors.avatar || '#ad1d1d');
  const geometry = new THREE.PlaneGeometry(1.15, 1.15);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  // 데크 중앙 바로 아래 사다리 지점. 고정값이다 (테스트 결정성, 스펙 「검증」).
  mesh.position.set(0, WATER_Y + 0.05, startZ);
  mesh.renderOrder = 2;

  const keys = new THREE.Vector2(0, 0);
  const velocity = new THREE.Vector2(0, 0);
  let target: THREE.Vector2 | null = null;
  let reduced = false;
  let wakeTimer = 0;
  let dwellId: string | null = null;
  let dwellTime = 0;
  let pending: string | null = null;

  return {
    mesh,
    setKeys(dx, dz) {
      keys.set(dx, dz);
      if (dx !== 0 || dz !== 0) target = null; // 키 입력이 목표를 취소한다
    },
    swimTo(x, z) {
      if (reduced) {
        mesh.position.x = x;
        mesh.position.z = z;
        target = null;
        return;
      }
      target = new THREE.Vector2(x, z);
    },
    update(dt, ripple, floats) {
      const pos = mesh.position;

      let ax = keys.x;
      let az = keys.y;
      if (target) {
        const dx = target.x - pos.x;
        const dz = target.y - pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.08) {
          target = null;
        } else {
          ax = dx / dist;
          az = dz / dist;
        }
      }

      velocity.x += ax * MAX_SPEED * dt * 4;
      velocity.y += az * MAX_SPEED * dt * 4;
      velocity.multiplyScalar(DAMPING);
      const speed = velocity.length();
      if (speed > MAX_SPEED) velocity.multiplyScalar(MAX_SPEED / speed);

      pos.x += velocity.x * dt;
      pos.z += velocity.y * dt;

      // 진행 방향으로 글리프를 돌린다 (평면이 눕혀져 있으므로 z축 회전).
      if (speed > 0.05) mesh.rotation.z = Math.atan2(velocity.x, velocity.y);

      // 항적
      wakeTimer -= dt;
      if (speed > 0.15 && wakeTimer <= 0) {
        wakeTimer = WAKE_INTERVAL;
        // 판단 필요 (J4): 0.015/0.1로는 화면에서 항적이 보이지 않았다.
        ripple.addImpulse(pos.x, pos.z, 0.14, 0.05);
      }

      // dwell
      let near: string | null = null;
      for (const f of floats) {
        const d = Math.hypot(
          f.mesh.position.x - pos.x,
          f.mesh.position.z - pos.z,
        );
        if (d < DWELL_RADIUS) {
          near = f.id;
          break;
        }
      }
      if (near && near === dwellId) {
        dwellTime += dt;
        if (dwellTime >= DWELL_SECONDS) {
          pending = near;
          dwellTime = -Infinity; // 같은 부표에서 반복 발화하지 않도록
        }
      } else {
        dwellId = near;
        dwellTime = 0;
      }
    },
    pollDwell() {
      const id = pending;
      pending = null;
      return id;
    },
    setReducedMotion(v) {
      reduced = v;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
