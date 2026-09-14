# Tailwind 전면 교체 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

- 작성일: 2026-09-15
- 근거 스펙: [2026-09-15 Tailwind 전면 교체 설계](../specs/2026-09-15-tailwind-migration-design.md) — **사용자 승인 완료. 설계 결정을 다시 열지 않는다.**
- 브랜치: `haneulcha/tailwind-migration`

**Goal:** `About.module.css`(344줄)와 `Home.module.css`(129줄)를 걷어내고 Tailwind v4 유틸리티로 옮기되, 렌더 결과를 바꾸지 않는다.

**Architecture:** preflight 없이 Tailwind를 깔아 리셋이 계속 `global.css`에서 나오게 한다. 색은 CSS 변수와 리터럴을 arbitrary value로 그대로 인용하므로 계산 결과가 안 바뀐다. 화면을 조각으로 나눠 한 조각씩 옮기고, 옮긴 만큼 `About.module.css`에서 지운다. 매 태스크 끝에 Playwright 기준선이 게이트 역할을 한다 — 픽셀이 움직이면 그 태스크의 포팅이 틀린 것이다.

**Tech Stack:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), Vite 8, TanStack Start, React 19.2.8, TypeScript 6.0.3, Playwright.

## Global Constraints

모든 태스크에 암묵적으로 적용된다.

- **색을 바꾸지 않는다.** 리터럴이든 변수든 계산 결과가 달라지는 변경 일체 금지. 팔레트(`#fa862e`)는 **이 계획에서 쓰지 않는다** — 스펙 ②의 일이다.
- **기준선 PNG를 재생성하지 않는다.** `--update-snapshots` 금지. 스크린샷이 실패하면 포팅을 고친다. (`playwright.config.ts`의 `maxDiffPixelRatio: 0.001` 안에서 통과하면 된다. 바이트 동일이 아니다.)
- 패키지 매니저는 **pnpm 전용**. 새 의존성은 기존 관례대로 **정확 버전 고정**으로 설치한다 (`pnpm add -D -E`).
- 커밋은 **Conventional Commits**, 제목은 기존 히스토리처럼 영어 소문자. commit-msg(commitlint)와 pre-commit(lint-staged) 훅이 돈다. **`--no-verify` 금지.**
- `@theme` 블록을 만들지 않는다. Tailwind 기본 브레이크포인트(`sm`/`md`/`lg`)로 치환하지 않는다 — 값이 달라진다. `max-[1024px]:` 같은 arbitrary variant를 쓴다.
- `resume.json`과 `.github/workflows/ci.yml`은 수정하지 않는다.
- **범위 밖** — 계획에 없으면 하지 마라: 다크 모드, OG 이미지, `sitemap.xml`, ESLint 10 승격, 컬러 바, 이력서 내용 추가, 접근성 개선, 애니메이션.

**매 태스크의 검증 게이트 (이하 "전체 게이트"):**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

`pnpm test`는 `pnpm build` 결과물을 서빙하므로 순서를 지켜야 한다. 다섯 개가 전부 통과해야 커밋한다.

**되돌리는 법:** 태스크마다 커밋이 닫힌다. 실패하면 `git reset --hard HEAD`(커밋 전) 또는 `git revert <커밋>`(커밋 후). 의존성을 바꾼 태스크를 되돌린 뒤에는 `pnpm install`로 `node_modules`를 락파일과 다시 맞춘다.

---

## 계획 중 발견한 설계 보강 두 건

스펙을 쓴 뒤 계획을 짜면서 드러난 것이다. **스펙의 결정을 뒤집지 않고 보강한다.**

### 보강 1 — `global.css`의 리셋을 `@layer base`로 감싼다 (Task 1)

CSS 캐스케이드에서 **비레이어(unlayered) 일반 선언은 레이어 선언을 특정도와 무관하게 이긴다.** 지금 `global.css`의 리셋은 전부 비레이어다. Tailwind 유틸리티는 `layer(utilities)`에 들어간다. 따라서:

```css
button {
  all: unset;
} /* 비레이어 — 이긴다 */
.rounded-full {
  border-radius: 9999px;
} /* utilities 레이어 — 진다 */
```

신호등 버튼을 유틸리티로 옮기는 순간(Task 3) `all: unset`이 그걸 전부 지운다. 리셋을 `@layer base`로 옮기면 `theme → base → components → utilities` 순서가 되어 유틸리티가 이긴다.

같은 이유로 `.aboutPage *::selection`도 `selection:` 유틸리티를 이긴다. **선택 하이라이트는 스크린샷에 안 잡히므로 이건 조용히 회귀한다** — 레이어로 옮겨야 막힌다.

`:root`의 CSS 변수 6개는 비레이어로 남긴다. 경쟁하는 선언이 없어 레이어가 무의미하고, 변수는 `@layer` 밖에 두는 편이 읽기 쉽다.

### 보강 2 — 죽은 CSS 목록 (지우기만 하면 되는 것)

JSX가 참조하지 않는다. 옮길 필요 없이 사라진다. 각 태스크에서 해당 규칙을 만나면 **포팅하지 말고 삭제한다.**

| 파일               | 죽은 클래스                                                              | 비고                         |
| ------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| `Home.module.css`  | `.description` `.code` `.grid` `.card` `.logo` + `.grid`용 `@media`      | Next.js 스타터 잔재          |
| `About.module.css` | `.buttons` `.closebutton` `.minimizebutton` `.zoombutton`                | 신호등 ×/−/+ 글리프가 미배선 |
| `About.module.css` | `.buttons:hover a`, `.close:hover .closebutton` 등 hover 글리프 규칙 3종 | 위 클래스에 딸린 것          |

