import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { TitleBar } from '@/components/about/TitleBar';
import * as c from '@/components/about/classes';
import content from '@/contents/resume';
import styles from '@/styles/About.module.css';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const navigate = useNavigate();

  const closeToggleHandler = () => {
    const detailsTags = document.querySelectorAll('details');
    const isAllOpen = [...detailsTags].every((el) => el.open);
    detailsTags.forEach((el) => {
      el.open = !isAllOpen;
    });
  };

  const h2 =
    'mt-10 mb-4 -ml-[1.8rem] text-[30px] ' +
    "before:content-['˙'] before:text-[56px] " +
    'before:leading-[28px] before:text-[color:var(--point-color)]';

  return (
    <main className="aboutPage overflow-auto text-[color:var(--color)]">
      <div
        className="mx-auto my-[6vh] max-w-[1024px] rounded-md border border-[#acacac] bg-[var(--bg)] font-[HelveticaNeue,'Helvetica_Neue','Lucida_Grande',Arial,sans-serif] shadow-[0px_0px_20px_#acacac] max-[1024px]:mx-auto max-[1024px]:my-0"
        style={{ viewTransitionName: 'window-about' }}
      >
        <TitleBar
          onClose={() => navigate({ to: '/', viewTransition: true })}
          onToggleAll={closeToggleHandler}
        />
        <article className="px-36 pt-24 pb-32 font-['Noto_Sans_KR',sans-serif] text-[16px] leading-[1.5] font-normal max-[1024px]:px-[10vw] max-[1024px]:pt-[9vw] max-[1024px]:pb-[10vw]">
          <p className="float-right m-0 text-[12px]">
            최종 수정: {content.lastUpdatedAt}
          </p>
          <h1 className="mb-8 text-[42px] font-bold tracking-[6px]">
            {content.title}
          </h1>

          <table className={c.infoTable}>
            <caption className="invisible pointer-events-none absolute -z-10">
              개인 정보와 관련 링크
            </caption>
            <tbody>
              {content.infoLink.map((item, idx) => (
                <tr className={c.infoTableRow} key={item.id + idx}>
                  <th className={c.infoTableTh} scope="row">
                    {item.id}
                  </th>
                  <td className={c.infoTableTd}>
                    <a
                      className="text-[color:var(--point-color)] hover:text-[color:var(--point-color-hover)]"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.desc}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className={h2}>소개</h2>
          <p className="my-[0.4rem] leading-[1.6] selection:bg-[var(--point-color)] selection:text-[var(--bg)]">
            {content.introduction}
          </p>

          <h2 className={h2}>경력</h2>
          {content.experience.map((item, idx) => (
            <div key={item.company + idx}>
              <h3 className="mt-2 text-[24px]">{item.company}</h3>
              <table className={c.infoTable}>
                <tbody>
                  <tr className={c.infoTableRow} key="info-table-1">
                    <th className={c.infoTableTh} scope="row">
                      기간
                    </th>
                    <td className={c.infoTableTd}>{item.period}</td>
                  </tr>
                  <tr className={c.infoTableRow} key="info-table-2">
                    <th className={c.infoTableTh} scope="row">
                      업무
                    </th>
                    <td className={c.infoTableTd}>{item.position}</td>
                  </tr>
                  <tr className={c.infoTableRow} key="info-table-3">
                    <th className={c.infoTableTh} scope="row">
                      <strong>기술</strong>
                    </th>
                    <td className={c.infoTableTd}>
                      {item.tech.map(
                        (tech, idx) =>
                          `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
                      )}
                    </td>
                  </tr>
                </tbody>
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

          <h2 className={h2}>개인 프로젝트</h2>
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

          <h2 className={h2}>언어</h2>
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
