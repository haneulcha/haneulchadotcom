import * as c from '@/components/about/classes';
import type { ExperienceSection } from '@/contents/types';

export function JobSection({ item }: { item: ExperienceSection }) {
  return (
    <section aria-label="주요 업무" className={c.sectionWrap}>
      <h4 className={c.sectionH4}>
        <div
          className="resumeHtml inline-block"
          dangerouslySetInnerHTML={{ __html: item.title }}
        />
        {!!item.period && (
          <span className={c.sectionH4Span}>({item.period})</span>
        )}
      </h4>
      <p className={c.bodyP}>{item.desc}</p>
      <p className={c.bodyP}>
        {/* 원본은 `.experienceSection > p:nth-of-type(2) > span`으로 이 라벨을
            잡았다. 구조 선택자를 없애고 클래스를 직접 붙인다 — <p>의 순서가
            바뀌어도 안 깨진다. ::after의 구분선 '|'도 여기로 따라온다. */}
        <span className={c.techLabel}>기술 스택</span>
        {item.tech.map(
          (tech, idx) => `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
        )}
      </p>

      <ul aria-label="상세 업무" className="my-4 list-none pl-[0.85rem]">
        {item.jobs.map((job, idx) => (
          <li key={idx}>
            <details className="overflow-visible" open>
              <summary
                className={`my-[0.35rem] cursor-pointer text-[18px] leading-[1.65] font-medium ${c.linkColor}`}
              >
                <span className="ml-[0.35rem] text-[color:var(--color)]">
                  {job.summary}
                </span>
              </summary>
              <ul className="my-2 mb-4 list-['•'] pl-7">
                {job.detail.map((detail, i) => (
                  <li className="mb-[0.4rem] text-[16px]" key={detail[0] + i}>
                    <div
                      className="resumeHtml ml-2"
                      dangerouslySetInnerHTML={{ __html: detail }}
                    />
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
