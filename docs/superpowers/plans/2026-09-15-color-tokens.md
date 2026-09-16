# 색 토큰 · 다크 모드 · 컬러 바 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

- 작성일: 2026-09-15
- 근거 스펙: [2026-09-15 색 토큰 · 다크 모드 · 컬러 바 설계](../specs/2026-09-15-color-tokens-design.md) — **사용자 승인 완료. 설계 결정을 다시 열지 않는다.**
- 브랜치: `haneulcha/color-tokens`

**Goal:** 팔레트가 뽑은 색 토큰을 사이트에 들이고, 다크 모드를 3상태 토글로 켜고, 화면 구석에 그 토큰을 실제로 찍는 컬러 바를 세우고, 이력서에 그 작업 항목을 추가한다.

**Architecture:** 생성된 `palette.theme.css`를 그대로 들여와 `@theme` 변수를 얻고, 기존 CSS 변수 6개를 지우면서 22곳의 클래스를 토큰 유틸리티로 바꾼다. 다크는 `<html>`의 `.dark` 클래스로 구동하되 클래스를 붙이는 쪽만 우리가 맡는다 — 팔레트 파일은 건드리지 않는다. 컬러 바는 hex 대신 `var(--color-…)`를 직접 그려서 팔레트 그 자체가 된다.

**Tech Stack:** Tailwind v4, TanStack Start, React 19.2.8, TypeScript 6.0.3, Playwright.

## Global Constraints

모든 태스크에 암묵적으로 적용된다.

- **`palette.theme.css`를 편집하지 않는다.** 생성물이다. 값이 틀렸으면 팔레트를 다시 뽑는다.
- **기준선 PNG는 재생성한다** — ①과 정반대다. 다만 재생성 전에 **무엇이 바뀔지 먼저 적고**, 재생성 후 실제 diff가 그것과 일치하는지 확인한다. `maxDiffPixelRatio: 0.001`은 1280×2799에서 약 3,500픽셀을 봐주므로 "통과"는 정확성의 증거가 아니다.
- **색 매핑은 스펙 1절의 표가 정본이다.** 구현 후 브라우저에서 계산값을 읽어 표와 대조한다.
- 패키지 매니저는 **pnpm 전용**. 커밋은 **Conventional Commits**, 제목은 영어 소문자. `--no-verify` 금지.
- **`max-[Npx]:`의 N+1을 건드리지 마라** (`1025` `321` `376`). Tailwind v4가 `width < N`으로 컴파일하는 것을 상쇄한 값이다.
- **`@layer base` 밖으로 리셋을 꺼내지 마라.** `tests/tailwind-setup.spec.ts`가 잡는다.
- **`@custom-variant hover (&:hover)`를 지우지 마라.** ①에서 원본 semantics를 복원한 것이다.
- **범위 밖** — 계획에 없으면 하지 마라: 타이포·간격 토큰화, 상태색 4개 스케일 사용, 이력서 전면 갱신, OG 이미지, `sitemap.xml`, 브레이크포인트 변경, 접근성 리팩터링.

**매 태스크의 검증 게이트 (이하 "전체 게이트"):**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

`pnpm test`는 `pnpm build` 결과물을 서빙한다. 다섯 개가 전부 통과해야 커밋한다.

**되돌리는 법:** 태스크마다 커밋이 닫힌다. 실패하면 `git reset --hard HEAD`(커밋 전) 또는 `git revert <커밋>`(커밋 후).

---

## 계획 중 발견한 설계 보강 두 건

스펙을 쓴 뒤 드러났다. **스펙의 결정을 뒤집지 않고 보강한다.**

### 보강 1 — 인라인 스크립트는 라우터 API를 쓰지 않는다

TanStack Router의 `headScripts`는 문자열 children을 SSR에서 인라인 `<script>`로 내주지만, 클라이언트에서 `useEffect`로 `document.head`를 다시 만지고 하이드레이션 후 `null`을 반환한다 (`node_modules/@tanstack/react-router/dist/esm/Asset.js`의 `Script`). 우리가 원하는 건 "첫 페인트 전에 한 번 실행되고 끝"이다.

`RootDocument`가 `<html><head>`를 직접 렌더하므로 **거기에 평범한 `<script dangerouslySetInnerHTML>`을 둔다.** 단순하고 라우터 내부 동작에 안 묶인다.

### 보강 2 — 다크 값이 필요한 크롬은 8개다 (스펙은 7개라고 썼다)

스펙이 `body`의 배경을 빠뜨렸다. 창 **바깥** 바탕색이라 다크에서 반드시 새로 정해야 한다.

| #   | 무엇                     | 라이트                  | 다크 (제안) |
| --- | ------------------------ | ----------------------- | ----------- |
| 1   | `body` 바탕              | `rgba(170,183,191,0.2)` | `#1c1e1c`   |
| 2   | 타이틀바 그라디언트 시작 | `#ebebeb`               | `#3a3a3c`   |
| 3   | 타이틀바 그라디언트 끝   | `#d5d5d5`               | `#2c2c2e`   |
| 4   | 타이틀바 위 테두리       | `#f3f1f3`               | `#48484a`   |
| 5   | 타이틀바 아래 테두리     | `#b1aeb1`               | `#1c1c1e`   |
| 6   | 타이틀바 글자            | `#4d494d`               | `#a1a1a6`   |
| 7   | 창 테두리                | `#acacac`               | `#3a3a3c`   |
| 8   | 창 그림자                | `#acacac`               | `#000000`   |

