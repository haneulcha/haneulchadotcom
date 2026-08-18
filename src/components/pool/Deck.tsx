import { Link } from '@tanstack/react-router';

import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

export function Deck({ onToggleList }: { onToggleList: () => void }) {
  return (
    <header className={styles.deck}>
      <nav aria-label="데크" className={styles.deckNav}>
        <Link to="/about" className={styles.deckItem}>
          <span data-symbol-id="about">
            <FloatSymbol name="clipboard" />
          </span>
          이력서
        </Link>
        <a href="mailto:tjaneul@gmail.com" className={styles.deckItem}>
          연락처
        </a>
        <a
          href="https://github.com/haneulcha"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.deckItem}
        >
          GitHub
        </a>
        <button className={styles.listToggle} onClick={onToggleList}>
          목록으로 보기
        </button>
      </nav>
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} Haneul Cha
      </div>
    </header>
  );
}
