import { Link } from '@tanstack/react-router';
import type { CSSProperties, Ref } from 'react';

import type { PoolFloat } from '@/contents/types';
import { toViewportTopPercent } from '@/lib/pool/positions';
import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

type Props = {
  float: PoolFloat;
  y: number; // computePositions의 0..1
  anchorRef: Ref<HTMLAnchorElement>;
};

export function FloatProxy({ float, y, anchorRef }: Props) {
  return (
    <Link
      ref={anchorRef}
      to="/p/$id"
      params={{ id: float.id }}
      className={styles.proxy}
      viewTransition
      data-status={float.status}
      data-kind={float.kind}
      style={{
        left: `${float.x * 100}%`,
        top: `${toViewportTopPercent(y)}%`,
      }}
    >
      <span
        className={styles.proxySymbol}
        data-symbol-id={float.id}
        /*
         * 이름을 커스텀 프로퍼티로 넘기고 실제 적용은 CSS가 한다.
         * 창이 열리면 같은 이름이 두 엘리먼트에 동시에 걸려 브라우저가 전환을
         * 건너뛰므로, Pool.module.css가 :has()로 프록시 쪽을 끈다.
         * (PoolShell에서 라우터 훅으로 판별하려 했으나 SSR 번들이
         *  `__exportAll is not a function`으로 깨져 CSS로 옮겼다.)
         */
        style={{ '--vt-name': `float-${float.id}` } as CSSProperties}
      >
        <FloatSymbol name={float.symbol} />
      </span>
      <span className={styles.proxyLabel}>
        {float.title}
        <small>{float.subtitle}</small>
      </span>
    </Link>
  );
}
