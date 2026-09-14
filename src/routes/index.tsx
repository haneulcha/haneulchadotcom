import { createFileRoute, Link } from '@tanstack/react-router';

import styles from '@/styles/Home.module.css';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className={styles.container}>
      <main className={`${styles.main} [--tw-smoke:ok]`}>
        <h1 className={styles.title}>
          <Link to="/about" className={styles.typo1}>
            ㅊ
          </Link>
          <a
            href="https://kicksky.tistory.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.typo3}
          >
            ㅎ
          </a>
          <div className={styles.typo2}>ㄴ</div>
        </h1>
      </main>

      <footer className={styles.footer}>
        <div> &copy; {new Date().getFullYear()} Haneul Cha</div>
      </footer>
    </div>
  );
}
