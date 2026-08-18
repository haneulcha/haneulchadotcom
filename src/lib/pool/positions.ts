import type { PoolFloat } from '@/contents/types';

export type FloatPosition = { id: string; x: number; y: number };

/** 데크가 차지하는 뷰포트 비율. Pool.module.css의 데크 높이 14%와 짝. */
export const DECK_FRACTION = 0.14;

function toTime(date: string): number {
  const [y, m, d = '15'] = date.split('-');
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

/** date 내림차순 정렬. 동률은 pool.json 순서 유지 (DOM/Tab 순서의 근거). */
export function sortNewestFirst(floats: PoolFloat[]): PoolFloat[] {
  return [...floats].sort((a, b) => toTime(b.date) - toTime(a.date));
}

/**
 * y = √((최신 − date) / (최신 − 最古)), 0 = 최근(데크 쪽), 1 = 最古.
 * 선형으로 "단순화"하지 마라 — 초기 8개 기준 선형은 5개가 상단 12%에 몰리고
 * 동월 2개가 정확히 겹친다 (스펙 「레이아웃」에 수치가 있다).
 * 동월 항목은 최소 세로 간격(minGap)만큼 아래로 밀어낸 뒤,
 * 1을 넘으면 전체를 최대값으로 나눠 0..1로 재정규화한다.
 */
export function computePositions(
  floats: PoolFloat[],
  minGap = 0.06,
): FloatPosition[] {
  const times = floats.map((f) => toTime(f.date));
  const newest = Math.max(...times);
  const oldest = Math.min(...times);
  const span = Math.max(newest - oldest, 1);

  const positions = floats.map((f, i) => ({
    id: f.id,
    x: f.x,
    y: Math.sqrt((newest - times[i]) / span),
  }));

  const ascending = [...positions].sort((a, b) => a.y - b.y);
  for (let i = 1; i < ascending.length; i++) {
    if (ascending[i].y - ascending[i - 1].y < minGap) {
      ascending[i].y = ascending[i - 1].y + minGap;
    }
  }
  const max = Math.max(1, ...positions.map((p) => p.y));
  for (const p of positions) p.y /= max;

  return positions;
}

/** y(0..1) → 뷰포트 세로 위치(%). 물 영역 안에서 상하 8% 여백. */
export function toViewportTopPercent(y: number): number {
  const inWater = 0.08 + y * 0.84;
  return (DECK_FRACTION + inWater * (1 - DECK_FRACTION)) * 100;
}
