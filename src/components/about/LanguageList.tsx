import type { Language } from '@/contents/types';

export function LanguageList({ items }: { items: Language[] }) {
  return (
    <section>
      <ul className="my-xs list-none p-none">
        {items.map((lang, idx) => (
          <li className="mb-xs text-body-md" key={lang.type + idx}>
            <span className="relative inline-block min-w-[80px] font-bold after:absolute after:right-none after:mx-sm after:align-top after:text-body-sm after:font-bold after:content-['|']">
              {lang.type}
            </span>
            {lang.level}
          </li>
        ))}
      </ul>
    </section>
  );
}
