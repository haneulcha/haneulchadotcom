import type { FloatKind, FloatStatus } from '@/contents/types';

// 캔버스와 DOM이 같은 기하를 봐야 한다 — 값을 복사하지 말고 재수출한다.
export { DECK_FRACTION } from './positions';

// 월드 단위: 세로(깊이 방향, z) 10. 가로는 뷰포트 aspect를 따른다.
export const WORLD_DEPTH = 10;
export const WATER_Y = 0; // 수면 높이
export const FLOOR_SHALLOW = -0.6; // 데크 쪽 바닥
export const FLOOR_DEEP = -2.2; // 먼 쪽 바닥

export type PoolColors = {
  deck: string;
  shallow: string;
  mid: string;
  deep: string;
  caustic: string;
  tileLine: string;
  avatar: string;
};

export type SceneFloat = {
  id: string;
  kind: FloatKind;
  status: FloatStatus;
  x: number; // 0..1
  y: number; // 0..1 (computePositions)
};

/** 색의 단일 소스는 global.css다 — 캔버스 초기화 시 한 번 읽는다 (스펙 「정오 팔레트」). */
export function readPoolColors(): PoolColors {
  const s = getComputedStyle(document.documentElement);
  const read = (n: string) => s.getPropertyValue(n).trim();
  return {
    deck: read('--pool-deck'),
    shallow: read('--pool-water-shallow'),
    mid: read('--pool-water-mid'),
    deep: read('--pool-water-deep'),
    caustic: read('--pool-caustic'),
    tileLine: read('--pool-tile-line'),
    avatar: read('--pool-avatar'),
  };
}
