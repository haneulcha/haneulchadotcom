import * as c from '@/components/about/classes';
import { JobSection } from '@/components/about/JobSection';
import type { Experience } from '@/contents/types';

export function ExperienceItem({ item }: { item: Experience }) {
  return (
    <div>
      <h3 className="mt-2 text-[24px]">{item.company}</h3>
      <table className={c.infoTable}>
        <tbody>
          <tr className={c.infoTableRow}>
            <th className={c.infoTableTh} scope="row">
              기간
            </th>
            <td className={c.infoTableTd}>{item.period}</td>
          </tr>
          <tr className={c.infoTableRow}>
            <th className={c.infoTableTh} scope="row">
              업무
            </th>
            <td className={c.infoTableTd}>{item.position}</td>
          </tr>
          <tr className={c.infoTableRow}>
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

      {item.section.map((section, idx) => (
        <JobSection item={section} key={section.title + idx} />
      ))}
    </div>
  );
}
