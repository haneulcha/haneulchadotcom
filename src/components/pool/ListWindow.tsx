import { Link } from '@tanstack/react-router';

import floats from '@/contents/pool';
import { sortNewestFirst } from '@/lib/pool/positions';
import aboutStyles from '@/styles/About.module.css';
import styles from '@/styles/Pool.module.css';

export function ListWindow({ onClose }: { onClose: () => void }) {
  return (
    <div
      className={`aboutPage ${styles.listWindow}`}
      role="dialog"
      aria-label="목록으로 보기"
    >
      <div className={aboutStyles.titlebar}>
        <nav className={aboutStyles.buttonWrapper}>
          <button className={aboutStyles.close} onClick={onClose}>
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
        </nav>
        목록
      </div>
      <ul className={styles.listBody}>
        {sortNewestFirst(floats).map((f) => (
          <li key={f.id}>
            <Link to="/p/$id" params={{ id: f.id }} viewTransition>
              {f.title}
            </Link>
            <span>
              {f.date} · {f.subtitle}
            </span>
          </li>
        ))}
        <li>
          <Link to="/about" viewTransition>
            이력서
          </Link>
        </li>
      </ul>
    </div>
  );
}
