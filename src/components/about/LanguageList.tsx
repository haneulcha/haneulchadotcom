import type { Language } from '@/contents/types';

export function LanguageList({ items }: { items: Language[] }) {
  return (
    <section>
      <ul className="my-2 list-none p-0">
        {items.map((lang, idx) => (
          <li className="mb-2 text-[16px]" key={lang.type + idx}>
            <span className="relative inline-block min-w-20 font-bold after:absolute after:right-0 after:mx-[0.65rem] after:align-top after:text-[14px] after:content-['|']">
              {lang.type}
            </span>
            {lang.level}
          </li>
        ))}
      </ul>
    </section>
  );
}