2~6은 macOS 다크 창 크롬 인용이다. 1은 인용할 대상이 없어 **제안**이다 — 라이트에서는 창(`#fbfcff`)이 바탕보다 밝은데, 다크에서는 창(`neutral-subtle-bg` = `#070908`)이 바탕보다 어두워진다. 이 반전은 다크 테마에서 정상이지만 **눈으로 확인해야 한다.** 어색하면 값을 조정하고 계획에 기록한다.

신호등 12개는 안 바뀐다 — macOS가 두 테마에서 같은 색을 쓴다.

---

## 파일 구조

**생성**

| 파일                             | 책임                                                   |
| -------------------------------- | ------------------------------------------------------ |
| `src/styles/palette.theme.css`   | 팔레트 생성물. 편집 금지                               |
| `src/components/ThemeToggle.tsx` | 3상태 토글 버튼 + 시스템 변화 구독                     |
| `src/components/ColorBar.tsx`    | 여섯 칸 스와치 + 호버 판독                             |
| `src/lib/theme.ts`               | 테마 읽기/쓰기/적용 순수 함수 + 인라인 스크립트 문자열 |

**수정**: `src/styles/global.css`, `src/routes/__root.tsx`, `src/routes/about.tsx`, `src/components/about/classes.ts`, `src/components/about/JobSection.tsx`, `src/components/about/TitleBar.tsx`, `src/components/about/PortfolioItem.tsx`, `src/contents/resume.json`, `src/contents/types.ts`, `tests/pages.spec.ts`, `CLAUDE.md`

`theme.ts`를 `lib/`에 따로 두는 이유: 인라인 스크립트 문자열과 런타임 로직이 **같은 규칙을 두 번 표현**하므로 한 파일에 두어야 갈라지지 않는다. 컴포넌트가 아니라 로직이므로 `components/`가 아니다.

---

## Task 1: 팔레트 도입과 토큰 치환

가장 큰 색 변화가 여기서 일어난다. 다크는 아직 없다.

**Files:**

- Create: `src/styles/palette.theme.css`
- Modify: `src/styles/global.css`, `src/routes/about.tsx`, `src/components/about/classes.ts`, `src/components/about/JobSection.tsx`, `src/routes/index.tsx`, `tests/tailwind-setup.spec.ts`, `.prettierignore`
- Baselines: `tests/pages.spec.ts-snapshots/*.png` 재생성

**Interfaces:**

- Produces: `--color-accent-*` / `--color-neutral-*` 변수와 그에 대응하는 Tailwind 유틸리티(`text-accent-text`, `bg-accent-solid`, `border-neutral-border` 등). 이후 모든 태스크가 이 이름을 쓴다.

- [ ] **Step 1: 팔레트를 내려받아 넣는다**

브라우저에서 아래를 열고 `palette.theme.css`를 받아 `src/styles/palette.theme.css`로 저장한다.

```
https://haneulcha.github.io/design-system-starter/color-palette?v=1&a=fa862e&n=green-soft&t=7-&ts=8-
```

받은 파일이 다음을 만족하는지 확인한다 — 아니면 URL이 잘못 열린 것이다.

- `@theme { … }` 블록과 `.dark { … }` 블록이 하나씩
- `--color-accent-500: #fa862e`
- `--color-accent-700: #ae5500`, `--color-accent-800: #8c4300`
- `--color-neutral-200: #e4e7e5`, `--color-neutral-800: #252825`
- `--color-accent-on-solid: #000000`

맨 위에 한 줄 주석을 **추가만** 한다 (다른 줄은 손대지 않는다):

```css
/* 생성물이다. 편집하지 마라 — 팔레트를 다시 뽑으면 날아간다.
   출처: https://haneulcha.github.io/design-system-starter/color-palette?v=1&a=fa862e&n=green-soft&t=7-&ts=8- */
```

- [ ] **Step 1b: 생성물을 Prettier에서 제외한다**

`.prettierignore`에 한 줄을 더한다. 안 그러면 `pnpm format`이 이 파일을 재포맷해 "편집하지 않는다"는 규칙이 포매터에 의해 깨진다.

```
# 팔레트 생성물. 재생성하면 덮어쓰므로 포맷을 강제하지 않는다.
src/styles/palette.theme.css
```

- [ ] **Step 2: `global.css`에서 import하고 변수 6개를 지운다**

Tailwind utilities import **뒤**에 놓는다. `@theme`가 `theme` 레이어에 들어가야 유틸리티가 생성된다.

```css
@import 'tailwindcss/utilities.css' layer(utilities) source('..');
@import './palette.theme.css';
```

그리고 `:root { --color: …; --bg: …; … }` 블록 **전체를 삭제한다.**

- [ ] **Step 3: 선택 하이라이트를 통일한다**

