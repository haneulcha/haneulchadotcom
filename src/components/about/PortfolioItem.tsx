import * as c from '@/components/about/classes';
import type { Portfolio } from '@/contents/types';

export function PortfolioItem({ item }: { item: Portfolio }) {
  return (
    <section className={c.sectionWrap}>
      <h4 className={c.sectionH4}>
        <a
          className="text-[color:var(--point-color)] hover:text-[color:var(--point-color-hover)]"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.title}
        </a>
        <span className={c.sectionH4Span}>({item.period})</span>
      </h4>
      <p className={c.bodyP}>{item.desc}</p>
      <p className={c.bodyP}>
        <span className="font-bold after:mx-[0.7rem] after:align-top after:text-[14px] after:content-['|']">
          기술 스택
        </span>
        {item.tech.map(
          (tech, idx) => `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
        )}
      </p>
    </section>
  );
}
