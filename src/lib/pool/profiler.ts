/**
 * dev 전용 GPU 프로파일러. `?profile`이 있을 때만 활성.
 * 구조는 https://github.com/figma/webgl-profiler 를 따른다 (쿼리 풀 + 비동기 수거).
 *
 * **개발 도구이지 런타임 게이트가 아니다** — 확장이 없으면 null을 반환하고
 * 씬은 아무 영향 없이 돈다 (스펙 「완성도 측정」).
 */
export type PassName =
  'ripple' | 'caustics' | 'refraction-rt' | 'water' | 'scene-rest';

const PASSES: PassName[] = [
  'ripple',
  'caustics',
  'refraction-rt',
  'water',
  'scene-rest',
];

export type Profiler = {
  begin(pass: PassName): void;
  end(pass: PassName): void;
  /** 5초 윈도 평균(ms). GPU_DISJOINT_EXT가 참이었던 프레임은 버린다. */
  report(): Record<PassName, number> | null;
};

type Pending = { pass: PassName; query: WebGLQuery };

export function createProfiler(gl: WebGL2RenderingContext): Profiler | null {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return null;

  const pending: Pending[] = [];
  const totals = Object.fromEntries(PASSES.map((p) => [p, 0])) as Record<
    PassName,
    number
  >;
  const counts = Object.fromEntries(PASSES.map((p) => [p, 0])) as Record<
    PassName,
    number
  >;
  let active: WebGLQuery | null = null;

  function collect() {
    for (let i = pending.length - 1; i >= 0; i--) {
      const { pass, query } = pending[i];
      if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) continue;
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      if (!disjoint) {
        const ns = gl.getQueryParameter(query, gl.QUERY_RESULT) as number;
        totals[pass] += ns / 1e6;
        counts[pass] += 1;
      }
      gl.deleteQuery(query);
      pending.splice(i, 1);
    }
  }

  return {
    begin(pass) {
      if (active) return; // WebGL2는 동시에 하나의 TIME_ELAPSED 쿼리만 허용
      const query = gl.createQuery();
      if (!query) return;
      active = query;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
      pending.push({ pass, query });
    },
    end() {
      if (!active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      active = null;
      collect();
    },
    report() {
      collect();
      if (PASSES.every((p) => counts[p] === 0)) return null;
      const out = {} as Record<PassName, number>;
      for (const p of PASSES) {
        out[p] = counts[p] ? +(totals[p] / counts[p]).toFixed(2) : 0;
        totals[p] = 0;
        counts[p] = 0;
      }
      return out;
    },
  };
}
