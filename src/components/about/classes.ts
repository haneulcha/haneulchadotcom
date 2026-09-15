// Tailwind v4 compiles `max-[Npx]:` to `@media (width < Npx)` (exclusive),
// while the original CSS used `@media (max-width: Npx)` (inclusive). Using
// N+1px here reproduces the original inclusive-at-N behavior exactly, so the
// 320px/375px breakpoints (both common device widths) still fire at those
// exact widths instead of one pixel later. Verified by hand in `pnpm dev`.

/** .infoTable */
// `max-[321px]:block` on the <table> element is harmless only because this
// table never gets a background or border — the original 320px rule never
// touched the <table> itself, only its tr/th/td. Add a background or border
// to the table later and the divergence becomes visible at ≤320px.
export const infoTable =
  'mt-5 min-w-40 border-collapse text-[14px] max-[321px]:block';

/** .infoTable tr */
export const infoTableRow =
  'border-t border-b border-[var(--border-color)] max-[321px]:block';

/** .infoTable tr th[scope='row'] */
export const infoTableTh =
  'min-w-31 pl-2 text-left leading-[2.5] font-bold ' +
  'max-[376px]:min-w-16 max-[321px]:block max-[321px]:leading-[2.3]';

/** .infoTable tr td */
export const infoTableTd =
  'pr-6 max-[321px]:block max-[321px]:py-0 max-[321px]:pr-0 max-[321px]:pl-2 max-[321px]:leading-[2.3]';

/** .experienceSection */
export const sectionWrap = 'mt-4';

/** .experienceSection h4 */
export const sectionH4 = 'my-7 mb-4 text-[20px]';

/** .experienceSection h4 span */
export const sectionH4Span = 'ml-1 text-[16px]';

/** .content p */
export const contentP = 'my-[0.4rem] leading-[1.6]';

/** .experienceSection > p, .content p, .main p::selection */
export const bodyP =
  'my-[0.4rem] text-[16px] leading-[1.6] ' +
  'selection:bg-[var(--point-color)] selection:text-[var(--bg)]';

/** .experienceSection > p:nth-of-type(2) > span, .experienceSection > p:nth-of-type(2) > span::after */
// Tailwind's `selection:` variant compiles to *two* rules — `.foo::selection`
// and a descendant `.foo ::selection`. The parent <p> carries `bodyP`'s
// `selection:bg-[var(--point-color)]`, so its descendant rule leaks the link
// blue (--point-color, #0550ae) onto this span too. The original CSS
// (`.main p::selection`) only ever matched the <p> itself, so this span fell
// through to global.css's `.aboutPage *::selection` and got
// --point-color-selection (#3067ab) instead. Re-declare that colour here to
// restore it — this is not redundant, it is overriding the parent's leak.
//
// It has to win with `!important`, not specificity. Both rules share the same
// selector shape, variant, and property, so Tailwind's compiler falls back to
// comparing the raw candidate strings — `selection:bg-[var(--point-color)]`
// happens to sort before `selection:bg-[var(--point-color-selection)]` only
// because `)` precedes `-`. That's an accident of the two token *names*, not
// of intent, so a future rename (e.g. the palette migration) could flip the
// sort order and silently revert this span to the wrong colour. `!` pins the
// outcome regardless of how the names sort.
export const techLabel =
  "font-bold after:mx-[0.7rem] after:align-top after:text-[14px] after:content-['|'] " +
  'selection:!bg-[var(--point-color-selection)] selection:!text-[var(--bg)]';

/** .main a, .main a:hover — also reused for the color half of
 * .experienceSection details summary / details summary:hover, which shares
 * the same two tokens. */
export const linkColor =
  'text-[color:var(--point-color)] hover:text-[color:var(--point-color-hover)]';