**`.infoTable caption`은 죽지 않았다.** `<caption>`에 클래스가 없어 죽어 보이지만, `.infoTable`이 붙은 `<table>`의 자손을 자손 선택자로 잡고 있다. 지우면 "개인 정보와 관련 링크"가 화면에 나타난다. Task 5에서 `<caption>`에 유틸리티를 직접 붙여 옮긴다.

---

## 파일 구조

**생성**

| 파일                                      | 책임                                                  |
| ----------------------------------------- | ----------------------------------------------------- |
| `src/components/about/classes.ts`         | 두 번 이상 쓰이는 유틸리티 문자열 상수 (Task 5)       |
| `src/components/about/TitleBar.tsx`       | macOS 타이틀바 + 신호등 3개 + 닫기/토글 핸들러        |
| `src/components/about/ExperienceItem.tsx` | 회사 1건 — 제목, 정보 표, `section[]` 반복            |
| `src/components/about/JobSection.tsx`     | `section[]` 한 건 — 헤더, 기술 스택, `<details>` 목록 |
| `src/components/about/PortfolioItem.tsx`  | 개인 프로젝트 1건                                     |
| `src/components/about/LanguageList.tsx`   | 언어 섹션                                             |
| `tests/tailwind-setup.spec.ts`            | Tailwind 배선이 실제로 먹는지 검사 (Task 1)           |

**수정**: `package.json`, `vite.config.ts`, `src/styles/global.css`, `src/routes/index.tsx`, `src/routes/about.tsx`, `CLAUDE.md`

**삭제**: `src/styles/Home.module.css`(Task 2), `src/styles/About.module.css`(Task 7)

`InfoTable`을 컴포넌트로 만들지 **않는다.** 표가 두 군데 쓰이지만 내용 모양이 다르다(연락처 표는 `infoLink` 반복, 회사 표는 고정 3행). 공통은 스타일뿐이므로 `classes.ts`의 문자열 상수로 공유한다. 맞지 않는 추상을 발명하지 않는다.

---

## Task 1: Tailwind 설치와 배선 증명

`global.css`가 `__root.tsx`에서 `?url`로 로드된다(`import globalCss from '@/styles/global.css?url'`). Tailwind 플러그인이 그 경로를 처리하는지 **추측하지 말고 증명한다.** 여기서 안 되면 나머지 7개 태스크가 전부 무의미하다.

**Files:**

- Modify: `package.json`, `vite.config.ts`, `src/styles/global.css`, `src/routes/index.tsx`
- Test: `tests/tailwind-setup.spec.ts` (생성)

**Interfaces:**

- Produces: `@layer theme, base, components, utilities` 순서가 선다. 이후 모든 태스크가 유틸리티로 리셋을 이길 수 있다는 전제를 여기서 만든다.

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add -D -E tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Vite 플러그인 등록**

`vite.config.ts`에서 import를 추가하고 `plugins` 배열에 넣는다. **`tanstackStart()`보다 뒤, `viteReact()`보다 앞**에 둔다.

```ts
import tailwindcss from '@tailwindcss/vite';
```

```ts
plugins: [
  tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
  nitro(),
  tailwindcss(),
  viteReact(),
],
```

- [ ] **Step 3: `global.css`를 다시 쓴다**

맨 위에 레이어 선언과 Tailwind import를 넣고, **기존 리셋을 `@layer base`로 감싼다.** `:root`와 `@import url(...)` 폰트는 레이어 밖에 남는다. 규칙의 내용은 한 글자도 바꾸지 않는다 — 감싸기만 한다.

```css
@layer theme, base, components, utilities;

@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);

/* preflight를 일부러 뺐다. global.css가 이미 리셋을 갖고 있어 겹치면
   기존 렌더가 흔들린다. 리셋을 @layer base에 넣는 것도 같은 이유다 —
   비레이어 선언은 레이어 선언을 특정도와 무관하게 이기므로, 리셋이
   비레이어면 button { all: unset }이 모든 유틸리티를 지워 버린다. */

:root {
  --color: #24292f;
  --bg: #fbfcff;
  --point-color: #0550ae;
  --point-color-hover: #1678ef;
  --point-color-selection: #3067ab;
  --border-color: #e6e8e6;
}

@layer base {
  html,
  body {
    padding: 0;
    margin: 0;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      Segoe UI,
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      Fira Sans,
      Droid Sans,
      Helvetica Neue,
      sans-serif;
    background-color: rgba(170, 183, 191, 0.2);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p {
    margin: 0;
    padding: 0;
  }

  button {
    all: unset;
    line-height: 1;
    cursor: pointer;
  }

  a {
    text-decoration: none;
    cursor: pointer;
  }

  .aboutPage *::selection {
    background: var(--point-color-selection);
    color: var(--bg);
  }
}
```

- [ ] **Step 4: 스모크 클래스를 붙인다**

`src/routes/index.tsx`의 `<main>`에 커스텀 속성만 설정하는 유틸리티를 더한다. 아무것도 칠하지 않으므로 화면이 안 바뀌고, **JSX 소스에서 클래스를 찾아 컴파일해 `?url` 스타일시트로 배달했다**는 것을 증명한다.

```tsx
<main className={`${styles.main} [--tw-smoke:ok]`}>
```

- [ ] **Step 5: 배선 테스트를 쓴다**

`tests/tailwind-setup.spec.ts` 생성:

```ts
import { expect, test } from '@playwright/test';

// global.css는 __root.tsx에서 `?url`로 로드된다. Tailwind 플러그인이 그
// 경로를 처리하지 못하면 유틸리티가 한 줄도 생성되지 않는다 — 그 경우
// 이 테스트만 실패하고 스크린샷은 멀쩡히 통과해 문제를 놓치게 된다.
test('tailwind utilities reach the page through the ?url stylesheet', async ({
  page,
}) => {
  await page.goto('/');
  const value = await page
    .locator('main')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--tw-smoke'));
  expect(value.trim()).toBe('ok');
});

// 리셋이 @layer base 안에 있는지 스타일시트에서 직접 확인한다. 비레이어로
// 남으면 button { all: unset }이 모든 유틸리티를 이겨 Task 3(신호등)이 죽고,
// .aboutPage *::selection이 selection: 유틸리티를 이겨 선택 하이라이트가
// 조용히 바뀐다 — 후자는 스크린샷에 안 잡히므로 여기서 잡아야 한다.
//
// 클래스를 심어 간접 확인하지 않는 이유: 소스에 없는 클래스는 Tailwind가
// 생성하지 않아 렌더에 쓰이지 않는 프로브 상수를 코드에 남겨야 한다.
test('the global reset lives inside @layer base', async ({ page }) => {
  await page.goto('/');
  const found = await page.evaluate(() => {
    const walk = (rules: CSSRuleList, insideBase: boolean): boolean => {
      for (const rule of Array.from(rules)) {
        const isBaseLayer =
          rule instanceof CSSLayerBlockRule && rule.name === 'base';
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested && walk(nested, insideBase || isBaseLayer)) return true;
        if (
          insideBase &&
          rule instanceof CSSStyleRule &&
          rule.selectorText === 'button' &&
          rule.style.getPropertyValue('cursor') === 'pointer'
        ) {
          return true;
        }
      }
      return false;
    };
    return Array.from(document.styleSheets).some((sheet) => {
      try {
        return walk(sheet.cssRules, false);
      } catch {
        return false; // 교차 출처 시트는 cssRules 접근에서 던진다
      }
    });
  });
  expect(found).toBe(true);
});
```

> `CSSLayerBlockRule`은 Playwright가 쓰는 chromium에 있다. `pnpm type-check`가 이 타입을 모른다고 하면 `tsconfig.json`의 `lib`에 `DOM`이 있는지 확인하고, 그래도 없으면 `rule.constructor.name === 'CSSLayerBlockRule'`로 바꾼다.

- [ ] **Step 6: 전체 게이트**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

기대: 5개 전부 통과. 특히 `landing.png`·`about.png`가 **변화 없이** 통과해야 한다. 스모크 클래스는 커스텀 속성만 설정하므로 픽셀이 움직일 이유가 없다.

**실패하면:** `--tw-smoke` 테스트가 실패하면 `?url` 경로가 문제다. `__root.tsx`에서 `?url` 대신 `import '@/styles/global.css'`로 바꾸고 `links`의 스타일시트 항목을 빼서 다시 시도한다. 그래도 안 되면 **여기서 멈추고 보고한다** — 설계 전제가 틀린 것이라 계획을 다시 짜야 한다.

- [ ] **Step 7: 커밋**

```bash
git add package.json pnpm-lock.yaml vite.config.ts src/styles/global.css src/routes/index.tsx tests/tailwind-setup.spec.ts
git commit -m "build: add tailwind v4 without preflight"
```

---

## Task 2: 랜딩 이식

가장 작은 표면(살아있는 클래스 7개)으로 시작한다. 여기서 방법이 통하면 나머지는 규모만 다르다.

**Files:**

- Modify: `src/routes/index.tsx`
- Delete: `src/styles/Home.module.css`

**Interfaces:**

- Consumes: Task 1의 `@layer base` 순서.
- Produces: 없음. 랜딩은 독립적이다.

- [ ] **Step 1: `index.tsx`를 다시 쓴다**

`styles` import와 Task 1의 스모크 클래스를 지우고 유틸리티로 바꾼다. 죽은 클래스 다섯 개는 따라오지 않는다.

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="flex h-screen min-h-screen flex-col items-center justify-center px-2">
      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <h1 className="m-0 flex gap-x-4 text-center text-[6rem] leading-[1.15] font-bold">
          <Link to="/about" className="text-[#ad1d1d]">
            ㅊ
          </Link>
          <a
            href="https://kicksky.tistory.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#261201]"
          >
            ㅎ
          </a>
          <div className="text-[#736356]">ㄴ</div>
        </h1>
      </main>

      <footer className="flex h-[50px] w-full items-center justify-center">
        <div className="text-[0.8rem] text-[#bfb1a8]">
          &copy; {new Date().getFullYear()} Haneul Cha
        </div>
      </footer>
    </div>
  );
}
```

> **색 대응에 주의.** 원본은 `typo1`=`#ad1d1d`(ㅊ), `typo3`=`#261201`(ㅎ), `typo2`=`#736356`(ㄴ) 순서로 붙어 있다. 클래스 이름 순서와 글자 순서가 다르므로 위 코드의 대응을 그대로 따른다. 헷갈리면 스크린샷이 잡는다.

- [ ] **Step 2: `Home.module.css` 삭제**

```bash
git rm src/styles/Home.module.css
```

- [ ] **Step 3: 스모크 테스트를 먼저 갱신한다**

Step 1에서 `[--tw-smoke:ok]`를 지웠으므로 그 테스트는 이제 실패한다. **게이트를 돌리기 전에** 고친다 — 일부러 빨간 게이트를 만들고 지나가면 다음에 진짜 실패가 났을 때 눈이 무뎌진다.

`--tw-smoke` 테스트는 역할을 다했다(Task 1에서 배선을 증명했고, 이제 랜딩 전체가 유틸리티로 그려진다). 랜딩이 유틸리티로 칠해지는지 보는 테스트로 바꾼다.

```ts
test('tailwind utilities reach the page through the ?url stylesheet', async ({
  page,
}) => {
  await page.goto('/');
  // 랜딩의 'ㅊ'은 이제 text-[#ad1d1d] 유틸리티로만 칠해진다.
  // 유틸리티가 안 오면 상속색이 나오므로 이 단언이 깨진다.
  const color = await page
    .locator('h1 a')
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(173, 29, 29)');
});
```

- [ ] **Step 4: 전체 게이트**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