`@layer base` 안에서 `.aboutPage *::selection` 규칙을 아래로 **교체한다.**

```css
::selection {
  background: var(--color-accent-solid);
  color: var(--color-accent-on-solid);
}
```

`@layer base`에 두는 이유는 유틸리티가 필요하면 이길 수 있어야 하기 때문이다. 비레이어로 두면 나중에 누가 `selection:` 유틸리티를 붙였을 때 조용히 안 먹는다.

같은 블록의 `.resumeHtml a`도 토큰으로 바꾼다.

```css
.resumeHtml a {
  color: var(--color-accent-text);
}
.resumeHtml a:hover {
  color: var(--color-accent-text-strong);
}
```

- [ ] **Step 4: `classes.ts`를 고친다**

`bodyP`와 `techLabel`에서 **`selection:` 유틸리티를 전부 걷어낸다.** Step 3의 루트 규칙이 대신한다. `techLabel`의 긴 주석(`!important`가 왜 필요한지 설명하는 부분)도 **통째로 지운다** — 그 문제가 사라졌으므로 주석이 거짓이 된다.

```ts
/** .infoTable tr */
export const infoTableRow =
  'border-t border-b border-neutral-border max-[321px]:block';

/** .experienceSection > p, .content p */
export const bodyP = 'my-[0.4rem] text-[16px] leading-[1.6]';

/** .experienceSection > p:nth-of-type(2) > span, 그 ::after */
export const techLabel =
  "font-bold after:mx-[0.7rem] after:align-top after:text-[14px] after:content-['|']";

/** .main a, .main a:hover — details summary의 색 절반도 같은 토큰을 쓴다. */
export const linkColor = 'text-accent-text hover:text-accent-text-strong';
```

- [ ] **Step 5: `about.tsx`를 고친다**

네 자리다.

```tsx
// h2 점 — 색만 바꾼다. `relative`/`before:absolute`를 넣지 마라.
// ①에서 그렇게 해봤다가 제목이 48~60px 밀려서 의도적으로 뺐다.
const h2 =
  'mt-10 mb-4 -ml-[1.8rem] text-[30px] ' +
  "before:content-['˙'] before:text-[56px] " +
  'before:leading-[28px] before:text-accent-text';
```

```tsx
<main className="overflow-auto text-neutral-text-strong">
```

> `aboutPage` 클래스를 **지운다.** Step 3이 `.aboutPage *::selection`을 없앴으므로 존재 이유가 사라졌다.

```tsx
// 창 래퍼: bg-[var(--bg)] → bg-neutral-subtle-bg
className =
  "mx-auto my-[6vh] max-w-[1024px] rounded-md border border-[#acacac] bg-neutral-subtle-bg font-[HelveticaNeue,'Helvetica_Neue','Lucida_Grande',Arial,sans-serif] shadow-[0px_0px_20px_#acacac] max-[1025px]:mx-auto max-[1025px]:my-0";
```

```tsx
// 최종 수정 줄과 소개 문단에서 selection: 유틸리티를 걷어낸다
<p className="float-right m-0 text-[12px] leading-[1.6]">
<p className={c.contentP}>
```

`<caption>`의 `-z-[1]`, 표 상수, `max-[…]` 값은 **건드리지 않는다.**

- [ ] **Step 6: `JobSection.tsx`를 고친다**

```tsx
<span className="ml-[0.35rem] text-neutral-text-strong">
```

- [ ] **Step 7: 랜딩 세 글자를 토큰으로**

`index.tsx`에서:

```tsx
<Link to="/about" className="text-accent-solid">ㅊ</Link>
<a … className="text-neutral-text-strong">ㅎ</a>
<div className="text-neutral-text">ㄴ</div>
```

푸터는 `text-neutral-solid`로.

> `ㄴ`을 `neutral-text`(700)로 두는 것은 `ㅎ`(800)과 한 칸 띄우기 위해서다. 시안에서 두 글자가 안 갈라져 보였다.

- [ ] **Step 8: 바뀔 것을 먼저 적는다**

재생성 **전에** 예상 변화를 **리포트 파일에 적는다.** 나중에 맞춰보기 위한 것이므로 재생성을 본 뒤에 쓰면 의미가 없다.

- 링크·소제목 점: 파랑 `#0550ae` → 갈색 `#ae5500`
- 버튼·선택 배경: 파랑 → 주황 `#fa862e`, 글자는 흰색 → **검정**
- 본문: `#24292f` → `#252825` (거의 동일)
- 표 줄: `#e6e8e6` → `#e4e7e5` (거의 동일)
- 창 배경: `#fbfcff` → `#fafafa` (거의 동일)
- 랜딩: `ㅊ` 빨강 → 주황, `ㅎ`·`ㄴ` 갈색 계열 → 세이지 계열

- [ ] **Step 9: 기준선 재생성과 대조**

```bash
pnpm build && npx playwright test --update-snapshots=all
```

그 다음 `git diff --stat`으로 PNG 두 장이 바뀐 것을 확인하고, **`pnpm dev`로 띄워 눈으로 본다.** Step 8의 목록과 실제가 일치하는가? 목록에 없는 변화가 있으면 그게 버그다.

