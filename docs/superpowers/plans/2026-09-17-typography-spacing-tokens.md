# 타이포·간격 토큰 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/styles/tokens.theme.css`를 신설해 사이트의 타이포와 간격을 토큰으로 닫고, Tailwind의 숫자 유틸리티를 구조적으로 봉인한다.

**Architecture:** 값의 출처는 design-system-starter 스키마 v1이고, Tailwind v4 네이티브 네임스페이스(`--text-*` `--spacing-*` `--font-*` `--tracking-*`)로 매핑한다. 토큰을 먼저 **가산적으로** 들여 렌더를 바꾸지 않고(Task 1), 구역별로 호출부를 전환한 뒤(Task 2–6), 마지막에 `*: initial`로 기본 스케일을 봉인한다(Task 7). 이 순서 덕분에 중간 어느 시점에도 사이트가 깨지지 않는다.

**Tech Stack:** Tailwind CSS v4.3.3, TanStack Start, Playwright, pnpm

**설계 문서:** `docs/superpowers/specs/2026-09-17-typography-spacing-tokens-design.md` — 결정의 근거는 전부 거기 있다. 값이 왜 이 값인지 의심되면 계획이 아니라 스펙을 봐라.

## Global Constraints

- 패키지 매니저는 **pnpm**이다. npm·yarn을 쓰지 않는다.
- 커밋은 [Conventional Commits](https://www.conventionalcommits.org). commit-msg 훅의 commitlint가 강제한다. 메시지는 한국어로 쓴다 (기존 이력을 따른다).
- `pnpm test` 전에 **반드시 `pnpm build`** 가 되어 있어야 한다. 빌드 결과물을 서빙해 검사한다.
- 스크린샷 기준선은 **darwin 전용**이다. 실패하면 **먼저 diff 이미지를 보고 의도한 변경인지 확인한 뒤에만** `--update-snapshots`로 다시 뜬다. 근거 없이 재생성하면 회귀를 정상으로 굳힌다.
- `src/styles/palette.theme.css`는 생성물이다. **절대 건드리지 않는다.**
- `TitleBar`의 닫기·최소화 버튼은 `<button>`이어야 한다 (`tests/pages.spec.ts`가 `nav button`으로 찾는다).
- `global.css`의 리셋은 `@layer base` 안에 있어야 한다. 밖으로 꺼내지 않는다.
- 시키지 않은 색 리팩터링을 시작하지 않는다. 팔레트는 이미 닫혔다.
- 범위 밖: 폰트 교체, ColorBar에 타이포·간격 그리기, starter에 exporter 붙이기, radius/elevation 토큰화.

## 봉인이 죽이는 것 / 살리는 것 (Tailwind 4.3.3 실측)

Task 7에서 `--spacing: initial` 외 3줄을 넣는 순간 아래 왼쪽 열이 **존재하지 않는 클래스**가 된다. Task 2–6에서 호출부를 옮길 때 왼쪽 열을 남기지 마라.

| 죽는다                                                          | 산다                                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mt-4` `px-2` `gap-1.5` `pl-7` 등 숫자 간격                     | 임의값 `pl-[12px]` `h-[13px]` `max-w-[1024px]` `opacity-[.62]`                                                                         |
| `min-w-20` `min-w-2` 등 숫자 치수                               | 분수 `top-1/2` `-translate-y-1/2`                                                                                                      |
| `top-3` `right-3` 등 숫자 위치                                  | static `w-full` `h-px` `w-px` `z-50` `flex-1` `mx-auto` `min-h-screen`                                                                 |
| **`p-0` `m-0` `my-0` `py-0` `pr-0` `left-0` `top-0` `right-0`** | `border` `border-t` `border-collapse` `rounded` `rounded-md` `rounded-t-md` `rounded-full`                                             |
| `text-base` `text-2xl` 등 기본 타입 스케일                      | `outline-2` `outline-offset-2` `underline` `uppercase` `list-none` `float-right` `invisible` `align-top` `select-none` `overflow-auto` |
|                                                                 | `text-accent-solid` — 색은 `--color-*`에서 온다                                                                                        |
|                                                                 | `font-bold` `font-medium` `font-normal` — `--font-weight-*`는 별개 네임스페이스                                                        |

**프로필을 이기는 유틸리티에 주의하라.** 프로필은 `font-weight: var(--tw-font-weight, var(--text-*--font-weight))`로 컴파일된다. 남겨 둔 `font-bold`는 **클래스 순서와 무관하게** 프로필의 weight를 덮는다. `leading-*`도 `--tw-leading`으로 같다. 프로필로 옮긴 자리의 `font-bold`·`font-normal`·`font-medium`·`leading-*`는 반드시 지워라.

## File Structure

| 파일                                                                | 책임                                                                    | Task |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| `src/styles/tokens.theme.css`                                       | **신설.** 폰트·자간·타입 프로필·간격 별칭의 단일 출처. 손으로 쓰는 파일 | 1, 7 |
| `src/styles/global.css`                                             | 토큰 파일 import, `html/body` 폰트를 `var(--font-system)`으로           | 1    |
| `src/routes/index.tsx`                                              | 랜딩                                                                    | 2    |
| `src/routes/about.tsx`                                              | `/about` 창·h1·h2·article                                               | 3    |
| `src/components/about/classes.ts`                                   | 반복 클래스 상수 (표·섹션·본문·기술라벨)                                | 4    |
| `src/components/about/{ExperienceItem,JobSection,LanguageList}.tsx` | 이력서 하위 컴포넌트                                                    | 5    |
| `src/components/{about/TitleBar,ColorBar,ThemeToggle}.tsx`          | 크롬 3종                                                                | 6    |
| `tests/tailwind-setup.spec.ts`                                      | 계약 테스트 ①②                                                          | 2, 7 |
| `tests/pages.spec.ts-snapshots/*.png`                               | 기준선 4장                                                              | 2–7  |
| `CLAUDE.md`                                                         | 새 파일·봉인 기제·예외 목록                                             | 7    |

`src/components/about/PortfolioItem.tsx`는 `classes.ts` 상수만 쓰므로 **수정 대상이 아니다.**

---

### Task 1: 토큰 파일 신설 (가산적 — 렌더가 바뀌지 않는다)

**Files:**

- Create: `src/styles/tokens.theme.css`
- Modify: `src/styles/global.css` (import 추가, `html/body` 폰트)

**Interfaces:**

- Consumes: 없음 (첫 태스크)
- Produces: 유틸리티 이름 — 타입 `text-heading-xl` `text-heading-lg` `text-heading-md` `text-heading-sm` `text-heading-xs` `text-heading-xxs` `text-body-md` `text-body-sm` `text-caption-sm` `text-caption-xxs`; 폰트 `font-sans` `font-system` `font-chrome` `font-mono`; 자간 `tracking-tight` `tracking-normal` `tracking-wide`; 간격 접미사 `none xxs xs sm md lg xl xxl section` (예: `mt-lg` `px-section` `-ml-xl` `after:mx-sm` `max-[321px]:py-xxs`)

- [ ] **Step 1: 토큰 파일을 만든다**

`src/styles/tokens.theme.css`:

```css
/* 타이포·간격 토큰.
 *
 * **생성물이 아니다 — 손으로 쓰는 파일이다.** 옆의 palette.theme.css와 혼동하지
 * 마라. 그쪽은 design-system-starter의 산출물이라 직접 고치면 다음 추출 때
 * 날아간다. 이 파일은 고쳐도 된다.
 *
 * 값의 출처는 starter의 스키마 v1이다 (src/schema/typography.ts,
 * src/schema/spacing.ts). 크기·굵기·행간·자간·간격은 전부 그쪽 스케일 안의
 * 값이어야 한다:
 *
 *   SIZE_SCALE        10 11 12 14 16 18 20 24 28 32 36 48 64
 *   WEIGHT_SCALE      400 500 600 700
 *   LINE_HEIGHT_SCALE 1.0 1.1 1.2 1.3 1.4 1.5
 *   LETTER_SPACING    -0.02em  0  0.05em
 *   SPACING_SCALE     2 4 8 12 16 20 24 32 48 64 80 96
 *
 * 스케일은 제약으로 따르되 **프로필은 이 사이트가 정한다** — 어느 역할이 어느
 * 조합인지는 starter 기본값을 베끼지 않는다. starter의 heading-xl은 weight
 * 500이지만 랜딩 'ㅊㅎㄴ'이 bold인 것은 이 사이트의 판단이다.
 *
 * 설계: docs/superpowers/specs/2026-09-17-typography-spacing-tokens-design.md
 */

@theme {
  /* ── 폰트 ──────────────────────────────────────────────────────────────
     교체가 아니라 이름 붙이기다. 지금 쓰던 스택을 그대로 옮겼을 뿐이라
     렌더는 바뀌지 않는다. 폰트 교체는 별건으로 다룬다. */
  --font-sans: 'Noto Sans KR', sans-serif;
  --font-system:
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
    Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  --font-chrome:
    HelveticaNeue, 'Helvetica Neue', 'Lucida Grande', Arial, sans-serif;
  /* Tailwind 기본값을 복사해 고정한다. Task 7의 `--font-*: initial`이 기본값을
     지우므로, 여기 명시하지 않으면 ColorBar·ThemeToggle의 font-mono가 사라진다. */
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;

  /* ── 자간 ── starter LETTER_SPACING_VALUES 세 값이 전부다. */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;

  /* ── 타입 프로필 ────────────────────────────────────────────────────────
     토큰 하나가 크기·굵기·행간·자간 넷을 싣는다 — `text-heading-xl` 하나면
     `text-[6rem] leading-[1.15] font-bold` 셋을 대신한다.

     소비자가 있는 10개만 정의한다. starter의 code/button/badge/nav/card/link와
     body-lg·caption-md/xs는 쓰는 자리가 없다. 죽은 토큰은 시스템이 아니라 목록이다. */

  /* 랜딩 'ㅊㅎㄴ' */
  --text-heading-xl: 64px;
  --text-heading-xl--font-weight: 700;
  --text-heading-xl--line-height: 1.1;
  --text-heading-xl--letter-spacing: 0;

  /* /about h1 — 이름 */
  --text-heading-lg: 48px;
  --text-heading-lg--font-weight: 700;
  --text-heading-lg--line-height: 1.1;
  --text-heading-lg--letter-spacing: 0;

  /* h2 — 섹션 */
  --text-heading-md: 32px;
  --text-heading-md--font-weight: 700;
  --text-heading-md--line-height: 1.2;
  --text-heading-md--letter-spacing: 0;

  /* h3 — 회사명 */
  --text-heading-sm: 24px;
  --text-heading-sm--font-weight: 700;
  --text-heading-sm--line-height: 1.3;
  --text-heading-sm--letter-spacing: 0;

  /* h4 — 섹션 제목 */
  --text-heading-xs: 18px;
  --text-heading-xs--font-weight: 700;
  --text-heading-xs--line-height: 1.4;
  --text-heading-xs--letter-spacing: 0;

  /* 직무명 <summary> — 제목 계열이지만 굵기가 한 단 낮다 */
  --text-heading-xxs: 16px;
  --text-heading-xxs--font-weight: 500;
  --text-heading-xxs--line-height: 1.4;
  --text-heading-xxs--letter-spacing: 0;

  /* 본문 */
  --text-body-md: 16px;
  --text-body-md--font-weight: 400;
  --text-body-md--line-height: 1.5;
  --text-body-md--letter-spacing: 0;

  /* 표 · 기술라벨 · h4 옆 기간 */
  --text-body-sm: 14px;
  --text-body-sm--font-weight: 400;
  --text-body-sm--line-height: 1.5;
  --text-body-sm--letter-spacing: 0;

  /* 최종 수정 · 랜딩 copyright */
  --text-caption-sm: 12px;
  --text-caption-sm--font-weight: 400;
  --text-caption-sm--line-height: 1.4;
  --text-caption-sm--letter-spacing: 0;

  /* ThemeToggle */
  --text-caption-xxs: 10px;
  --text-caption-xxs--font-weight: 400;
  --text-caption-xxs--line-height: 1.3;
  --text-caption-xxs--letter-spacing: 0;

  /* ── 간격 ──────────────────────────────────────────────────────────────
     starter BASE_ALIASES + section 그대로. 추가한 것은 `none` 하나뿐이다 —
     Task 7의 `--spacing: initial`이 p-0·m-0까지 죽이기 때문이다. */
  --spacing-none: 0px;
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-section: 96px;
}
```

- [ ] **Step 2: `global.css`가 토큰 파일을 import하게 한다**

`src/styles/global.css`의 팔레트 import 바로 다음 줄에 추가한다:

```css
@import './palette.theme.css';
@import './tokens.theme.css';
```

- [ ] **Step 3: `html, body`의 폰트 스택을 토큰으로 돌린다**

`src/styles/global.css`의 `@layer base` 안, `html, body` 규칙에서 긴 스택을 지우고 토큰을 가리킨다. **값이 같으므로 렌더는 바뀌지 않는다.**

```css
html,
body {
  padding: 0;
  margin: 0;
  /* 스택 자체는 tokens.theme.css의 --font-system에 있다. 두 곳에 두면 갈라진다. */
  font-family: var(--font-system);
  background-color: rgba(170, 183, 191, 0.2);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: 빌드하고 기존 테스트가 전부 통과하는지 확인한다**

Run: `pnpm build && pnpm test`
Expected: **PASS 전부.** 이 태스크는 가산적이라 스크린샷 4장이 **하나도 바뀌면 안 된다.** 스크린샷이 깨지면 `--font-system` 스택을 잘못 옮긴 것이다 — `--update-snapshots`를 치지 말고 스택을 원본과 글자 단위로 대조하라.

- [ ] **Step 5: 타입·린트·포맷 게이트**

Run: `pnpm type-check && pnpm lint && pnpm format:check`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add src/styles/tokens.theme.css src/styles/global.css
git commit -m "feat(tokens): 타이포·간격 토큰 파일을 신설한다"
```

---

### Task 2: 랜딩 전환 + 계약 테스트 ①

**Files:**

- Modify: `src/routes/index.tsx`
- Test: `tests/tailwind-setup.spec.ts` (테스트 추가)
- Modify: `tests/pages.spec.ts-snapshots/landing.png`, `landing-dark.png`

**Interfaces:**

- Consumes: Task 1의 `text-heading-xl` `text-caption-sm` `px-xs` `py-xxl` `gap-x-md` `m-none`
- Produces: 없음 (호출부 전환)

- [ ] **Step 1: 계약 테스트 ①을 먼저 쓴다 (아직 실패해야 한다)**

`tests/tailwind-setup.spec.ts` 끝에 추가:

```ts
// 타입 프로필이 ?url 스타일시트를 통해 실제로 페이지에 닿는지 본다. 크기뿐 아니라
// 굵기·행간까지 확인하는 이유: 프로필은 셋을 한 토큰에 싣는데, 호출부에 font-bold나
// leading-*이 남아 있으면 --tw-font-weight/--tw-leading이 서서 클래스 순서와 무관하게
// 프로필을 이긴다. 크기만 보면 그 덮어쓰기를 놓친다.
test('the landing hero renders at the heading-xl profile', async ({ page }) => {
  await page.goto('/');
  const type = await page
    .locator('h1')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
      };
    });
  // 64px × 1.1 = 70.4px
  expect(type).toEqual({
    fontSize: '64px',
    fontWeight: '700',
    lineHeight: '70.4px',
  });
});
```

- [ ] **Step 2: 실패를 확인한다**

Run: `pnpm build && pnpm test tailwind-setup`
Expected: FAIL — `fontSize`가 `96px`, `lineHeight`가 `110.4px`로 나온다.

- [ ] **Step 3: 랜딩을 토큰으로 옮긴다**

`src/routes/index.tsx`의 JSX를 이렇게 바꾼다. 주석 블록은 전부 그대로 둔다.

```jsx
    <div className="flex flex-1 flex-col items-center justify-center px-xs">
      <main className="flex flex-1 flex-col items-center justify-center py-xxl">
        <h1 className="m-none flex gap-x-md text-center text-heading-xl">