기대: 5개 전부 통과. `landing.png` 무변화.

- [ ] **Step 5: 커밋**

```bash
git add src/routes/index.tsx tests/tailwind-setup.spec.ts
git commit -m "refactor: port the landing to tailwind utilities"
```

---

## Task 3: TitleBar 분리와 이식

신호등 버튼이 `button { all: unset }`과 부딪히는 자리다. Task 1의 레이어 보강이 실제로 먹는지 여기서 확인된다.

**Files:**

- Create: `src/components/about/TitleBar.tsx`
- Modify: `src/routes/about.tsx`, `src/styles/About.module.css`

**Interfaces:**

- Consumes: 없음.
- Produces: `export function TitleBar(props: { onClose: () => void; onToggleAll: () => void }): JSX.Element`

- [ ] **Step 1: `TitleBar.tsx`를 만든다**

```tsx
interface TitleBarProps {
  /** 닫기(빨강) 버튼 — 랜딩으로 내비게이트한다. */
  onClose: () => void;
  /** 최소화(노랑) 버튼 — 모든 <details>를 한꺼번에 여닫는다. */
  onToggleAll: () => void;
}

// 신호등은 macOS UI를 그대로 인용한 것이라 색이 하드코딩돼 있다.
// 팔레트 토큰화 대상이 아니다 (CLAUDE.md 참조).
const light = 'w-[10px] leading-[10px] rounded-full';
const glyph = 'inline-block align-top min-w-2 text-[10px] leading-[14px]';

export function TitleBar({ onClose, onToggleAll }: TitleBarProps) {
  return (
    <div className="relative cursor-default rounded-t-md border-t border-b border-t-[#f3f1f3] border-b-[#b1aeb1] bg-linear-to-r from-[#ebebeb] to-[#d5d5d5] py-[5px] text-center text-[11pt] text-[#4d494d] select-none">
      <nav className="absolute top-1/2 flex -translate-y-1/2 gap-x-[7px] pl-3">
        <button
          className={`${light} border border-[#e14640] bg-[#ff6057] hover:border-[#b03537] hover:bg-[#c14645]`}
          onClick={onClose}
        >
          <strong className={glyph}></strong>
        </button>

        <button
          className={`${light} border border-[#dfa123] bg-[#ffbd2e] hover:border-[#af7c33] hover:bg-[#c08e38]`}
          onClick={onToggleAll}
        >
          <strong className={glyph}></strong>
        </button>

        <button
          className={`${light} border border-[#1dad2b] bg-[#27c93f] hover:border-[#128435] hover:bg-[#029740]`}
        >
          <strong className={glyph}></strong>
        </button>
      </nav>
      이력서
    </div>
  );
}
```

> `.close:hover .closebutton { color: #4e0002 }` 같은 글리프 hover 규칙과 `.closebutton`/`.minimizebutton`/`.zoombutton`/`.buttons`는 **죽은 코드다** — `<strong>`이 비어 있고 그 클래스가 JSX에 없다. 옮기지 않는다.

- [ ] **Step 2: `about.tsx`에서 TitleBar를 쓴다**

`<div className={styles.titlebar}>...</div>` 전체를 교체한다.

```tsx
import { TitleBar } from '@/components/about/TitleBar';
```

```tsx
<TitleBar
  onClose={() => navigate({ to: '/', viewTransition: true })}
  onToggleAll={closeToggleHandler}
/>
```

`closeToggleHandler`는 `about.tsx`에 그대로 남는다 — `document.querySelectorAll('details')`로 DOM을 직접 만지는 방식을 바꾸지 않는다. 상태를 끌어올리면 테스트가 보는 동작이 바뀐다.

- [ ] **Step 3: `About.module.css`에서 옮긴 규칙을 지운다**

삭제 대상: `.titlebar`, `.buttonWrapper`, `.buttonWrapper button`, `.inlineContent`, `.buttons:hover a`, `.close`, `.close:hover`, `.close:hover .closebutton`, `.closebutton`, `.minimize`, `.minimize:hover`, `.minimize:hover .minimizebutton`, `.minimizebutton`, `.zoom`, `.zoom:hover`, `.zoom:hover .zoombutton`, `.zoombutton`.

- [ ] **Step 4: 남은 참조가 없는지 확인**

```bash
grep -nE 'styles\.(titlebar|buttonWrapper|inlineContent|close|minimize|zoom)' src/routes/about.tsx
```

기대: 출력 없음. **CSS Modules는 없는 클래스를 참조해도 에러가 아니라 `undefined`를 준다** — 조용히 스타일이 빠지므로 반드시 확인한다.

- [ ] **Step 5: 전체 게이트**

기대: 5개 전부 통과. 특히 `about.png` 무변화와 상호작용 테스트 두 개(`minimize button toggles every details element`, `close button navigates back to landing`)가 통과해야 한다. 후자는 `page.locator('nav button')`으로 찾으므로 `<nav>`와 `<button>` 구조를 유지한 것이 전제다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/about/TitleBar.tsx src/routes/about.tsx src/styles/About.module.css
git commit -m "refactor: extract the about titlebar and port it to tailwind"
```

---

## Task 4: 페이지 셸과 타이포 이식

`.main`, `.contentWrapper`, `.content`와 그 안의 제목·본문 규칙이다. `h2::before`의 점이 여기 있다.

**Files:**

- Modify: `src/routes/about.tsx`, `src/styles/About.module.css`

**Interfaces:**

- Consumes: Task 3의 `TitleBar`.
- Produces: `<article>`에 붙는 셸 클래스. 이후 태스크의 자식들이 이 안에서 렌더된다.

- [ ] **Step 1: 셸 세 겹을 유틸리티로 바꾼다**

```tsx
<main className="aboutPage overflow-auto text-[color:var(--color)]">
  <div
    className="mx-auto my-[6vh] max-w-[1024px] rounded-md border border-[#acacac] bg-[var(--bg)] font-[HelveticaNeue,'Helvetica_Neue','Lucida_Grande',Arial,sans-serif] shadow-[0px_0px_20px_#acacac] max-[1024px]:mx-auto max-[1024px]:my-0"
    style={{ viewTransitionName: 'window-about' }}
  >
    <TitleBar … />
    <article className="px-36 pt-24 pb-32 font-['Noto_Sans_KR',sans-serif] text-[16px] leading-[1.5] font-normal max-[1024px]:px-[10vw] max-[1024px]:pt-[9vw] max-[1024px]:pb-[10vw]">
```

> `aboutPage`는 CSS Modules 클래스가 아니라 **전역 클래스**다. `global.css`의 `.aboutPage *::selection`이 여기 걸려 있으므로 지우면 선택 하이라이트 색이 조용히 사라진다. 그대로 둔다.
>
> arbitrary value 안의 **공백은 언더스코어(`_`)로** 쓴다 (`shadow-[0px_0px_20px_#acacac]`). Tailwind v4 문법이다.

- [ ] **Step 2: 제목과 본문에 클래스를 붙인다**

```tsx
<p className="float-right m-0 text-[12px]">최종 수정: {content.lastUpdatedAt}</p>
<h1 className="mb-8 text-[42px] font-bold tracking-[6px]">{content.title}</h1>
```

`h2`는 소제목 점(`::before`)을 달고 있다. 두 군데(`소개`/`경력` 위쪽, `개인 프로젝트`) 전부 같은 문자열을 쓴다.

```tsx
const h2 =
  'relative mt-10 mb-4 -ml-[1.8rem] text-[30px] ' +
  "before:absolute before:content-['˙'] before:text-[56px] " +
  'before:leading-[28px] before:text-[color:var(--point-color)]';
```

> 원본은 `.content h2::before`가 `position` 없이 인라인으로 흐른다. 위 코드는 `before:absolute`를 쓰므로 **점의 위치가 달라질 수 있다.** 스크린샷이 어긋나면 `before:absolute`를 빼고 인라인 흐름 그대로(`before:inline-block` 없이) 맞춰라. 원본 규칙은 `content` / `font-size` / `line-height` / `color` 네 개뿐이다.

`<h3>`는 `.content h3 { margin-top: .5rem; font-size: 24px }` → `className="mt-2 text-[24px]"`.

`소개` 아래 `<p>`는 `.content p`(`my-[0.4rem] leading-[1.6]`)와 `.main p::selection`을 함께 받는다:

```tsx
<p className="my-[0.4rem] leading-[1.6] selection:bg-[var(--point-color)] selection:text-[var(--bg)]">
  {content.introduction}
</p>
```

> `selection:` 유틸리티는 Task 1에서 리셋을 `@layer base`로 옮겼기 때문에 `.aboutPage *::selection`을 이긴다. **선택 하이라이트는 스크린샷에 안 잡히므로**, 브라우저에서 직접 드래그해 색이 `#0550ae`인지 눈으로 확인한다.

- [ ] **Step 3: `About.module.css`에서 옮긴 규칙을 지운다**

삭제 대상: `.main`, `.main p::selection`, `.main p::-moz-selection`, `.contentWrapper`와 그 `@media (max-width: 1024px)`, `.content`와 그 `@media`, `.content h1`, `.content h2`, `.content h2::before`, `.content h3`, `.content p`, `.content p.lastUpdatedAt`.

`.main a` / `.main a:hover`는 **남긴다** — Task 6에서 `.resumeHtml a`로 옮긴다.

- [ ] **Step 4: 전체 게이트 + 육안 확인**

전체 게이트를 돌린 뒤 `pnpm dev`로 띄워 `/about`에서 문단을 드래그해 선택 색이 `#0550ea`가 아니라 **`#0550ae`**인지 본다.

- [ ] **Step 5: 커밋**

```bash
git add src/routes/about.tsx src/styles/About.module.css
git commit -m "refactor: port the about page shell and typography to tailwind"
```

---

## Task 5: 표 두 개 이식

**Files:**

- Modify: `src/routes/about.tsx`, `src/styles/About.module.css`

**Interfaces:**

- Produces: `src/components/about/classes.ts` — `infoTable`, `infoTableRow`, `infoTableTh`, `infoTableTd`, `sectionWrap`, `sectionH4`, `sectionH4Span`, `bodyP` (전부 `string` 상수). Task 6·7이 쓴다.

- [ ] **Step 1: `classes.ts`를 만든다**

`About.module.css`에서 **두 번 이상 쓰이는** 규칙만 상수로 뽑는다. 한 번만 쓰이는 것은 해당 컴포넌트의 `className`에 직접 적는다 — 여기로 모으면 스타일이 쓰이는 자리에서 멀어지기만 한다. 값이 틀리면 스크린샷이 잡는다.

```ts
/** .infoTable */
export const infoTable =
  'mt-5 min-w-40 border-collapse text-[14px] max-[320px]:block';

/** .infoTable tr */
export const infoTableRow =
  'border-t border-b border-[var(--border-color)] max-[320px]:block';

/** .infoTable tr th[scope='row'] */
export const infoTableTh =
  'min-w-31 pl-2 text-left leading-10 font-bold ' +
  'max-[375px]:min-w-16 max-[320px]:block max-[320px]:leading-[2.3]';

/** .infoTable tr td */
export const infoTableTd =
  'pr-6 max-[320px]:block max-[320px]:py-0 max-[320px]:pr-0 max-[320px]:pl-2 max-[320px]:leading-[2.3]';

/** .experienceSection */
export const sectionWrap = 'mt-4';

/** .experienceSection h4 */
export const sectionH4 = 'my-7 mb-4 text-[20px]';

/** .experienceSection h4 span */
export const sectionH4Span = 'ml-1 text-[16px]';

/** .experienceSection > p */
export const bodyP = 'my-[0.4rem] text-[16px] leading-[1.6]';
```

> **단위 환산.** `min-width: 7.75rem` = 124px = `min-w-31`. `4rem` = `min-w-16`. `10rem` = `min-w-40`. `line-height: 2.5` = `leading-10`(2.5rem). `margin-top: 1.25rem` = `mt-5`. `padding-left: 0.5rem` = `pl-2`. `padding-right: 1.5rem` = `pr-6`. **확신이 안 서면 arbitrary value(`min-w-[7.75rem]`)를 써라 — 정확성이 관용구보다 우선이다.**
>
> `sectionWrap`·`sectionH4`·`sectionH4Span`·`bodyP`는 Task 6·7이 처음 쓴다. 이 태스크에서는 표 상수 네 개만 소비된다.

- [ ] **Step 2: 연락처 표**

```tsx
import * as c from '@/components/about/classes';
```

```tsx
<table className={c.infoTable}>
  <caption className="invisible pointer-events-none absolute -z-10">
    개인 정보와 관련 링크
  </caption>
  <tbody>
    {content.infoLink.map((item, idx) => (
      <tr className={c.infoTableRow} key={item.id + idx}>
        <th className={c.infoTableTh} scope="row">
          {item.id}
        </th>
        <td className={c.infoTableTd}>
          <a
            className="text-[color:var(--point-color)] hover:text-[color:var(--point-color-hover)]"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.desc}
          </a>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

> `.infoTable caption`은 **살아있는 규칙이다.** `visibility: hidden; position: absolute; pointer-events: none; z-index: -1`을 `<caption>`에 직접 붙여야 한다. 빠뜨리면 "개인 정보와 관련 링크"가 화면에 나타나 스크린샷이 깨진다.

- [ ] **Step 3: 회사 정보 표**

`경력` 아래 `<table className={styles.infoTable}>`도 같은 상수를 쓴다. 행이 세 개 고정이므로 반복 없이 각 `<tr>`/`<th>`/`<td>`에 붙인다. `<th scope="row"><strong>기술</strong></th>`의 `<strong>`은 그대로 둔다.

- [ ] **Step 4: `About.module.css`에서 지운다**

삭제 대상: `.infoTable`, `.infoTable caption`, `.infoTable tr`, `.infoTable tr th[scope='row']`, `.infoTable tr td`, `@media (max-width: 375px)` 블록, `@media (max-width: 320px)` 블록.

- [ ] **Step 5: 전체 게이트 + 좁은 화면 확인**

스크린샷은 데스크톱 폭이라 320px·375px 규칙을 **검사하지 않는다.** `pnpm dev`로 띄워 브라우저를 320px까지 줄여 표가 세로로 무너지는지 직접 본다.

- [ ] **Step 6: 커밋**

```bash
git add src/components/about/classes.ts src/routes/about.tsx src/styles/About.module.css
git commit -m "refactor: port the about page tables to tailwind"
```

---

## Task 6: 경력 섹션 분리와 이식

가장 큰 덩어리다. `nth-of-type` 제거, 문자열 리스트 마커, `dangerouslySetInnerHTML` 예외가 전부 여기 있다.

**Files:**

- Create: `src/components/about/ExperienceItem.tsx`, `src/components/about/JobSection.tsx`
- Modify: `src/routes/about.tsx`, `src/styles/About.module.css`, `src/styles/global.css`, `src/contents/types.ts`

**Interfaces:**

- Consumes: Task 5의 `sectionWrap`, `sectionH4`, `sectionH4Span`, `bodyP`, `infoTable*`.
- Produces (`types.ts`): `Experience`, `ExperienceSection`, `Portfolio`, `Language` — `Resume`에서 파생. Task 7도 쓴다.
- Produces: `export function ExperienceItem(props: { item: Experience }): JSX.Element`, `export function JobSection(props: { item: ExperienceSection }): JSX.Element`.

- [ ] **Step 1: `types.ts`에 파생 별칭을 더한다**

> **`@/contents/types`는 `Resume` 하나만 export한다.** `Experience`·`Portfolio` 같은 이름은 **없고**, 전부 `Resume` 안에 인라인으로 중첩돼 있다. 컴포넌트 props에 쓰려면 이름이 필요하다. 인덱스 접근으로 파생하므로 타입을 **발명**하는 것이 아니라 이미 있는 구조에 이름을 붙이는 것이고, `Resume`이 정본으로 남는다.

`Resume` 정의는 **한 글자도 건드리지 않는다.** 파일 맨 아래에 네 줄만 덧붙인다.

```ts
// Resume 안에 인라인으로 중첩된 항목 타입들에 이름을 붙인다. 컴포넌트가
// props 타입으로 쓴다. 인덱스 접근으로 파생하므로 resume.json의 모양이
// 바뀌면 여기도 자동으로 따라온다.
export type Experience = Resume['experience'][number];
export type ExperienceSection = Experience['section'][number];
export type Portfolio = Resume['portfolio'][number];
export type Language = Resume['language'][number];
```

- [ ] **Step 2: `global.css`에 `.resumeHtml` 규칙을 추가한다**

`@layer base` **안**에 넣는다. 유틸리티가 필요하면 이길 수 있어야 한다.

```css
/* resume.json의 HTML 문자열 안에 있는 <a>. dangerouslySetInnerHTML이 만든
   노드라 JSX에서 className을 못 붙인다 — Tailwind로 옮길 수 없는 유일한
   규칙이다. 이력서 링크를 JSON에 두는 편의를 지키기로 한 결정의 대가다. */
.resumeHtml a {
  color: var(--point-color);
}
.resumeHtml a:hover {
  color: var(--point-color-hover);
}
```

- [ ] **Step 3: `JobSection.tsx`를 만든다**

```tsx
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
        <span className="font-bold after:mx-[0.7rem] after:align-top after:text-[14px] after:content-['|']">
          기술 스택
        </span>
        {item.tech.map(
          (tech, idx) => `${tech}${idx === item.tech.length - 1 ? '' : ', '}`,
        )}
      </p>

      <ul aria-label="상세 업무" className="my-4 list-none pl-[0.85rem]">
        {item.jobs.map((job, idx) => (
          <li key={idx}>
            <details className="overflow-visible" open>
              <summary className="my-[0.35rem] cursor-pointer text-[18px] leading-[1.65] font-medium text-[color:var(--point-color)] hover:text-[color:var(--point-color-hover)]">
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
```

> **`list-['•']`가 통하는지 확인하라.** `list-style-type: '•'`는 따옴표가 값의 일부다. `list-['•']`가 안 나오면 `[list-style-type:'•']`를 시도하고, 그것도 안 되면 **무리하지 말고** `global.css`의 `@layer base`에 규칙 한 줄로 남긴 뒤 스펙의 "예외" 목록에 추가로 기록한다. 셋 다 스크린샷이 판정한다 — 마커가 안 나오면 픽셀이 움직인다.
>
> `<details className="overflow-visible">`의 `open` 속성과 `<span>` 구조를 유지해야 상호작용 테스트가 통과한다.

- [ ] **Step 4: `ExperienceItem.tsx`를 만든다**

```tsx
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
```

> Task 5에서 회사 정보 표를 `about.tsx` 안에 이미 옮겼다면, 여기로 **이동**하는 것이지 새로 만드는 것이 아니다. `about.tsx` 쪽의 중복을 반드시 지워라.

- [ ] **Step 5: `about.tsx`에서 갈아끼운다**

`content.experience.map(...)` 블록 전체를 교체한다.

```tsx
{
  content.experience.map((item, idx) => (
    <ExperienceItem item={item} key={item.company + idx} />
  ));
}
```

- [ ] **Step 6: `About.module.css`에서 지운다**

삭제 대상: `.experienceSection` 및 그 하위 규칙 전부 (`> p`, `> p:nth-of-type(2) > span`과 `::after`, `> ul`, `h4`, `h4 div`, `h4 span`, `details`, `details summary`, `details summary span`, `details ul`, `details li`, `details li div`), 그리고 `.main a`, `.main a:hover`.

- [ ] **Step 7: 전체 게이트**

기대: 5개 전부 통과. 상호작용 테스트(`<details>` 전체 토글)가 특히 중요하다 — `JobSection` 분리가 `document.querySelectorAll('details')`가 보는 DOM을 바꾸지 않았는지 검사한다.

- [ ] **Step 8: 커밋**

```bash
git add src/components/about/ExperienceItem.tsx src/components/about/JobSection.tsx src/routes/about.tsx src/styles/About.module.css src/styles/global.css src/contents/types.ts
git commit -m "refactor: extract the experience section and port it to tailwind"
```

---

## Task 7: 포트폴리오·언어 이식과 모듈 파일 제거

**Files:**

- Create: `src/components/about/PortfolioItem.tsx`, `src/components/about/LanguageList.tsx`
- Modify: `src/routes/about.tsx`
- Delete: `src/styles/About.module.css`

**Interfaces:**

- Consumes: Task 5의 `sectionWrap`, `sectionH4`, `sectionH4Span`, `bodyP`; Task 6의 `Portfolio`·`Language` 타입.
- Produces: `export function PortfolioItem(props: { item: Portfolio }): JSX.Element`, `export function LanguageList(props: { items: Language[] }): JSX.Element`

- [ ] **Step 1: `PortfolioItem.tsx`**

```tsx
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
```

- [ ] **Step 2: `LanguageList.tsx`**

```tsx
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
```

- [ ] **Step 3: `about.tsx`에서 갈아끼운다**

`content.portfolio.map(...)`과 `<section className={styles.language}>` 블록을 교체하고, **`styles` import를 지운다.**

```tsx
{content.portfolio.map((item, idx) => (
  <PortfolioItem item={item} key={item.title + idx} />
))}

<h2 className={h2}>언어</h2>
<LanguageList items={content.language} />
```

- [ ] **Step 4: `About.module.css` 삭제**

```bash
git rm src/styles/About.module.css
```

- [ ] **Step 5: 남은 참조가 없는지 확인**

```bash
grep -rn "module.css" src/ || echo "clean"
```

기대: `clean`.

- [ ] **Step 6: 전체 게이트**

기대: 5개 전부 통과. 이 시점에 CSS Modules가 저장소에서 사라진다.

- [ ] **Step 7: 커밋**

```bash
git add -A src/components/about src/routes/about.tsx src/styles
git commit -m "refactor: finish the tailwind port and drop css modules"
```

---

## Task 8: CLAUDE.md 갱신

이 작업으로 사실이 아니게 된 문단들을 고친다. 문서가 틀리면 다음 사람이 틀린 전제로 일한다.

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: 구조 트리에서 `*.module.css`를 뺀다**

`src/styles/`가 `global.css` 하나만 갖도록 고치고, `src/components/about/`를 트리에 추가한다.

- [ ] **Step 2: 닫기 버튼 문단을 다시 쓴다**

현재 문장("`About.module.css`가 `.buttonWrapper button`으로 엘리먼트 선택자를 쓰기 때문에")은 근거가 사라졌다. **제약 자체는 남지만 근거가 CSS에서 테스트로 옮겨갔다**는 사실을 쓴다.

```markdown
**`TitleBar`의 닫기 버튼은 `<button>`이어야 한다.** `tests/pages.spec.ts`가
`page.locator('nav button')`으로 신호등을 찾기 때문에 `<Link>`(=`<a>`)로 바꾸면
상호작용 테스트 두 개가 깨진다. 그래서 라우팅에 `<Link>`가 아니라
`useNavigate()`를 쓴다. (Tailwind 이전 전에는 이유가 달랐다 —
`.buttonWrapper button` 엘리먼트 선택자였다.)
```

- [ ] **Step 3: `aboutPage` 문단을 고친다**

`styles.main`이 사라졌으므로 표현을 바꾼다. 클래스 자체와 `.aboutPage *::selection`은 남는다는 사실은 유지한다.

- [ ] **Step 4: 새 문단 두 개를 추가한다**

```markdown
**`global.css`의 리셋은 `@layer base` 안에 있다. 밖으로 꺼내지 마라.** CSS
캐스케이드에서 비레이어 선언은 레이어 선언을 특정도와 무관하게 이긴다. 리셋이
비레이어로 돌아가면 `button { all: unset }`이 모든 Tailwind 유틸리티를 이겨
신호등 버튼이 사각형이 되고, `.aboutPage *::selection`이 `selection:` 유틸리티를
이겨 선택 하이라이트가 조용히 바뀐다.

**Tailwind는 preflight 없이 쓴다.** `global.css`가 이미 리셋을 갖고 있어
겹치면 기존 렌더가 흔들린다. `tailwindcss/theme.css`와
`tailwindcss/utilities.css`만 import한다.

**`global.css`에 자손 선택자가 하나 남아 있다** (`.resumeHtml a`).
`resume.json`의 HTML 문자열이 `dangerouslySetInnerHTML`로 들어가는 두 자리의
링크를 잡는다. 그 노드는 React가 만든 것이 아니라 JSX에서 `className`을 붙일 수
없다. 이력서 링크를 JSON에 두는 편의를 지키기로 한 결정의 대가다.
```

- [ ] **Step 5: 기술 부채 목록을 고친다**

"`about.tsx`가 183줄 단일 컴포넌트다" 항목을 **삭제한다** (해소됨).

- [ ] **Step 6: 게이트와 커밋**

```bash
pnpm format:check
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for the tailwind migration"
```

---

## 자체 검토 기록

**스펙 커버리지.** 스펙의 각 절이 어느 태스크에 대응하는지: 도입 방식 → T1 / 색을 바꾸지 않는 방법 → 전 태스크 Global Constraints / 무엇을 옮기나 → T2·T3~T7 / about.tsx 분해 → T3·T6·T7 / `dangerouslySetInnerHTML` 예외 → T6 Step 2 / 까다로운 지점 1(소제목 점) → T4 Step 2 / 2(리스트 마커) → T6 Step 3 / 3(`nth-of-type`) → T6 Step 3 / 4(`::selection`) → T4 Step 2 / 5(브레이크포인트) → T5 Step 1 / 검증 → 전 태스크 "전체 게이트" / CLAUDE.md 갱신 → T8. **빠진 절 없음.**

**스펙과 달라진 점 두 가지** (계획에서 보강, 스펙 결정은 유지):

1. `@layer base` 래핑 — 스펙에 없었다. 없으면 T4가 죽는다.
2. `::selection`을 유틸리티로 옮긴다 — 스펙은 "`-moz-selection`은 버린다"까지만 다뤘고, 레이어 문제로 **애초에 유틸리티가 안 먹는다**는 사실을 몰랐다. T1의 래핑이 이걸 함께 푼다.

**스펙의 오기 정정.** 스펙 「합격 기준」이 "PNG 두 장이 그대로여야 한다"고 썼고 커밋 메시지는 "byte-identical"이라고 했는데, `playwright.config.ts`에 `maxDiffPixelRatio: 0.001`이 걸려 있다. **바이트 동일이 아니라 0.1% 허용 안에서 통과**가 정확하다. 이 계획의 Global Constraints에 정정해 두었다.

**타입 일관성.** `classes.ts`의 export 여덟 개(`infoTable` `infoTableRow` `infoTableTh` `infoTableTd` `sectionWrap` `sectionH4` `sectionH4Span` `bodyP`)를 T5·T6·T7이 `import * as c`로 쓴다. 초안에 있던 `techLabel`은 **삭제했다** — T6·T7이 기술 스택 라벨을 인라인으로 적기 때문에 아무도 쓰지 않았다. 두 곳뿐이고 `after:content` 때문에 문자열이 길어 상수화 이득이 적다.

**컴포넌트 시그니처.** `TitleBar({ onClose, onToggleAll })` · `ExperienceItem({ item })` · `JobSection({ item })` · `PortfolioItem({ item })` · `LanguageList({ items })`. T3·T6·T7의 호출부와 일치한다.

**타입 출처 — 초안의 실제 오류.** 초안은 `Experience` `ExperienceSection` `Portfolio` `Language`를 `@/contents/types`에서 import한다고 썼는데, **그 파일은 `Resume` 하나만 export한다.** 나머지는 전부 `Resume` 안에 인라인으로 중첩돼 있어 그대로면 T6·T7이 컴파일되지 않는다. T6 Step 1에 인덱스 접근 파생 별칭 네 줄을 추가해 고쳤다.

**실행 전 개정 (2026-09-15).** SDD 사전 점검에서 세 건을 고쳤다. ① Task 1이 렌더에 안 쓰이는 프로브 상수(`TAILWIND_LAYER_PROBE`)를 코드에 심게 했던 것을 `document.styleSheets` 직접 검사로 바꿨다 — 죽은 코드가 사라지고 옛 Task 8의 테스트 재작성 스텝도 함께 사라졌다. ② 아무도 import하지 않는 파일을 커밋하던 옛 Task 3을 해체해 `classes.ts`는 첫 소비자인 Task 5로, 파생 타입은 Task 6으로 접어넣었다 — 태스크가 9개에서 **8개**가 됐다. ③ Task 2가 일부러 실패하는 게이트를 거치게 했던 스텝 순서를 뒤집었다.