브라우저 콘솔에서 계산값을 읽어 스펙 1절 표와 대조한다:

```js
getComputedStyle(document.querySelector('a[href^="mailto"]')).color;
// → "rgb(174, 85, 0)"  (#ae5500)
```

- [ ] **Step 9b: 랜딩 색을 단언하는 테스트를 고친다**

`tests/tailwind-setup.spec.ts`의 첫 테스트가 랜딩 `ㅊ`의 색을 `rgb(173, 29, 29)`로 단언한다. Step 7이 그 글자를 `text-accent-solid`로 바꾸므로 `rgb(250, 134, 46)`이 된다. 기댓값을 고친다.

**그 테스트가 무엇을 검사하는지는 바꾸지 마라** — 유틸리티가 `?url` 스타일시트를 통해 실제로 페이지에 닿는지를 본다. 같은 파일의 두 번째 테스트(`@layer base` 순서)는 손대지 않는다.

- [ ] **Step 10: 손으로 확인**

- 문단·「기술 스택」 라벨·제목을 드래그해 선택 색이 **한 가지**인지 (주황 배경 + 검정 글자)
- 링크와 `<summary>`에 마우스를 올려 hover 색이 바뀌는지
- 320px·375px에서 표가 세로로 무너지는지

- [ ] **Step 11: 전체 게이트와 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
git add -A src tests
git commit -m "feat: adopt the generated colour palette as design tokens"
```

---

## Task 2: 다크 모드 — CSS와 시스템 추종

토글은 아직 없다. `prefers-color-scheme`만 따른다. UI 없이 CSS 층을 먼저 닫는 것이 목적이다.

**Files:**

- Create: `src/lib/theme.ts`
- Modify: `src/styles/global.css`, `src/routes/__root.tsx`, `src/routes/about.tsx`, `src/components/about/TitleBar.tsx`, `tests/pages.spec.ts`
- Baselines: 다크 PNG 2장 추가

**Interfaces:**

- Consumes: Task 1의 토큰.
- Produces: `src/lib/theme.ts`에서
  - `export type ThemeChoice = 'system' | 'light' | 'dark'`
  - `export const THEME_KEY = 'theme'`
  - `export function resolveDark(choice: ThemeChoice, systemDark: boolean): boolean`
  - `export const THEME_INIT_SCRIPT: string`
  - Task 3의 `ThemeToggle`이 이것들을 쓴다.

- [ ] **Step 1: `theme.ts`를 만든다**

```ts
// 인라인 스크립트와 런타임 로직이 같은 규칙을 두 번 표현한다. 갈라지면
// 첫 페인트와 이후 동작이 어긋나므로 한 파일에 둔다.

export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_KEY = 'theme';

/** 선택과 시스템 상태로부터 다크 여부를 정한다. 유일한 판정 규칙. */
export function resolveDark(choice: ThemeChoice, systemDark: boolean): boolean {
  return choice === 'dark' || (choice === 'system' && systemDark);
}

/** 첫 페인트 전에 <html>에 .dark를 붙인다. resolveDark와 같은 규칙이다.
 *  localStorage 접근이 던질 수 있어(사파리 시크릿) try로 감싼다 — 던지면
 *  라이트로 떨어지는 것이 흰 화면보다 낫다. */
export const THEME_INIT_SCRIPT = `(function(){try{
var c=localStorage.getItem('${THEME_KEY}')||'system';
var s=matchMedia('(prefers-color-scheme: dark)').matches;
if(c==='dark'||(c==='system'&&s))document.documentElement.classList.add('dark');
}catch(e){}})()`;
```

- [ ] **Step 2: `__root.tsx`의 `<head>`에 스크립트를 넣는다**

`<HeadContent />` **앞**에 둔다. 파서가 위에서부터 읽으므로 가장 먼저 실행된다.

```tsx
import { THEME_INIT_SCRIPT } from '@/lib/theme';
```

```tsx
<head>
  {/* 첫 페인트 전에 .dark를 결정한다. 프리렌더된 정적 HTML이라 서버가
      사용자 선택을 알 수 없으므로 클라이언트에서 가장 먼저 실행돼야 한다.
      라우터의 headScripts를 쓰지 않는 것은 그쪽이 하이드레이션 후 DOM을
      다시 만지기 때문이다 — 여기서 필요한 건 한 번 실행되고 끝이다. */}
  <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  <HeadContent />
</head>
```

- [ ] **Step 3: `body` 바탕색을 테마별로**

`global.css`의 `@layer base`에서 `html, body`의 `background-color`를 빼고, 아래를 추가한다.

```css
html,
body {
  /* … 나머지는 그대로 … */
  background-color: rgba(170, 183, 191, 0.2);
}

/* 창 바깥의 바탕. 라이트에서는 창이 바탕보다 밝고, 다크에서는 창
     (neutral-subtle-bg = #070908)이 바탕보다 어둡다 — 이 반전은 다크
     테마에서 정상이다. macOS 다크 데스크톱에 인용할 대상이 없어 고른 값이라
     눈으로 확인한 결과다. */
