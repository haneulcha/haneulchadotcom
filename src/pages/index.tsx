import Head from 'next/head';

import styles from '@/styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>HaneulChaDotCom</title>
        <meta
          name="description"
          content="HaneulChaDotCom is a personal website of Haneul Cha dot com. Haneul Cha dot com is a software engineer and a web developer."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <div className={styles.typo1}>ㅊ</div>
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
        <div> &copy; 2022 Haneul Cha</div>
      </footer>
    </div>
  );
}
