import { toViewportTopPercent } from './positions';
import { WORLD_DEPTH } from './constants';

/**
 * DOM 좌표 ↔ 월드 좌표의 단일 변환 지점.
 *
 * 계획은 worldZ 공식을 손으로 다시 적었지만(`0.08 + y * 0.84`), 그러면
 * `toViewportTopPercent`의 여백 상수와 두 벌이 되어 조용히 어긋난다 — 그리고 실제로
 * 그 상수는 Task 2에서 바뀌었다. 여기서는 복제하지 않고 그 함수를 그대로 통과시킨다.
 *
 * 카메라는 up = (0,0,-1)이라 화면 위 = -z(데크 쪽)다. 정사영에서 뷰포트 세로 비율
 * topFrac(0=위, 1=아래)은 ndcY = 1 - 2·topFrac이고, z = -ndcY · DEPTH/2 이므로:
 */
export function worldZFromTopFraction(topFrac: number): number {
  return (2 * topFrac - 1) * (WORLD_DEPTH / 2);
}

/** 부표의 y(0..1) → 월드 z. DOM의 top%와 정확히 같은 자리를 가리킨다. */
export function worldZFromFloatY(y: number): number {
  return worldZFromTopFraction(toViewportTopPercent(y) / 100);
}

/** 부표의 x(0..1) → 월드 x. CSS의 left%와 정확히 같은 자리를 가리킨다. */
export function worldXFromFloatX(x: number, worldWidth: number): number {
  return (x - 0.5) * worldWidth;
}