.dark body {
  background-color: #1c1e1c;
}
```

- [ ] **Step 4: 타이틀바와 창 크롬에 다크 값을 준다**

`TitleBar.tsx`의 컨테이너에 `dark:` 변형을 더한다. 보강 2의 표를 그대로 쓴다.

```tsx
<div className="relative cursor-default rounded-t-md border-t border-b border-t-[#f3f1f3] border-b-[#b1aeb1] bg-linear-to-r/srgb from-[#ebebeb] to-[#d5d5d5] py-[5px] text-center text-[11pt] text-[#4d494d] select-none dark:border-t-[#48484a] dark:border-b-[#1c1c1e] dark:from-[#3a3a3c] dark:to-[#2c2c2e] dark:text-[#a1a1a6]">
```

> 신호등 세 개는 **건드리지 않는다.** macOS가 두 테마에서 같은 색을 쓴다.

`about.tsx`의 창 래퍼:

```tsx
className =
  '… border-[#acacac] … shadow-[0px_0px_20px_#acacac] dark:border-[#3a3a3c] dark:shadow-[0px_0px_20px_#000000] …';
```

> **먼저 `global.css`에 한 줄을 넣어야 한다.** Tailwind v4의 기본 `dark:`는 클래스가 아니라 미디어 쿼리로 컴파일된다 — 계획 작성 중 실제로 컴파일해 확인했다:
>
> ```css
> /* 기본값 */
> @media (prefers-color-scheme: dark) { .dark\:text-\[\#123456\] { … } }
>
> /* @custom-variant dark (&:where(.dark, .dark *)) 적용 후 */
> .dark\:text-\[\#123456\]:where(.dark, .dark *) { … }
> ```
>
> 그대로 두면 **팔레트는 `.dark` 클래스를, 크롬 색은 미디어 쿼리를 따라 갈라진다** — 시스템이 다크인데 사용자가 라이트를 골랐을 때 타이틀바만 어두워진다. `@custom-variant hover` 옆에 두고 주석을 단다:
>
> ```css
> /* 팔레트(palette.theme.css)가 .dark 클래스로 다크를 구동하므로 dark:
>    유틸리티도 같은 신호를 따라야 한다. Tailwind 기본값은
>    prefers-color-scheme이라, 그대로 두면 팔레트 색과 크롬 색이 서로 다른
>    신호를 따라 갈라진다 — 시스템 다크 + 사용자가 라이트를 고른 상황에서
>    타이틀바만 어두워진다. */
> @custom-variant dark (&:where(.dark, .dark *));
> ```

- [ ] **Step 5: 다크 스크린샷 테스트를 추가한다**

`tests/pages.spec.ts`에 두 개를 더한다. **`colorScheme` 에뮬레이션이 아니라 클래스를 직접 붙인다** — 팔레트가 클래스로 동작하므로 실제 경로를 지나야 한다.

```ts
async function forceDark(page: Page) {
  await page.evaluate(() => document.documentElement.classList.add('dark'));
}

test('landing page renders in dark', async ({ page }) => {
  await page.goto('/');
  await waitForFonts(page);
  await forceDark(page);
  await expect(page).toHaveScreenshot('landing-dark.png', { fullPage: true });
});

test('about page renders in dark', async ({ page }) => {
  await page.goto('/about');
  await waitForFonts(page);
  await forceDark(page);
  await expect(page).toHaveScreenshot('about-dark.png', { fullPage: true });
});
```

- [ ] **Step 6: 기준선 생성과 눈 확인**

```bash
pnpm build && npx playwright test --update-snapshots=all
```

PNG가 **4장**이 됐는지 확인한다. 그리고 `pnpm dev`로 띄워 OS를 다크로 바꿔가며 본다:

- 창 바깥 바탕(`#1c1e1c`)과 창 안(`#070908`)이 구분되는가? 어색하면 값을 조정하고 Step 3의 주석에 기록한다
- 타이틀바가 macOS 다크 창처럼 보이는가
- 신호등이 다크에서도 제 색인가
- **링크가 밝은 주황(`#ffa265`)으로 뒤집혔는가** — 라이트의 `#ae5500`과 반대쪽 stop이다
- 새로고침할 때 흰 깜빡임이 없는가 (인라인 스크립트가 일하는지)

- [ ] **Step 7: 전체 게이트와 커밋**

```bash
git add -A src tests
git commit -m "feat: follow the system colour scheme in dark mode"
```

---

## Task 3: 테마 토글

**Files:**

- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/routes/__root.tsx`
- Baselines: 4장 재생성 (토글이 화면에 보인다)

**Interfaces:**

- Consumes: Task 2의 `ThemeChoice`, `THEME_KEY`, `resolveDark`.
- Produces: `export function ThemeToggle(): JSX.Element` — 뷰포트 우상단 고정.

- [ ] **Step 1: 컴포넌트를 만든다**

```tsx
import { useEffect, useState } from 'react';

import { resolveDark, THEME_KEY, type ThemeChoice } from '@/lib/theme';

const CYCLE: ThemeChoice[] = ['system', 'light', 'dark'];
const LABEL: Record<ThemeChoice, string> = {
  system: '시스템 ◐',
  light: '라이트 ○',
  dark: '다크 ●',
};

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>('system');

  // 서버는 사용자 선택을 모르므로 'system'으로 렌더하고 마운트 후 바로잡는다.
  useEffect(() => setChoice(read()), []);

  // 선택이 바뀌면 클래스와 저장소를 맞춘다. 시스템 모드일 때는 OS 설정
  // 변화도 따라가야 하므로 미디어 쿼리를 구독한다 — 새로고침 없이 바뀐다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        resolveDark(choice, mq.matches),
      );
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [choice]);

  const next = () => {
    const n = CYCLE[(CYCLE.indexOf(choice) + 1) % CYCLE.length];
    setChoice(n);
    try {
      if (n === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, n);
    } catch {
      // 저장이 막혀도 이번 세션은 동작한다.
    }
  };

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`테마: ${LABEL[choice]} — 눌러서 전환`}
      // 자기 표면을 갖는다. 페이지 바탕 위에도, 좁은 화면에서 타이틀바
      // 그라디언트 위에 얹혔을 때도 읽혀야 하므로 투명 배경은 안 된다.
      className="fixed top-3 right-3 z-50 rounded border border-neutral-border bg-neutral-subtle-bg px-2 py-1 font-mono text-[10px] tracking-wide text-neutral-text"
    >
      <span suppressHydrationWarning>{LABEL[choice]}</span>
    </button>
  );
}
```

> `suppressHydrationWarning`이 필요한 이유: 서버는 항상 `시스템 ◐`을 내지만 클라이언트는 저장된 선택으로 즉시 바뀐다. 이 불일치는 의도된 것이다.

- [ ] **Step 2: `__root.tsx`에 단다**

```tsx
<body>
  {children}
  <ThemeToggle />
  <Scripts />
