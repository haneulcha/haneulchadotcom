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
  'mt-lg min-w-[160px] border-collapse text-body-sm max-[321px]:block';

/** .infoTable tr */
export const infoTableRow =
  'border-t border-b border-neutral-border max-[321px]:block';

// 행 높이를 line-height로 만들던 편법을 걷는다. 원본은 th에 leading-[2.5]를 줘
// 35px 행을 만들었는데, 그 값은 스케일 밖일 뿐 아니라 td에는 base leading이 없어
// th 혼자 행 높이를 떠받치고 있었다. 이제 th·td가 같은 py를 갖는다 — 행 높이
// 35px → 37px, 셀 세로 정렬이 우연에 기대지 않는다.
/** .infoTable tr th[scope='row'] */
export const infoTableTh =
  'min-w-[124px] py-xs pl-xs text-left font-bold ' +
  'max-[376px]:min-w-[64px] max-[321px]:block max-[321px]:py-xxs';

/** .infoTable tr td */
export const infoTableTd =
  'py-xs pr-lg max-[321px]:block max-[321px]:py-xxs max-[321px]:pr-none max-[321px]:pl-xs';

/** .experienceSection */
export const sectionWrap = 'mt-md';

/** .experienceSection h4 */
export const sectionH4 = 'mt-lg mb-md text-heading-xs';

/** .experienceSection h4 span */
export const sectionH4Span = 'ml-xxs text-body-sm';

/** .content p */
export const contentP = 'my-xs';

/** .experienceSection > p, .content p */
export const bodyP = 'my-xs text-body-md';

// after:font-bold는 중복이 아니라 복원이다. 원본에서 '|'는 크기만 지정하고
// 굵기는 부모 span의 font-bold를 상속했는데, after:text-body-sm이 프로필의
// weight 400을 실어 오면서 그 상속이 끊긴다.
/** .experienceSection > p:nth-of-type(2) > span, 그 ::after */
export const techLabel =
  "font-bold after:mx-sm after:align-top after:text-body-sm after:font-bold after:content-['|']";

/** .main a, .main a:hover — details summary의 색 절반도 같은 토큰을 쓴다. */
export const linkColor = 'text-accent-text hover:text-accent-text-strong';
