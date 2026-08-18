import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import floats from '@/contents/pool';
import { readPoolColors, type SceneFloat } from '@/lib/pool/constants';
import { computePositions } from '@/lib/pool/positions';
import { createPoolScene } from '@/lib/pool/scene';
import styles from '@/styles/Pool.module.css';
import type { PoolCanvasProps } from './PoolCanvas';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const KEY_AXES: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};

export default function PoolCanvasImpl({ onReady, proxyEls }: PoolCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

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
      onDwell: (id) =>
        navigate({ to: '/p/$id', params: { id }, viewTransition: true }),
    });

    const onMediaChange = () => scene.setReducedMotion(media.matches);
    media.addEventListener('change', onMediaChange);

    // --- 조작 배선 ---
    // 불가침 규칙: 부표 클릭은 가로채지 않는다. 프록시 <a>의 기본 내비게이션이
    // 아바타 위치와 무관하게 즉시 연다 (스펙 「인터랙션」).
    const held = new Set<string>();
    const applyKeys = () => {
      let dx = 0;
      let dz = 0;
      for (const code of held) {
        const axis = KEY_AXES[code];
        if (axis) {
          dx += axis[0];
          dz += axis[1];
        }
      }
      scene.setKeys(Math.sign(dx), Math.sign(dz));
    };
    const isTyping = () => {
      const el = document.activeElement;
      return (
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          (el as HTMLElement).isContentEditable)
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!KEY_AXES[e.code] || isTyping()) return;
      // 창이 열려 있으면 헤엄 조작을 무시한다 (Esc·Tab은 창이 처리).
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault(); // 방향키의 페이지 스크롤 방지
      held.add(e.code);
      applyKeys();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!held.delete(e.code)) return;
      applyKeys();
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('a, button, [role="dialog"]')) return; // 부표·데크·창은 그대로
      scene.swimToScreen(e.clientX, e.clientY);
    };
    // Tab 포커스 추종
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      const href = el?.getAttribute?.('href');
      const id = href?.startsWith('/p/') ? href.slice(3) : null;
      if (id) scene.swimToFloat(id);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);

    scene.start();

    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      scene.dispose();
    };
  }, [onReady, proxyEls, navigate]);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