</body>
```

- [ ] **Step 3: 손으로 확인 — 여기는 자동 테스트가 없다**

`pnpm dev`로 띄워 전부 확인한다.

- 세 번 눌러 `시스템 → 라이트 → 다크 → 시스템`으로 도는가
- **시스템 모드에서 OS 설정을 바꾸면 새로고침 없이 따라오는가**
- 라이트/다크를 고른 뒤 새로고침해도 유지되는가
- 시스템으로 돌아가면 `localStorage`에서 키가 지워지는가 (DevTools → Application)
- 좁은 화면(≤1024px)에서 `/about`의 타이틀바 위에 얹혔을 때 읽히는가
- 키보드 `Tab`으로 도달하고 포커스 링이 보이는가

- [ ] **Step 4: 기준선 재생성과 커밋**

토글은 `fixed`라 레이아웃을 밀지 않지만 **화면에 보이므로 4장 모두 바뀐다.** 정상이다.

```bash
pnpm build && npx playwright test --update-snapshots=all
```

diff 이미지로 **우상단에 토글만 추가됐는지** 확인한다. 다른 곳이 움직였으면 `fixed`가 안 먹었거나 `z-50`이 무언가를 가린 것이다.

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
git add -A src tests
git commit -m "feat: add the three-state theme toggle"
```

---

## Task 4: 컬러 바

**Files:**

- Create: `src/components/ColorBar.tsx`
- Modify: `src/routes/__root.tsx`
- Baselines: 4장 재생성

**Interfaces:**

- Consumes: Task 1의 토큰 변수.
- Produces: `export function ColorBar(): JSX.Element` — 뷰포트 우하단 고정.

- [ ] **Step 1: 컴포넌트를 만든다**

```tsx
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

// 인쇄 컨트롤 스트립은 그 인쇄물이 실제로 쓴 잉크를 찍는다. 여기도 같다 —
// 이 화면이 소비하는 역할만 넣는다. hex를 박지 않고 var()를 그대로 그리므로
// 띠는 팔레트의 그림이 아니라 팔레트 그 자체다. 테마 전환에 JS가 필요 없고,
// 팔레트를 다시 뽑아도 띠가 자동으로 맞는다.
const CELLS = [
  { label: '여백', varName: '--color-neutral-subtle-bg' },
  { label: '테두리', varName: '--color-neutral-border' },
  { label: '본문', varName: '--color-neutral-text-strong' },
  { label: '링크', varName: '--color-accent-text' },
  { label: '솔리드', varName: '--color-accent-solid' },
  { label: '글자', varName: '--color-accent-on-solid' },
] as const;

export function ColorBar() {
  const [read, setRead] = useState<string | null>(null);

  const show = (cell: (typeof CELLS)[number]) => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(cell.varName)
      .trim();
    setRead(`${cell.label} ${v}`);
  };

  return (
    // 평범한 <a>가 아니라 <Link>다. 랜딩의 'ㅊ'과 닫기 버튼이 이미 라우터
    // 내비게이션을 쓰므로 띠만 전체 페이지를 리로드하면 동작이 갈린다.
    // 라우터가 해시 스크롤까지 처리한다.
    <Link
      to="/about"
      hash="design-system"
      aria-label="이 페이지가 쓰는 색 토큰 — 이력서의 디자인 시스템 항목으로"
      title={read ?? '이 페이지가 쓰는 색 토큰'}
      onMouseLeave={() => setRead(null)}
      className="fixed right-3 bottom-3 z-50 flex overflow-hidden rounded-sm shadow-[0_0_0_1px_rgba(128,128,128,0.35)]"
    >
      {CELLS.map((cell) => (
        <span
          key={cell.varName}
          onMouseEnter={() => show(cell)}
          style={{ background: `var(${cell.varName})` }}
          className="block h-[13px] w-[17px] transition-[height] duration-100 hover:h-[19px]"
        />
      ))}
    </Link>
  );
}
```

