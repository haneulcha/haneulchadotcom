import { useRef, useState, type ReactNode } from 'react';

import floats from '@/contents/pool';
import { computePositions, sortNewestFirst } from '@/lib/pool/positions';
import styles from '@/styles/Pool.module.css';
import { Deck } from './Deck';
import { FloatProxy } from './FloatProxy';
import { ListWindow } from './ListWindow';

const ordered = sortNewestFirst(floats); // DOM 순서 = Tab 순서 = 최신→과거
const positions = new Map(computePositions(floats).map((p) => [p.id, p]));

export function PoolShell({ children }: { children: ReactNode }) {
  const [listOpen, setListOpen] = useState(false);
  const proxyEls = useRef(new Map<string, HTMLAnchorElement>());

  return (
    <div className={styles.pool} data-pool-ready="dom">
      {/* Task 5에서 이 자리(배경 최하층)에 <PoolCanvas>가 들어온다 */}
      <Deck onToggleList={() => setListOpen((v) => !v)} />
      <nav aria-label="풀에 떠 있는 것들" className={styles.water}>
        {ordered.map((f) => (
          <FloatProxy
            key={f.id}
            float={f}
            y={positions.get(f.id)!.y}
            anchorRef={(el) => {
              if (el) proxyEls.current.set(f.id, el);
              else proxyEls.current.delete(f.id);
            }}
          />
        ))}
      </nav>
      {listOpen && <ListWindow onClose={() => setListOpen(false)} />}
      {children}
    </div>
  );
}
