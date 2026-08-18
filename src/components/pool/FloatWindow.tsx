import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import type { PoolFloat } from '@/contents/types';
import aboutStyles from '@/styles/About.module.css';
import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

export function FloatWindow({ float }: { float: PoolFloat }) {
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);

  // Esc = 닫기 (스펙 「인터랙션」 표)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate({ to: '/', viewTransition: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // 노랑 = 창 안의 details 일괄 토글 (about.tsx와 같은 로직, 창 범위로 한정)
  const toggleDetails = () => {
    const details = bodyRef.current?.querySelectorAll('details') ?? [];
    const isAllOpen = [...details].every((el) => el.open);
    details.forEach((el) => {
      el.open = !isAllOpen;
    });
  };

  return (
    <div
      className={`aboutPage ${styles.floatWindow} ${zoomed ? styles.zoomed : ''}`}
      role="dialog"
      aria-label={float.title}
    >
      <div className={aboutStyles.titlebar}>
        <nav className={aboutStyles.buttonWrapper}>
          <button
            className={aboutStyles.close}
            onClick={() => navigate({ to: '/', viewTransition: true })}
          >
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
          <button className={aboutStyles.minimize} onClick={toggleDetails}>
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
          <button
            className={aboutStyles.zoom}
            onClick={() => setZoomed((v) => !v)}
          >
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
        </nav>
        <span
          data-symbol-id={float.id}
          className={styles.windowSymbol}
          style={{ viewTransitionName: `float-${float.id}` }}
        >
          <FloatSymbol name={float.symbol} />
        </span>
        {float.title}
      </div>
      <div ref={bodyRef} className={styles.windowBody}>
        <p className={styles.windowSubtitle}>{float.subtitle}</p>
        {float.desc && <p>{float.desc}</p>}
        <details open>
          <summary>정보</summary>
          <dl>
            <dt>시기</dt>
            <dd>{float.date}</dd>
            {float.tech && (
              <>
                <dt>기술</dt>
                <dd>{float.tech.join(', ')}</dd>
              </>
            )}
          </dl>
        </details>
        {float.thumb && (
          <details open>
            <summary>화면</summary>
            <img src={float.thumb} alt={`${float.title} 화면`} />
          </details>
        )}
        <details open>
          <summary>링크</summary>
          <ul>
            {float.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