> 판독을 `title` 속성으로 내는 것은 별도 팝오버를 만들지 않기 위해서다. 팝오버는 위치·겹침·모바일 처리가 붙는 UI인데, 이 띠의 목적은 "토큰이 여기 있다"를 보여주는 것이지 검사 도구가 아니다.

- [ ] **Step 2: `__root.tsx`에 단다**

```tsx
<body>
  {children}
  <ColorBar />
  <ThemeToggle />
  <Scripts />
</body>
```

- [ ] **Step 3: 손으로 확인**

- 띠의 여섯 칸이 실제 토큰 색인가 — DevTools로 계산값을 읽어 스펙 1절 표와 대조
- **테마를 바꾸면 띠도 따라 바뀌는가** (JS 없이 CSS만으로 되어야 한다)
- 칸에 마우스를 올리면 툴팁에 역할명과 hex가 뜨는가
- 눌러서 `/about`으로 가는가 — **Task 5 전에는 앵커가 없으므로 맨 위로 간다.** 정상이다
- 랜딩에서 눌렀을 때 **전체 페이지 리로드가 아니라 클라이언트 내비게이션**인가 (DevTools Network에 문서 요청이 안 떠야 한다)
- 랜딩과 `/about` 양쪽에 있는가

- [ ] **Step 4: 기준선 재생성과 커밋**

```bash
pnpm build && npx playwright test --update-snapshots=all
```

diff 이미지로 **우하단에 띠만 추가됐는지** 확인한다.

```bash
git add -A src tests
git commit -m "feat: add the colour bar that prints the page's tokens"
```

---

## Task 5: 이력서 항목과 앵커

**Files:**

- Modify: `src/contents/resume.json`, `src/contents/types.ts`, `src/components/about/PortfolioItem.tsx`, `src/routes/about.tsx`
- Baselines: `about*.png` 2장 재생성

**Interfaces:**

- Consumes: Task 4의 `ColorBar`가 가리키는 `#design-system`.

- [ ] **Step 1: `resume.json`에 항목을 넣는다**

`portfolio` 배열 **맨 앞**에. 아래는 스펙의 초안이며 **사용자가 검토·수정한다.**

```json
{
  "title": "design-system-starter",
  "period": "2026. 4 ~",
  "url": "https://github.com/haneulcha/design-system-starter",
  "desc": "디자인을 시작하기 위한 최소한의 결정이 무엇인지에 답하는 디자인 시스템 스타터. 실제 디자인 시스템 코퍼스를 분석해 기본값과 노브의 경계를 정하고, 색·타이포·간격·radius·elevation·컴포넌트 여섯 범주의 토큰과 AI 에이전트가 읽을 수 있는 DESIGN.md를 생성한다. 이 사이트의 색이 그 산출물이다.",
  "tech": ["TypeScript", "oklch", "Tailwind v4", "Figma MCP", "Vitest"]
}
```

`lastUpdatedAt`도 갱신한다.

> `desc`에 링크를 넣는다면 HTML 속성에 **작은따옴표**를 쓴다 (`<a href='…'>`). JSON 문자열 안이라 큰따옴표는 이스케이프가 필요하다 — 기존 관례다.

- [ ] **Step 2: `PortfolioItem`이 `id`를 받게 한다**

```tsx
export function PortfolioItem({ item, id }: { item: Portfolio; id?: string }) {
  return (
    <section id={id} className={c.sectionWrap}>
```

- [ ] **Step 3: `about.tsx`가 첫 항목에 앵커를 준다**

```tsx
{
  content.portfolio.map((item, idx) => (
    <PortfolioItem
      item={item}
      id={idx === 0 ? 'design-system' : undefined}
      key={item.title + idx}
    />
  ));
}
```

> 인덱스로 거는 것은 `resume.json`이 순서를 정본으로 쓰기 때문이다. 제목 문자열로 매칭하면 이력서 문구를 고칠 때 앵커가 조용히 끊긴다.

- [ ] **Step 4: 손으로 확인**

- 랜딩에서 띠를 눌러 `/about`의 해당 항목으로 스크롤되는가
- `/about`에서 띠를 눌러 같은 페이지 스크롤이 되는가
- 항목이 다른 포트폴리오 항목과 같은 모양인가

- [ ] **Step 5: 기준선 재생성과 커밋**

```bash
pnpm build && npx playwright test --update-snapshots=all
git add -A src tests
git commit -m "feat: add the design-system entry the colour bar points at"
```

---

## Task 6: CLAUDE.md 갱신

**Files:** `CLAUDE.md`

