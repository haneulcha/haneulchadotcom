import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { ExperienceItem } from '@/components/about/ExperienceItem';
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
      {/* Tailwind v4 compiles `max-[Npx]:` to `@media (width < Npx)` (exclusive),
          while the original CSS used `@media (max-width: 1024px)` (inclusive).
          1025px here reproduces the original inclusive-at-1024 behavior
          exactly, so the layout still narrows at exactly 1024px instead of
          one pixel later. Same mechanism as src/components/about/classes.ts. */}
      <div
        className="mx-auto my-[6vh] max-w-[1024px] rounded-md border border-[#acacac] bg-[var(--bg)] font-[HelveticaNeue,'Helvetica_Neue','Lucida_Grande',Arial,sans-serif] shadow-[0px_0px_20px_#acacac] max-[1025px]:mx-auto max-[1025px]:my-0"
        style={{ viewTransitionName: 'window-about' }}
      >
        <TitleBar
          onClose={() => navigate({ to: '/', viewTransition: true })}
          onToggleAll={closeToggleHandler}
        />
        {/* 1025px, not 1024px — same inclusive-at-1024 reasoning as above. */}
        <article className="px-36 pt-24 pb-32 font-['Noto_Sans_KR',sans-serif] text-[16px] leading-[1.5] font-normal max-[1025px]:px-[10vw] max-[1025px]:pt-[9vw] max-[1025px]:pb-[10vw]">
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
            <ExperienceItem item={item} key={item.company + idx} />
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
