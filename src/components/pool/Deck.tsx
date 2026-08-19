import { Link } from '@tanstack/react-router';

import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

export function Deck({ onToggleList }: { onToggleList: () => void }) {
  return (
    <header className={styles.deck}>
      <div className={styles.deckInner}>
        <p className={styles.wordmark}>
          <span>차하늘</span>
          <span className={styles.wordmarkSub}>haneulcha.com</span>
        </p>

        <nav aria-label="데크" className={styles.deckNav}>
          <Link to="/about" className={styles.deckItem} viewTransition>
            <span
              data-symbol-id="about"
              style={{ viewTransitionName: 'window-about' }}
            >
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
            목록
          </button>
        </nav>
      </div>
      <div className={styles.coping} aria-hidden="true" />
    </header>
  );
}
