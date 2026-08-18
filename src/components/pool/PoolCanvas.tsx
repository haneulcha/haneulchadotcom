import { lazy, Suspense, useEffect, useState, type RefObject } from 'react';

const PoolCanvasImpl = lazy(() => import('./PoolCanvasImpl'));

export type PoolCanvasProps = {
  onReady: () => void;
  proxyEls: RefObject<Map<string, HTMLAnchorElement>>;
};

export function PoolCanvas(props: PoolCanvasProps) {
  const [mode, setMode] = useState<'pending' | 'webgl' | 'none'>('pending');

  useEffect(() => {
    // 첫 페인트 이후에 결정한다 — three 번들이 초기 로드를 막지 않도록.
    // rAF 콜백으로 미루는 건 페인트 뒤라는 의미를 정확히 하기 위해서이기도 하고,
    // 이펙트 본문에서 곧바로 setState 하지 않기 위해서이기도 하다.
    const id = requestAnimationFrame(() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
      setMode(gl ? 'webgl' : 'none');
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // 폴백 = Task 2의 밴드 배경 + 링크. 그대로 동작한다.
  if (mode !== 'webgl') return null;
  return (
    <Suspense fallback={null}>
      <PoolCanvasImpl {...props} />
    </Suspense>
  );
}