- [ ] **Step 1: 사실이 아니게 된 것을 고친다**

- **CSS 변수 6개 목록** → 팔레트 토큰 체계(`--color-{scale}-{role}`)와 `palette.theme.css`가 생성물이라는 사실
- **`aboutPage` 문단 전체 삭제** — 클래스가 사라졌다
- **`.resumeHtml a` 문단** — 이제 토큰을 가리킨다
- **테스트 문단** — 기준선이 4장이 됐고 다크는 `.dark` 클래스를 붙여 찍는다

- [ ] **Step 2: 새로 추가한다**

```markdown
**다크 모드는 `<html>`의 `.dark` 클래스로 구동된다.** `palette.theme.css`가
`.dark` 선택자를 하드코딩하므로(생성물이라 못 바꾼다) 클래스를 붙이는 쪽만
우리가 맡는다. `src/lib/theme.ts`가 판정 규칙과 인라인 스크립트를 **한 파일에**
갖고 있다 — 갈라지면 첫 페인트와 이후 동작이 어긋난다.

**`__root.tsx`의 `<head>`에 인라인 스크립트가 있다. 지우지 마라.** 첫 페인트
전에 `.dark`를 결정하지 않으면 다크 사용자가 흰 화면을 한 번 보고 깜빡인다.
라우터의 `headScripts`를 쓰지 않는 것은 그쪽이 하이드레이션 후 DOM을 다시
만지기 때문이다.

**`dark:` 유틸리티도 `.dark` 클래스를 따르도록 `@custom-variant`로 바꿔 뒀다.**
Tailwind 기본값은 `prefers-color-scheme`이라, 그대로 두면 팔레트(클래스 기반)와
크롬 색(미디어 쿼리 기반)이 서로 다른 신호를 따라 갈라진다.

**컬러 바는 hex를 박지 않고 `var(--color-…)`를 그린다.** 팔레트를 다시 뽑거나
테마를 바꾸면 띠가 자동으로 맞는다. 이 성질이 깨지면 띠는 팔레트의 그림일 뿐
팔레트가 아니게 된다.
```

- [ ] **Step 3: 기술 부채 목록을 손본다**

"랜딩이 살아있는 위성을 안 가리킨다" 항목에 컬러 바가 `/about#design-system`을 가리킨다는 사실을 덧붙인다. 완전히 해소된 것은 아니므로 **지우지 않는다.**

- [ ] **Step 4: 게이트와 커밋**

```bash
pnpm format:check
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for colour tokens and dark mode"
```

---

## 자체 검토 기록

**스펙 커버리지.** 1절 토큰 도입 → T1 / 2절 선택 통일 → T1 Step 3~5 / 3절 다크 모드 → T2·T3 / 4절 컬러 바 → T4 / 5절 이력서 항목 → T5 / 6절 검증 → 전 태스크 / 7절 하지 않는 것 → Global Constraints / 8절 위험 → Global Constraints / 9절 CLAUDE.md → T6. **빠진 절 없음.**

**스펙과 달라진 점 두 가지** (계획에서 보강, 결정은 유지):

1. 인라인 스크립트를 라우터 `headScripts` 대신 `RootDocument`에 직접 둔다. 스펙은 "인라인 블로킹 스크립트"까지만 정하고 수단을 열어 뒀다.
2. 다크 값이 필요한 크롬이 **8개**다. 스펙이 `body` 배경을 빠뜨렸다.

**계획에서 새로 드러난 것 — 실측으로 확인.** `dark:` 유틸리티가 Tailwind v4 기본값으로는 `prefers-color-scheme` 미디어 쿼리로 컴파일되는데 팔레트는 `.dark` 클래스를 쓴다. 추측하지 않고 `@tailwindcss/cli`로 직접 컴파일해 양쪽을 확인했다 — 기본값은 `@media (prefers-color-scheme: dark)`, `@custom-variant` 적용 후는 `:where(.dark, .dark *)`. 맞추지 않으면 **크롬 색과 팔레트 색이 서로 다른 신호를 따라 갈라진다.** T2 Step 4에 넣었다.

**기준선 재생성 횟수.** T1(2장) → T2(4장) → T3(4장) → T4(4장) → T5(2장). 다섯 번이다. 매번 "무엇이 바뀔지 먼저 적고 diff로 대조"를 요구하는 것은 ①에서 배운 것 때문이다 — 재생성 후의 통과는 정확성의 증거가 아니다.

**타입 일관성.** `ThemeChoice` `THEME_KEY` `resolveDark` `THEME_INIT_SCRIPT`를 T2가 만들고 T3이 쓴다. `Portfolio` 타입은 ①에서 만든 파생 별칭을 그대로 쓴다 — 새로 만들지 않는다.

**자동 테스트가 못 보는 것.** 선택 하이라이트(T1 S10), hover(T1 S10), 320/375px(T1 S10), 바탕색 대비(T2 S6), 흰 깜빡임(T2 S6), 3순환과 OS 추종(T3 S3), 띠의 테마 추종(T4 S3), 앵커 스크롤(T5 S4). 전부 손 확인 스텝으로 넣었다.
