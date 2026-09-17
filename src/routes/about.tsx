import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { ExperienceItem } from '@/components/about/ExperienceItem';
import { LanguageList } from '@/components/about/LanguageList';
import { PortfolioItem } from '@/components/about/PortfolioItem';
import { TitleBar } from '@/components/about/TitleBar';
import * as c from '@/components/about/classes';
import content from '@/contents/resume';

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
    'mt-xxl mb-md -ml-xl text-heading-md ' +
    "before:content-['˙'] before:text-[56px] " +
    'before:leading-[28px] before:text-accent-text';

  return (
    <main className="overflow-auto text-neutral-text-strong">
      {/* Tailwind v4 compiles `max-[Npx]:` to `@media (width < Npx)` (exclusive),
          while the original CSS used `@media (max-width: 1024px)` (inclusive).
          1025px here reproduces the original inclusive-at-1024 behavior
          exactly, so the layout still narrows at exactly 1024px instead of
          one pixel later. Same mechanism as src/components/about/classes.ts. */}
      <div
        className="mx-auto my-[6vh] max-w-[1024px] rounded-md border border-[#acacac] bg-neutral-subtle-bg font-chrome shadow-[0px_0px_20px_#acacac] max-[1025px]:mx-auto max-[1025px]:my-none dark:border-[#3a3a3c] dark:shadow-[0px_0px_20px_#000000]"
        style={{ viewTransitionName: 'window-about' }}
      >
        <TitleBar
          onClose={() => navigate({ to: '/', viewTransition: true })}
          onToggleAll={closeToggleHandler}
        />
        {/* 1025px, not 1024px — same inclusive-at-1024 reasoning as above. */}
        <article className="px-section pt-section pb-section font-sans text-body-md max-[1025px]:px-[10vw] max-[1025px]:pt-[9vw] max-[1025px]:pb-[10vw]">
          <p className="float-right m-none text-caption-sm">
            최종 수정: {content.lastUpdatedAt}
          </p>
          <h1 className="mb-xl text-heading-lg tracking-[6px]">
            {content.title}
          </h1>

          <table className={c.infoTable}>
            <caption className="invisible pointer-events-none absolute z-[-1]">
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
                      className={c.linkColor}
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
          <p className={c.contentP}>{content.introduction}</p>

          <h2 className={h2}>경력</h2>
          {content.experience.map((item, idx) => (
            <ExperienceItem item={item} key={item.company + idx} />
          ))}

          <h2 className={h2}>개인 프로젝트</h2>
          {content.portfolio.map((item, idx) => (
            <PortfolioItem
              item={item}
              id={idx === 0 ? 'design-system' : undefined}
              key={item.title + idx}
            />
          ))}

          <h2 className={h2}>언어</h2>
          <LanguageList items={content.language} />
        </article>
      </div>
    </main>
  );
}
