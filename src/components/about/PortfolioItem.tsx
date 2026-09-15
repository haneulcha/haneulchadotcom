import * as c from '@/components/about/classes';
import type { Portfolio } from '@/contents/types';

export function PortfolioItem({ item, id }: { item: Portfolio; id?: string }) {
  return (
    <section id={id} className={c.sectionWrap}>
      <h4 className={c.sectionH4}>
        <a
          className={c.linkColor}
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
        <span className={c.techLabel}>기술 스택</span>
        {item.tech.map(
          (tech, idx) => `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
        )}
      </p>
    </section>
  );
}