```

`h1`에서 `text-[6rem]` `leading-[1.15]` `font-bold` 셋이 사라지고 `text-heading-xl` 하나가 대신한다. 셋 중 하나라도 남기면 프로필을 덮어써서 Step 1의 테스트가 깨진다.

footer의 copyright:

```jsx
        <div className="text-caption-sm text-neutral-solid">
```

`h-[50px]`은 그대로 둔다 — 치수는 간격 토큰이 아니다.

- [ ] **Step 4: 계약 테스트 ①이 통과하는지 확인한다**

Run: `pnpm build && pnpm test tailwind-setup`
Expected: PASS (이 파일의 세 테스트 전부)

- [ ] **Step 5: 스크린샷 차이를 눈으로 확인한다**

Run: `pnpm test pages`
Expected: `landing.png`·`landing-dark.png` FAIL. `about.png`·`about-dark.png`는 **통과해야 한다** — 랜딩만 건드렸다.

`test-results/`의 diff 이미지를 열어 확인할 것:

- `ㅊㅎㄴ` 세 글자가 96px → 64px로 작아졌다
- 글자 사이 간격이 그대로다 (16px)
- copyright가 12.8px → 12px
- 세로 중앙 정렬이 유지된다 (`py-20`→`py-xxl`은 flex 중앙정렬이라 영향 없다)

about 쪽이 함께 깨졌다면 랜딩 밖을 건드린 것이다. 되돌려라.

- [ ] **Step 6: 기준선을 다시 뜬다**

Run: `pnpm test pages --update-snapshots`
Then: `pnpm test`
Expected: PASS 전부

- [ ] **Step 7: 커밋**

```bash
git add src/routes/index.tsx tests/tailwind-setup.spec.ts tests/pages.spec.ts-snapshots/
git commit -m "feat(tokens): 랜딩을 타이포·간격 토큰으로 옮긴다"
```

---

### Task 3: `/about` 셸 전환

**Files:**

- Modify: `src/routes/about.tsx`
- Modify: `tests/pages.spec.ts-snapshots/about.png`, `about-dark.png`

**Interfaces:**

- Consumes: Task 1의 `text-heading-lg` `text-heading-md` `text-body-md` `text-caption-sm` `font-chrome` `font-sans` `px-section` `pt-section` `pb-section` `mb-xl` `mt-xxl` `mb-md` `-ml-xl` `m-none` `my-none`
- Produces: 없음

- [ ] **Step 1: h2 클래스 상수를 옮긴다**

`src/routes/about.tsx`의 `const h2`:

```jsx
const h2 =
  'mt-xxl mb-md -ml-xl text-heading-md ' +
  "before:content-['˙'] before:text-[56px] " +
  'before:leading-[28px] before:text-accent-text';
