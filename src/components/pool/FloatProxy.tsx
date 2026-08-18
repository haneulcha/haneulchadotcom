import { Link } from '@tanstack/react-router';
import type { Ref } from 'react';

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
      data-status={float.status}
      data-kind={float.kind}
      style={{
        left: `${float.x * 100}%`,
        top: `${toViewportTopPercent(y)}%`,
      }}
    >
      <span className={styles.proxySymbol} data-symbol-id={float.id}>
        <FloatSymbol name={float.symbol} />
      </span>
      <span className={styles.proxyLabel}>
        {float.title}
        <small>{float.subtitle}</small>
      </span>
    </Link>
  );
}
