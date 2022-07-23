import styles from '@/styles/About.module.css';
import { useRouter } from 'next/router';
import content from '../contents/resume.json';

function About() {
  const router = useRouter();

  const closeToggleHandler = () => {
    const detailsTags = document.querySelectorAll('details');
    const isAllOpen = [...detailsTags].every((el) => el.open);
    detailsTags.forEach((el) => {
      el.open = !isAllOpen;
    });
  };

  return (
    <main className={`aboutPage ${styles.main}`}>
      <div className={styles.contentWrapper}>
        <div className={styles.titlebar}>
          <nav className={styles.buttonWrapper}>
            <button className={styles.close} onClick={() => router.push('/')}>
              <strong className={styles.inlineContent}></strong>
            </button>

            <button
              className={styles.minimize}
              onClick={() => closeToggleHandler()}
            >
              <strong className={styles.inlineContent}></strong>
            </button>

            <button className={styles.zoom}>
              <strong className={styles.inlineContent}></strong>
            </button>
          </nav>
          이력서
        </div>
        <article className={styles.content}>
          <p className={styles.lastUpdatedAt}>최종 수정: 2022. 7. 23</p>
          <h1>{content.title}</h1>

          <table className={styles.infoTable}>
            <caption>개인 정보와 관련 링크</caption>
            {content.infoLink.map((item, idx) => (
              <tr key={item.id + idx}>
                <td scope="row">{item.id}</td>
                <td>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.desc}
                  </a>
                </td>
              </tr>
            ))}
          </table>

          <h2>소개</h2>
          <p>{content.introduction}</p>

          <h2>경력</h2>
          {content.experience.map((item, idx) => (
            <div key={item.company + idx}>
              <h3>{item.company}</h3>
              <table className={styles.infoTable}>
                <tr key="info-table-1">
                  <td scope="row">기간</td>
                  <td>{item.period}</td>
                </tr>
                <tr key="info-table-2">
                  <td scope="row">업무</td>
                  <td>{item.position}</td>
                </tr>
                <tr key="info-table-3">
                  <td scope="row">
                    <strong>기술</strong>
                  </td>
                  <td>
                    {item.tech.map(
                      (tech, idx) =>
                        `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
                    )}
                  </td>
                </tr>
              </table>

              {item.section.map((item, idx) => (
                <section
                  aria-label="주요 업무"
                  className={styles.experienceSection}
                  key={item.title + idx}
                >
                  <h4>
                    <div dangerouslySetInnerHTML={{ __html: item.title }} />
                    {!!item.period && <span>({item.period})</span>}
                  </h4>
                  <p>{item.desc}</p>
                  <p>
                    <span>기술 스택</span>
                    {item.tech.map(
                      (tech, idx) =>
                        `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
                    )}
                  </p>

                  <ul aria-label="상세 업무">
                    {item.jobs.map((job, idx) => (
                      <li key={idx}>
                        <details open>
                          <summary>
                            <span>{job.summary}</span>
                          </summary>
                          <ul>
                            {job.detail.map((item, idx) => (
                              <li key={item[0] + idx}>
                                <div
                                  dangerouslySetInnerHTML={{ __html: item }}
                                />
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ))}

          <h2>개인 프로젝트</h2>
          {content.portfolio.map((item, idx) => (
            <section
              className={styles.experienceSection}
              key={item.title + idx}
            >
              <h4>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <span>({item.period})</span>
              </h4>
              <p>{item.desc}</p>
              <p>
                <span>기술 스택</span>
                {item.tech.map(
                  (tech, idx) =>
                    `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
                )}
              </p>
            </section>
          ))}

          <h2>언어</h2>
          <section className={styles.language}>
            <ul>
              {content.language.map((lang, idx) => (
                <li key={lang.type + idx}>
                  <span>{lang.type}</span>
                  {lang.level}
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}

export default About;