```

`before:text-[56px]`와 `before:leading-[28px]`는 **그대로 둔다.** 장식 글리프의 광학 보정값이라 타입 역할이 아니다 (스펙의 예외 목록).

- [ ] **Step 2: 창 프레임을 옮긴다**

같은 파일의 창 `<div>` className에서 두 곳만 바꾼다:

- `font-[HelveticaNeue,'Helvetica_Neue','Lucida_Grande',Arial,sans-serif]` → `font-chrome`
- `max-[1025px]:my-0` → `max-[1025px]:my-none`

`my-[6vh]` `max-w-[1024px]` `rounded-md` `border-[#acacac]` `shadow-[0px_0px_20px_#acacac]` `max-[1025px]:mx-auto` 및 `dark:` 변형은 **전부 그대로 둔다.** 유동값·치수·하드코딩 크롬 색이라 대상이 아니다.

- [ ] **Step 3: article을 옮긴다**

```jsx
        <article className="px-section pt-section pb-section font-sans text-body-md max-[1025px]:px-[10vw] max-[1025px]:pt-[9vw] max-[1025px]:pb-[10vw]">
```

`px-36`→`px-section`, `pt-24`→`pt-section`, `pb-32`→`pb-section`,
`font-['Noto_Sans_KR',sans-serif]`→`font-sans`.
`text-[16px]` `leading-[1.5]` `font-normal` 셋은 **지운다** — `text-body-md`가 셋을 다 싣는다. `font-normal`을 남기면 하위 요소가 상속받을 프로필 weight를 덮는다.

`max-[1025px]:` 유동값 셋은 그대로 둔다.

바로 위의 1025px 주석도 그대로 둔다.

- [ ] **Step 4: 최종 수정 문단과 h1을 옮긴다**

```jsx
          <p className="float-right m-none text-caption-sm">
            최종 수정: {content.lastUpdatedAt}
          </p>
          <h1 className="mb-xl text-heading-lg tracking-[6px]">
            {content.title}
          </h1>
```

`p`: `m-0`→`m-none`, `text-[12px] leading-[1.6]`→`text-caption-sm`.
`h1`: `mb-8`→`mb-xl`, `text-[42px]`→`text-heading-lg`, `font-bold` **삭제**(프로필이 700을 싣는다), `tracking-[6px]`는 **남긴다**(이름 표기의 서명 — 스펙의 예외 목록).

- [ ] **Step 5: 스크린샷 차이를 눈으로 확인한다**

Run: `pnpm build && pnpm test pages`
Expected: `about.png`·`about-dark.png` FAIL, 랜딩 2장 PASS.

diff에서 확인할 것:

- **창의 좌우 여백이 144px → 96px** (양쪽 48px씩 줄어 본문이 넓어진다) — 이 태스크에서 가장 큰 변화다
- 아래 여백 128px → 96px
- 이름이 42px → 48px, 자간 6px 유지
- `˙` 장식이 56px 그대로, h2 본문만 30px → 32px
- 최종 수정이 12px 그대로(행간만 1.6→1.4)

- [ ] **Step 6: 기준선을 다시 뜬다**

Run: `pnpm test pages --update-snapshots && pnpm test`
Expected: PASS 전부

- [ ] **Step 7: 타입·린트 게이트와 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format:check
git add src/routes/about.tsx tests/pages.spec.ts-snapshots/
git commit -m "feat(tokens): /about 셸을 타이포·간격 토큰으로 옮긴다"
```

---

### Task 4: `classes.ts` 전환 — 표 행 높이를 padding으로 바꾼다

**Files:**

- Modify: `src/components/about/classes.ts`
- Modify: `tests/pages.spec.ts-snapshots/about.png`, `about-dark.png`

**Interfaces:**

- Consumes: Task 1의 `text-body-sm` `text-body-md` `text-heading-xs` `mt-lg` `mt-md` `mb-md` `ml-xxs` `my-xs` `py-xs` `py-xxs` `pl-xs` `pr-lg` `pr-none` `after:mx-sm`
- Produces: 상수 이름은 전부 그대로 유지한다 — `infoTable` `infoTableRow` `infoTableTh` `infoTableTd` `sectionWrap` `sectionH4` `sectionH4Span` `contentP` `bodyP` `techLabel` `linkColor`. Task 5와 `PortfolioItem.tsx`가 이 이름들을 import한다.

- [ ] **Step 1: 상수들을 토큰으로 옮긴다**

`src/components/about/classes.ts`. 파일 맨 위의 `max-[Npx]:` 설명 주석과 각 상수의 `/** .infoTable */` 꼬리표 주석은 **전부 그대로 둔다.**

```ts
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
```

바뀐 것 정리: `mt-5`→`mt-lg`, `min-w-40`→`min-w-[160px]`, `text-[14px]`→`text-body-sm`, `min-w-31`→`min-w-[124px]`, `leading-[2.5]`→`py-xs`, `max-[376px]:min-w-16`→`min-w-[64px]`, `max-[321px]:leading-[2.3]`→`max-[321px]:py-xxs`, `pr-6`→`pr-lg`, `max-[321px]:py-0`→`py-xxs`, `max-[321px]:pr-0`→`pr-none`, `pl-2`→`pl-xs`, `mt-4`→`mt-md`, `my-7 mb-4`→`mt-lg mb-md`, `text-[20px]`→`text-heading-xs`, `ml-1`→`ml-xxs`, `text-[16px]`(span)→`text-body-sm`, `my-[0.4rem] leading-[1.6]`→`my-xs`, `text-[16px]`(bodyP)→`text-body-md`, `mx-[0.7rem]`→`mx-sm`, `after:text-[14px]`→`after:text-body-sm after:font-bold`.

- [ ] **Step 2: 스크린샷 차이를 눈으로 확인한다**

Run: `pnpm build && pnpm test pages`
Expected: about 2장 FAIL, 랜딩 2장 PASS.

diff에서 확인할 것:

- 표의 행 높이가 35px → 37px (행마다 2px씩 커진다)
- h4 제목이 20px → 18px, 옆의 `(기간)`이 16px → 14px
- 기술 스택의 `|` 구분자가 여전히 **굵다** — 안 굵으면 `after:font-bold`를 빠뜨린 것이다
- 단락 사이가 6.4px → 8px

- [ ] **Step 3: 기준선을 다시 뜨고 전체 통과를 확인한다**

Run: `pnpm test pages --update-snapshots && pnpm test`
Expected: PASS 전부. 특히 `minimize button toggles every details element`와 `close button navigates back to landing`이 계속 통과해야 한다.

- [ ] **Step 4: 타입·린트 게이트와 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format:check
git add src/components/about/classes.ts tests/pages.spec.ts-snapshots/
git commit -m "feat(tokens): classes.ts를 토큰으로 옮기고 표 행 높이를 padding으로 바꾼다"
```

---

### Task 5: 이력서 하위 컴포넌트 전환

**Files:**

- Modify: `src/components/about/ExperienceItem.tsx`
- Modify: `src/components/about/JobSection.tsx`
- Modify: `src/components/about/LanguageList.tsx`
- Modify: `tests/pages.spec.ts-snapshots/about.png`, `about-dark.png`

`src/components/about/PortfolioItem.tsx`는 `classes.ts` 상수만 쓰므로 **건드리지 않는다.**

**Interfaces:**

- Consumes: Task 1의 `text-heading-sm` `text-heading-xxs` `text-body-md` `text-body-sm` `mt-xs` `my-md` `my-xs` `my-xxs` `ml-xxs` `ml-xs` `mb-xs` `mb-md` `pl-sm` `pl-lg` `p-none` `after:mx-sm` `after:right-none`; Task 4의 `classes.ts` 상수 (이름 불변)
- Produces: 없음

- [ ] **Step 1: `ExperienceItem.tsx`의 h3**

```jsx
<h3 className="mt-xs text-heading-sm">{item.company}</h3>
```

`mt-2`→`mt-xs`, `text-[24px]`→`text-heading-sm`.

- [ ] **Step 2: `JobSection.tsx`의 상세 업무 목록**

27행부터의 `<ul>` 블록. 18–20행의 `nth-of-type` 설명 주석은 그대로 둔다.

```jsx
<ul aria-label="상세 업무" className="my-md list-none pl-sm">
  {item.jobs.map((job, idx) => (
    <li key={idx}>
      <details className="overflow-visible" open>
        <summary
          className={`my-xxs cursor-pointer text-heading-xxs ${c.linkColor}`}
        >
          <span className="ml-xxs text-neutral-text-strong">{job.summary}</span>
        </summary>
        <ul className="my-xs mb-md list-['•'] pl-lg">
          {job.detail.map((detail, i) => (
            <li className="mb-xs text-body-md" key={detail[0] + i}>
              <div
                className="resumeHtml ml-xs"
                dangerouslySetInnerHTML={{ __html: detail }}
              />
            </li>
          ))}
        </ul>
      </details>
    </li>
  ))}
</ul>
```

`summary`에서 `text-[18px]` `leading-[1.65]` `font-medium` 셋이 `text-heading-xxs` 하나로 바뀐다. `font-medium`을 남기면 프로필을 덮으므로 반드시 지운다.

- [ ] **Step 3: `LanguageList.tsx`**

```jsx
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
```

`p-0`→`p-none`, `after:right-0`→`after:right-none`, `min-w-20`→`min-w-[80px]`, `after:mx-[0.65rem]`→`after:mx-sm`, `after:text-[14px]`→`after:text-body-sm after:font-bold`(`techLabel`과 같은 이유 — 프로필 weight가 부모의 bold 상속을 끊는다).

- [ ] **Step 4: 스크린샷 차이를 눈으로 확인한다**

Run: `pnpm build && pnpm test pages`
Expected: about 2장 FAIL, 랜딩 2장 PASS.

diff에서 확인할 것:

- 회사명이 24px 그대로(행간만 1.3으로 붙는다)
- 직무명이 18px → 16px, 굵기 500 유지
- 불릿 들여쓰기가 28px → 24px
- 언어 목록의 `|` 구분자가 여전히 굵다

- [ ] **Step 5: 기준선을 다시 뜨고 전체 통과를 확인한다**

Run: `pnpm test pages --update-snapshots && pnpm test`
Expected: PASS 전부

- [ ] **Step 6: 타입·린트 게이트와 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format:check
git add src/components/about/ tests/pages.spec.ts-snapshots/
git commit -m "feat(tokens): 이력서 하위 컴포넌트를 토큰으로 옮긴다"
```

---

### Task 6: 크롬 3종 — 예외 구역의 숫자 유틸리티를 임의값으로 명시한다

**Files:**

- Modify: `src/components/about/TitleBar.tsx`
- Modify: `src/components/ColorBar.tsx`
- Modify: `src/components/ThemeToggle.tsx`
- Modify: 기준선 4장 전부 (ColorBar·ThemeToggle은 두 라우트 모두에 뜬다)

**Interfaces:**

- Consumes: Task 1의 `text-caption-xxs` `pt-xs` `pr-xl` `pb-xl` `mt-xxs` `px-xs` `py-xxs` `top-sm` `right-sm` `left-none` `top-none`
- Produces: 없음

**이 태스크의 성격이 다르다.** TitleBar와 ColorBar 스트립 내부는 스펙의 예외 구역이라 **값을 바꾸지 않는다.** 그런데 Task 7의 봉인이 숫자 유틸리티를 죽이므로, 예외 구역도 숫자를 임의값으로 명시해야 한다. 값이 같으니 이 자리들은 렌더가 안 바뀐다.

- [ ] **Step 1: `TitleBar.tsx` — 숫자 유틸리티 둘을 임의값으로**

18행 `glyph` 상수:

```ts
const glyph = 'inline-block align-top min-w-[8px] text-[10px] leading-[14px]';
```

23행 `<nav>`:

```jsx
      <nav className="absolute top-1/2 flex -translate-y-1/2 gap-x-[7px] pl-[12px]">
```

`min-w-2`→`min-w-[8px]`, `pl-3`→`pl-[12px]`. **둘 다 값이 같다.** `top-1/2`와 `-translate-y-1/2`는 분수라 봉인에도 살아남으므로 그대로 둔다. 22행 컨테이너의 `text-[11pt]` `py-[5px]`와 하드코딩 색, 11–16행 `rounded-full` 주석, 8–9행 신호등 색 주석은 전부 그대로 둔다.

- [ ] **Step 2: `ColorBar.tsx` — 바깥 여백은 토큰, 스트립 내부 기하는 임의값**

62행 `<Link>`의 className:

```jsx
className =
  'group flex w-full flex-col items-end pt-xs pr-xl pb-xl text-neutral-text-strong';
```

64행:

```jsx
      <div className="flex items-end gap-[6px]">
```

69–70행 레지스터 마크의 십자선 두 줄:

```jsx
          <span className="absolute top-[6px] left-none h-px w-[13px] bg-current" />
          <span className="absolute top-none left-[6px] h-[13px] w-px bg-current" />
```

99행 크레딧:

```jsx
      <div className="mt-xxs font-mono text-[8px] text-right tracking-[.09em] uppercase opacity-[.62] group-hover:underline">
```

`pt-2 pr-8 pb-8`→`pt-xs pr-xl pb-xl`(값 동일), `gap-1.5`→`gap-[6px]`(6px는 스케일 밖 — 스트립 내부 기하라 예외), `left-0`→`left-none`, `top-0`→`top-none`, `mt-1`→`mt-xxs`(값 동일). `text-[8px]` `tracking-[.09em]` `h-[13px]` `w-[13px]` `h-[7px]` `w-[7px]` `h-[3px]` `w-[19px]` `h-[12px]` `opacity-[.55]` `opacity-[.62]`는 **전부 그대로** — 인쇄 컨트롤 스트립 인용이다. 59–61행의 "pr/pb 32px: 교정지의 컨트롤 스트립도 종이 끝에 닿지는 않는다" 주석은 값이 안 바뀌므로 그대로 둔다.

- [ ] **Step 3: `ThemeToggle.tsx`**

98행 `className`에서 네 곳:

```
fixed top-sm right-sm z-50 rounded border border-neutral-border bg-neutral-subtle-bg px-xs py-xxs font-mono text-caption-xxs tracking-wide text-neutral-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-solid
```

`top-3 right-3`→`top-sm right-sm`(값 동일), `px-2 py-1`→`px-xs py-xxs`(값 동일), `text-[10px]`→`text-caption-xxs`(값 동일). `tracking-wide`는 이름이 같지만 값이 0.025em → **0.05em으로 바뀐다** — 의도된 변화다 (스펙). `outline-2` `outline-offset-2` `z-50` `rounded`는 봉인에도 살아남으므로 그대로 둔다. 91–95행의 `all: unset` 포커스 링 주석도 그대로 둔다.

- [ ] **Step 4: 스크린샷 차이를 눈으로 확인한다**

Run: `pnpm build && pnpm test pages`
Expected: **4장 전부 FAIL** — ThemeToggle의 자간이 두 라우트 모두에서 벌어진다.

diff에서 확인할 것:

- ThemeToggle 라벨의 자간만 아주 조금 넓어졌다
- **TitleBar와 ColorBar는 픽셀 하나 안 바뀌어야 한다.** 바뀌었다면 임의값 치환에서 값을 잘못 옮긴 것이다 — 기준선을 뜨지 말고 되돌려 대조하라

- [ ] **Step 5: 기준선을 다시 뜨고 전체 통과를 확인한다**

Run: `pnpm test pages --update-snapshots && pnpm test`
Expected: PASS 전부

- [ ] **Step 6: 타입·린트 게이트와 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format:check
git add src/components/ tests/pages.spec.ts-snapshots/
git commit -m "feat(tokens): 크롬 3종의 숫자 유틸리티를 걷어낸다"
```

---

### Task 7: 봉인 + 계약 테스트 ② + 문서

**Files:**

- Modify: `src/styles/tokens.theme.css` (봉인 블록 추가)
- Test: `tests/tailwind-setup.spec.ts` (테스트 추가)
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: Task 1–6 전부
- Produces: 없음 (마지막 태스크)

- [ ] **Step 1: 남은 숫자 유틸리티를 전수 조사한다**

봉인 전에 소스를 훑는다. 아래가 **아무것도 출력하지 않아야** 한다:

```bash
grep -rnoE --include='*.tsx' --include='*.ts' \
  '(^|[ "'"'"'`])-?(m|p)[trblxyse]?-[0-9]|(^|[ "'"'"'`])gap(-[xy])?-[0-9]|(^|[ "'"'"'`])(min-|max-)?(w|h|size)-[0-9]|(^|[ "'"'"'`])(top|right|bottom|left|inset)-[0-9]' \
  src
```

`.tsx`·`.ts`로 좁히는 이유는 CSS 주석이 거짓 양성을 내기 때문이다 — Step 4에서 넣을 봉인 블록의 주석 자체가 `mt-4` · `p-0` · `min-w-20` · `top-3`을 예시로 들고 있다. (`--include`의 glob은 zsh가 먼저 펼치지 않도록 반드시 따옴표로 묶어라.)

출력이 있으면 Task 2–6에서 빠뜨린 자리다. 단 **`top-1/2`는 거짓 양성**이다 — 분수라 봉인에도 살아남는다. TitleBar의 `nav`에 있는 그것 하나만 무시하고 나머지는 전부 고쳐라. 어느 별칭으로 갈지는 스펙의 「전 구역 매핑」 표를 봐라.

- [ ] **Step 2: 계약 테스트 ②를 쓴다**

**이 테스트는 "먼저 실패시키기"가 안 된다.** 변경 전 빌드에는 `var(--spacing)`이 36회 나오지만, Task 2–6이 호출부를 전부 걷어냈으므로 **봉인 전에도 이미 0**이다. 그래서 순서를 뒤집는 대신 Step 3에서 테스트가 물 수 있는지를 직접 증명한다.

`tests/tailwind-setup.spec.ts` 끝에 추가:

```ts
// 숫자 간격 유틸리티가 봉인됐는지 컴파일 결과의 지문으로 확인한다. mt-4·p-0 같은
// 유틸리티는 전부 calc(var(--spacing) * N)으로 컴파일되므로, 봉인이 살아 있으면
// 이 문자열이 스타일시트 어디에도 안 나온다. (이름 별칭은 var(--spacing-md)를
// 쓰므로 여기 안 걸린다 — 봉인되는 것은 접미사 없는 --spacing 하나다.)
//
// 변수의 존재를 보거나 클래스를 심어 확인하지 않는 이유: Tailwind는 소스에 없는
// 클래스를 컴파일하지 않고 미사용 테마 변수는 tree-shake한다. 그래서 두 방법 다
// 봉인이 풀린 상태에서도 통과해 버린다 — 거짓 방어선이 된다.
//
// 이 테스트가 잡는 것은 "봉인이 풀렸고 누가 숫자 유틸리티를 다시 썼다"는 짝이다.
// 봉인이 살아 있는 채로 누가 mt-4를 쓰면 클래스가 조용히 없을 뿐이라 여기 안
// 걸린다 — 그건 스크린샷이 잡는다.
test('the numeric spacing scale stays sealed', async ({ page }) => {
  await page.goto('/about');
  const hits = await page.evaluate(() => {
    const count = (rules: CSSRuleList): number => {
      let n = 0;
      for (const rule of Array.from(rules)) {
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested) n += count(nested);
        if (
          rule instanceof CSSStyleRule &&
          rule.cssText.includes('var(--spacing)')
        ) {
          n += 1;
        }
      }
      return n;
    };
    return Array.from(document.styleSheets).reduce((n, sheet) => {
      try {
        return n + count(sheet.cssRules);
      } catch {
        return n; // 교차 출처 시트는 cssRules 접근에서 던진다
      }
    }, 0);
  });
  expect(hits).toBe(0);
});
```

- [ ] **Step 3: 테스트가 물 수 있는지 증명한다 (봉인 전)**

아직 봉인이 없으므로 이 시점에는 숫자 유틸리티가 컴파일된다. 임시로 하나 심어 테스트가 실제로 깨지는지 본다.

`src/routes/index.tsx`의 `<footer>` className 맨 앞에 `mt-4 `를 임시로 붙인다:

```jsx
      <footer className="mt-4 flex h-[50px] w-full items-center justify-center">
```

Run: `pnpm build && pnpm test tailwind-setup`
Expected: **FAIL** — `hits`가 1 이상이다.

깨지지 않으면 테스트가 무력한 것이다. 멈추고 왜 그런지 확인하라 — 대개 `page.evaluate` 안의 순회가 `@layer` 중첩을 못 들어간 경우다.

방금 붙인 `mt-4 `를 **되돌린다.**

Run: `pnpm build && pnpm test tailwind-setup`
Expected: PASS (`hits`가 0)

- [ ] **Step 4: 봉인 블록을 넣는다**

`src/styles/tokens.theme.css`의 `@theme {` 바로 다음, `/* ── 폰트 ── */` 앞에 넣는다:

```css
/* ── 기본값 봉인 ────────────────────────────────────────────────────────
     Tailwind의 동적 간격 스케일과 기본 타입 스케일을 지운다. mt-4 · text-base
     같은 클래스가 **존재하지 않게** 되므로, 토큰을 안 쓰면 스타일이 아예 안 붙어
     화면에서 바로 드러난다. 규칙으로 지키는 대신 구조로 막는다.

     함께 죽는 것: p-0 · m-0 · my-0 · py-0 · pr-0 · left-0 · top-0 · right-0.
     전부 --spacing에 기대기 때문이다 → --spacing-none으로 받는다.
     숫자 치수(min-w-20)와 숫자 위치(top-3)도 죽는다.

     영향 없는 것(실측): 임의값 pl-[12px], 분수 top-1/2 · -translate-y-1/2,
     static w-full · h-px · z-50 · rounded-md · outline-2, 색 text-accent-solid
     (--color-*에서 온다), 굵기 font-bold (--font-weight-*는 별개 네임스페이스라
     --font-*: initial이 건드리지 않는다). */
--spacing: initial;
--text-*: initial;
--tracking-*: initial;
--font-*: initial;
```

- [ ] **Step 5: 봉인이 실제로 무는지 증명한다**

Step 3에서 심었던 것과 똑같이 `src/routes/index.tsx`의 `<footer>`에 `mt-4 `를 다시 임시로 붙인다.

Run: `pnpm build && pnpm test tailwind-setup`
Expected: **PASS** — `hits`는 여전히 0이다. 봉인 때문에 `mt-4`가 아예 컴파일되지 않아서다.

Run: `cat $(find .output -name '*.css') | grep -c 'mt-4'`
Expected: `0` — 클래스 자체가 없다. 이게 봉인의 증거이자, 동시에 이 테스트가 "새로 쓴 `mt-4`"는 못 잡는다는 증거다.

`mt-4 `를 **되돌린다.**

- [ ] **Step 6: 계약 테스트 전체가 통과하는지 확인한다**

Run: `pnpm build && pnpm test tailwind-setup`
Expected: PASS (이 파일의 네 테스트 전부)

- [ ] **Step 7: 봉인이 무엇도 깨지 않았는지 확인한다**

Run: `pnpm test`
Expected: **PASS 전부, 스크린샷 포함.** Task 6까지 호출부를 다 옮겼으므로 봉인은 렌더를 바꾸지 않아야 한다.

깨졌다면 그 자리가 아직 죽은 유틸리티를 쓰고 있다는 뜻이다. **기준선을 새로 뜨지 마라** — diff 이미지에서 무엇이 사라졌는지 찾아 해당 자리를 토큰이나 임의값으로 고친 뒤 다시 돌려라. 여기서 `--update-snapshots`를 치면 스타일이 빠진 상태를 정상으로 굳힌다.

- [ ] **Step 8: `CLAUDE.md`를 갱신한다**

「구조」의 `src/styles/` 트리에 한 줄 추가:

```
    ├── global.css         리셋 + Tailwind import + dark: variant 재정의
    ├── palette.theme.css  생성물. 팔레트 토큰(--color-{scale}-{role}), 직접 고치지 않는다
    └── tokens.theme.css   타이포·간격 토큰. 손으로 쓰는 파일 — 생성물이 아니다
```

「알아둘 것」 끝에 다음 세 항목을 추가한다:

```markdown
**타이포와 간격은 `src/styles/tokens.theme.css`의 토큰을 쓴다.** 타입은 프로필
하나가 크기·굵기·행간·자간을 다 싣는다 (`text-heading-xl` · `text-body-md` ·
`text-caption-sm` …). 간격은 이름 별칭만 쓴다 (`mt-lg` · `px-section` · `-ml-xl`).
**이 파일은 팔레트와 달리 생성물이 아니다 — 고쳐도 된다.** 다만 값은
design-system-starter 스키마 v1의 스케일 안에 있어야 한다. 새 프로필이 필요하면
스케일 밖 값을 쓰지 말고 스케일 안에서 골라라.

**`mt-4` 같은 숫자 유틸리티는 컴파일되지 않는다.** `tokens.theme.css`가
`--spacing: initial`(과 `--text-*` · `--tracking-*` · `--font-*`)로 Tailwind 기본
스케일을 봉인한다. `p-0` · `m-0` · `left-0` 계열도 같이 죽으므로 `p-none` ·
`left-none`을 쓴다. 숫자 치수(`min-w-40`)와 숫자 위치도 죽는다 — 치수는 리듬이
아니라 측정값이므로 `min-w-[160px]`처럼 임의값으로 쓴다.
`tests/tailwind-setup.spec.ts`가 컴파일된 CSS에 `var(--spacing)`이 0회인지
확인해 봉인을 지킨다. 다만 이 테스트는 **봉인이 풀린 것만** 잡는다 — 누가 새로
`mt-4`를 쓰면 클래스가 조용히 없을 뿐이고, 그건 스크린샷이 잡는다.

**토큰화하지 않는 자리가 넷 있다.** `TitleBar` 전체(`text-[11pt]` ·
`leading-[10px]` · `py-[5px]` · `gap-x-[7px]` · `pl-[12px]` …)는 macOS 크롬
인용이고, `ColorBar`의 스트립 내부 기하(`13×13` 마크 · `19×12` 패치 · `gap-[6px]`
· `text-[8px]`)는 인쇄 컨트롤 스트립 인용이다. `/about` h2 앞 `˙`의
`before:text-[56px]`·`before:leading-[28px]`는 장식 글리프의 광학 보정이고, h1의
`tracking-[6px]`는 이름 표기의 서명이다. 하드코딩 색을 뺀 것과 같은 논리다 —
인용과 보정은 시스템이 아니다. 시키지 않은 토큰화를 시작하지 마라.
```

「기술 부채」의 마지막 항목 뒤에 추가한다:

```markdown
- radius와 elevation은 아직 토큰이 아니다. `about.tsx`의 창 테두리·그림자와
  `rounded-md`·`rounded-full`이 하드코딩으로 남아 있다. starter가 두 카테고리의
  스키마를 이미 갖고 있으므로 타이포·간격과 같은 방식으로 닫을 수 있다.
```

- [ ] **Step 9: 전체 게이트**

Run: `pnpm build && pnpm test && pnpm type-check && pnpm lint && pnpm format:check`
Expected: PASS 전부

- [ ] **Step 10: 커밋**

```bash
git add src/styles/tokens.theme.css tests/tailwind-setup.spec.ts CLAUDE.md
git commit -m "feat(tokens): Tailwind 기본 스케일을 봉인한다"
```
