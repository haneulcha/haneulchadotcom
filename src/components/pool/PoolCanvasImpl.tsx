import { useEffect, useRef } from 'react';

import floats from '@/contents/pool';
import { readPoolColors, type SceneFloat } from '@/lib/pool/constants';
import { computePositions } from '@/lib/pool/positions';
import { createPoolScene } from '@/lib/pool/scene';
import styles from '@/styles/Pool.module.css';
import type { PoolCanvasProps } from './PoolCanvas';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export default function PoolCanvasImpl({ onReady, proxyEls }: PoolCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const positions = new Map(computePositions(floats).map((p) => [p.id, p]));
    const sceneFloats: SceneFloat[] = floats.map((f) => ({
      id: f.id,
      kind: f.kind,
      status: f.status,
      x: f.x,
      y: positions.get(f.id)!.y,
    }));

    const media = window.matchMedia(REDUCED_MOTION);
    const isNarrow = window.matchMedia('(max-width: 640px)').matches;

    const scene = createPoolScene(canvas, {
      colors: readPoolColors(),
      floats: sceneFloats,
      reducedMotion: media.matches,
      rippleSize: isNarrow ? 256 : 512,
      // 매 프레임이라 React 상태를 거치지 않고 DOM을 직접 갱신한다.
      onProxyMove: (id, leftPct, topPct) => {
        const el = proxyEls.current?.get(id);
        if (el) {
          el.style.left = `${leftPct}%`;
          el.style.top = `${topPct}%`;
        }
      },
      onReady,
    });

    const onMediaChange = () => scene.setReducedMotion(media.matches);
    media.addEventListener('change', onMediaChange);
    scene.start();

    return () => {
      media.removeEventListener('change', onMediaChange);
      scene.dispose();
    };
  }, [onReady, proxyEls]);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
