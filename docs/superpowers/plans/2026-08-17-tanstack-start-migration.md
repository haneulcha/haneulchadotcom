# Next.js → TanStack Start 마이그레이션 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

- 작성일: 2026-08-17
- 근거 스펙: [2026-08-17 TanStack Start 마이그레이션 설계](../specs/2026-08-17-tanstack-start-migration-design.md) — **사용자 승인 완료. 설계 결정을 다시 열지 않는다.**
- 브랜치: `haneulcha/landing-toy`

**Goal:** 두 라우트(`/`, `/about`)의 동작과 시각적 결과를 보존한 채 Next.js 16을 TanStack Start로 교체하고, 검증 인프라(HTML diff + Playwright)와 문서를 함께 정비한다.

**Architecture:** Next App Router 파일들을 `src/routes/`의 TanStack Start 파일 라우트로 1:1 이전하고, Vite + Nitro로 두 라우트를 정적 프리렌더한다. 마이그레이션 **전에** Next 빌드에서 HTML 스냅숏과 Playwright 스크린샷 베이스라인을 확보해 두고, 전환 후 같은 잣대로 비교한다. 마크업이 1:1로 검증된 뒤에야 의도된 변경(`td`→`th`, 색 토큰화)을 별도 커밋으로 얹는다.

**Tech Stack:** TanStack Start(`@tanstack/react-start`, `@tanstack/react-router`), Vite, Nitro, React 19.2.8(유지), TypeScript 6.0.3(유지), ESLint 9.39.5(유지) + `typescript-eslint` + `eslint-plugin-react-hooks`, Playwright.

## Global Constraints

모든 태스크에 암묵적으로 적용된다.

- 패키지 매니저는 **pnpm 전용**. npm/yarn 금지. 새 의존성은 기존 관례대로 **정확 버전 고정**으로 설치한다 (`pnpm add -E` / `pnpm add -D -E`).
- 커밋은 **Conventional Commits**. commit-msg 훅(commitlint)과 pre-commit 훅(lint-staged)이 돈다. `--no-verify` 금지. 제목은 기존 히스토리처럼 영어 소문자로 쓴다.
- 포매팅은 **Prettier 전담**. 새 파일을 만든 뒤 커밋 전에 `pnpm format`을 돌려 `pnpm format:check`가 통과하는 상태로 커밋한다.
- **TypeScript 6.0.3 유지** (`typescript-eslint`가 TS 7 거부). **ESLint 9.39.5 유지** (10 승격은 범위 밖). react/react-dom **19.2.8 유지**.
- npm 스크립트 이름 `dev`/`build`/`type-check`/`lint`/`format`/`format:check`는 그대로 둔다. **`.github/workflows/ci.yml`은 수정하지 않는다.**
- **시키지 않은 색 리팩터링 금지.** 하드코딩된 색 대부분(타이틀바·신호등, 랜딩 타이포)은 의도된 것이다. 유일한 예외는 Task 8의 `About.module.css` `#0550ae` → `var(--point-color)`.
- `resume.json`은 이번에 수정하지 않는다. (만질 일이 생기면 HTML 속성은 작은따옴표 관례를 따른다.)
- **범위 밖** — 계획에 없으면 하지 마라: 인터랙티브 기능 구현, 디자인 변경, OG 이미지, `resume.json` 타입 정의, "최종 수정" 날짜의 JSON 이전, description 재작성, ESLint 10 승격, about 200줄 컴포넌트 분할, CI에 Playwright 연결.
- **커밋 순서가 곧 검증 순서다.** 특히 Next 기준선 확보(Task 2·3)는 Next를 제거(Task 5)하기 **전에** 끝나야 한다. `td`→`th`(Task 8)는 HTML diff(Task 6)가 끝난 **뒤**여야 한다.

**되돌리는 법 (공통):** 태스크마다 커밋이 닫히므로, 태스크가 실패하면 `git reset --hard HEAD`(커밋 전) 또는 `git revert <해당 커밋>`(커밋 후)으로 되돌린다. 의존성을 바꾼 태스크를 되돌린 뒤에는 반드시 `pnpm install`로 `node_modules`를 락파일과 다시 맞춘다.

---

### Task 1: 준비 — 의존성 설치와 기준 그린 확인

현재 `node_modules`가 없다. 설치하고, 손대기 전의 저장소가 실제로 그린인지 먼저 확인한다.

**Files:** 변경 없음 (커밋 없음)

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/haneul/orca/workspaces/haneulchadotcom/landing-toy
pnpm install
```

Expected: 성공. `prepare: husky`가 훅을 설치한다.

- [ ] **Step 2: 4종 검증이 전부 통과하는지 확인**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build
```

Expected: 전부 성공. 하나라도 실패하면 **여기서 멈추고 보고한다** — 이 계획은 그린 상태에서 출발하는 것을 전제한다.

---

### Task 2: Next 기준 HTML 스냅숏 확보 — **이미 완료됨 (커밋 `3e2c990`)**

> **이 태스크는 실행하지 마라.** 계획 수립과 병행해 먼저 처리됐다. Next 제거 전에만 가능한 작업이라
> 착수 시점을 앞당겼다. 아래는 무엇이 확보됐는지와, 그것이 멀쩡한지 확인하는 절차다.

Task 6에서 TSS 프리렌더 결과와 diff할 기준선이다.

**확보된 것 (전부 커밋됨):**

| 경로                            | 내용                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `docs/baseline/next/index.html` | Next 16.3.0 빌드의 `/` (`.next/server/app/index.html`)      |
| `docs/baseline/next/about.html` | Next 16.3.0 빌드의 `/about` (`.next/server/app/about.html`) |
| `docs/baseline/normalize.mjs`   | DOM 구조 정규화 스크립트                                    |
| `docs/baseline/README.md`       | 사용법 + **의도된 차이** 목록                               |

`.prettierignore`에 `docs/baseline`이 등록돼 있다. **스냅숏은 바이트 그대로 보존돼야 하므로 절대
포맷하지 마라.** 두 라우트 모두 Next에서 `○ (Static)`으로 프리렌더된 산출물이라 TSS 프리렌더 결과와
같은 성격이고, 따라서 직접 비교가 성립한다.

- [ ] **Step 1: 기준선이 멀쩡한지 확인**

```bash
cd /Users/haneul/orca/workspaces/haneulchadotcom/landing-toy
node docs/baseline/normalize.mjs docs/baseline/next/about.html /tmp/norm-check.html
grep -c 'class="aboutPage main"' /tmp/norm-check.html   # → 1
grep -c 'About_' /tmp/norm-check.html || true            # → 0 (해시 전부 정규화)
grep -o '<td' /tmp/norm-check.html | wc -l               # → 14
grep -c '<button class="close">' /tmp/norm-check.html    # → 1
```

Expected: 주석의 값과 일치. 하나라도 어긋나면 **멈추고 보고한다** — 기준선이 손상된 것이고,
Next이 아직 살아 있는 지금이 다시 뜰 수 있는 마지막 기회다.

> **`<td>` 14개는 기억해 둘 숫자다.** Task 8에서 `<td>` 7개 + `<th>` 7개가 되어야 한다
> (`infoLink` 4행 + 경력 3행 = 7행 × 2셀). 이 전환은 **의도된 차이**이며 회귀가 아니다.

**참고 — 정규화 스크립트의 내용** (이미 저장소에 있다. 다시 만들 필요 없다):

```js
// 사용법: node docs/baseline/normalize.mjs <입력.html> <출력.html>
// <body> 내용만 남기고, script/template/주석을 제거한 뒤,
// CSS Modules 해시 클래스명을 로컬 이름으로 정규화한다.
import { readFileSync, writeFileSync } from 'node:fs';

// src/styles/Home.module.css + About.module.css의 로컬 이름 전부 + 전역 aboutPage.
// 긴 이름부터 매칭해야 'content'가 'contentWrapper'를 가로채지 않는다 (아래에서 정렬).
const localNames = [
  'container',
  'main',
  'footer',
  'title',
  'description',
  'code',
  'grid',
  'card',
  'logo',
  'typo1',
  'typo2',
  'typo3',
  'contentWrapper',
  'titlebar',
  'buttonWrapper',
  'inlineContent',
  'buttons',
  'close',
  'closebutton',
  'minimize',
  'minimizebutton',
  'zoom',
  'zoombutton',
  'content',
  'lastUpdatedAt',
  'infoTable',
  'experienceSection',
  'language',
  'aboutPage',
].sort((a, b) => b.length - a.length);

let html = readFileSync(process.argv[2], 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
html = bodyMatch ? bodyMatch[1] : html;

html = html.replace(/<script[\s\S]*?<\/script>/g, '');
html = html.replace(/<template[\s\S]*?<\/template>/g, '');
html = html.replace(/<!--[\s\S]*?-->/g, '');

html = html.replace(/class="([^"]*)"/g, (_, value) => {
  const tokens = value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      for (const name of localNames) {
        if (token.includes(name)) return name;
      }
      return token;
    });
  return `class="${tokens.join(' ')}"`;
});

html = html.replace(/></g, '>\n<').trim();

writeFileSync(process.argv[3], html + '\n');
```

**되돌리기:** 해당 없음 — 이 태스크는 읽기 전용 확인이다. 스냅숏이 손상됐다면 Next이 아직 살아 있는
동안(Task 5 이전) `pnpm build` 후 `.next/server/app/{index,about}.html`을 `docs/baseline/next/`로
다시 복사하면 된다. **Task 5 이후에는 복구 불가능하다.**

---

### Task 3: Playwright 도입 + Next 기준 스크린샷 베이스라인

스크린샷 회귀 테스트를 **Next 빌드를 기준으로** 먼저 깐다. 이 베이스라인이 마이그레이션 후(Task 7)의 합격 기준이 된다. 커버 범위는 스펙이 정한 대로: 두 라우트 스크린샷 + `<details>` 전체 토글. 닫기 버튼 내비게이션도 함께 커버한다 — `router.push` → `useNavigate` 치환이 이번 변경의 위험 지점이기 때문이다.

**Files:**

- Create: `playwright.config.ts`, `tests/pages.spec.ts`, `tests/pages.spec.ts-snapshots/*.png` (자동 생성, 커밋)
- Modify: `package.json` (devDep + `test` 스크립트), `.gitignore`

**Interfaces:**

- Produces: `pnpm test` — `http://localhost:3000`을 `pnpm start`로 띄워 검사한다. **사전에 `pnpm build`가 되어 있어야 한다.** Task 7·8·11이 이 명령에 의존한다.

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add -D -E @playwright/test
pnpm exec playwright install chromium
```

- [ ] **Step 2: `playwright.config.ts` 작성**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    // 빌드 결과물을 서빙한다. 실행 전에 `pnpm build`가 필요하다.
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

`webServer.command`를 `pnpm start`로 두는 것이 핵심이다. 지금은 `next start`를 가리키고, Task 5 이후에는 같은 이름이 `node .output/server/index.mjs`를 가리키므로 **이 파일은 마이그레이션을 건너 그대로 산다.**

- [ ] **Step 3: `tests/pages.spec.ts` 작성**

```ts
import { expect, test } from '@playwright/test';

// 화면에 웹폰트(Noto Sans KR)가 걸려 있어, 폰트 로드 완료를 기다려야
// 스크린샷이 안정된다.
async function waitForFonts(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready);
}

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('about.png', { fullPage: true });
});

test('minimize button toggles every details element', async ({ page }) => {
  await page.goto('/about');
  const details = page.locator('details');
  const minimize = page.locator('nav button').nth(1);
  const openStates = () =>
    details.evaluateAll((els) =>
      els.map((el) => (el as HTMLDetailsElement).open),
    );

  expect((await details.count()) > 0).toBe(true);
  // 초기 상태: 전부 열려 있다 (<details open>)
  expect(await openStates()).not.toContain(false);

  await minimize.click();
  expect(await openStates()).not.toContain(true);

  await minimize.click();
  expect(await openStates()).not.toContain(false);
});

test('close button navigates back to landing', async ({ page }) => {
  await page.goto('/about');
  await page.locator('nav button').first().click();
  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('ㅊ');
});
```

버튼을 `nav button` 위치로 잡는 이유: CSS Modules 클래스명(`styles.minimize` 등)은 해시라 프레임워크 전환 후 달라진다. 마크업 구조(타이틀바 `nav` 안 버튼 3개: 닫기·최소화·줌 순서)는 양쪽에서 동일하다.

- [ ] **Step 4: `.gitignore`에 Playwright 산출물 추가**

```
# playwright
/test-results/
/playwright-report/
```

- [ ] **Step 5: `package.json`에 `test` 스크립트 추가**

`scripts`에 추가 (`"commit": "cz"` 뒤):

```json
"test": "playwright test"
```

- [ ] **Step 6: Next 빌드 기준으로 베이스라인 생성**

```bash
pnpm exec playwright test --update-snapshots
```

Expected: 4개 테스트 전부 통과, `tests/pages.spec.ts-snapshots/`에 `landing-chromium-darwin.png`, `about-chromium-darwin.png` 생성.

- [ ] **Step 7: 베이스라인으로 재실행해 결정적(deterministic)인지 확인**

```bash
pnpm exec playwright test
```

Expected: 4/4 통과. 스크린샷이 흔들려 실패하면 폰트 로드 대기가 빠졌는지 확인한다.

- [ ] **Step 8: 포맷·린트 확인 후 커밋**

```bash
pnpm format
pnpm type-check && pnpm lint && pnpm format:check
git add playwright.config.ts tests/ package.json pnpm-lock.yaml .gitignore
git commit -m "test: add playwright screenshot and interaction tests"
```

**되돌리기:** `git revert` 후 `pnpm install`. 베이스라인 PNG는 커밋에 포함되므로 revert로 같이 사라진다.

---

### Task 4: ESLint를 프레임워크 비의존 구성으로 재작성

`eslint-config-next`가 빠지면 `pnpm lint`가 죽는다. 그래서 **Next를 제거하기 전에**, Next가 아직 살아 있는 그린 상태에서 lint 체인을 먼저 갈아 끼운다. 이러면 Task 5의 마이그레이션 커밋이 ESLint 재구성과 뒤섞이지 않는다.

지금 `typescript-eslint`는 `eslint-config-next`의 전이 의존성으로만 존재하므로 직접 의존성으로 승격해야 한다.

**Files:**

- Modify: `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`

**Interfaces:**

- Produces: `pnpm lint`가 `eslint-config-next` 없이 동작한다. ignores에 Next 산출물(`.next/`, `next-env.d.ts`)과 TSS 산출물(`.output/` 등, `src/routeTree.gen.ts`)을 **미리 양쪽 다** 넣어 둔다 — Task 5가 이 파일을 다시 만질 필요가 없도록.

- [ ] **Step 1: 의존성 교체**

```bash
pnpm remove eslint-config-next
pnpm add -D -E typescript-eslint eslint-plugin-react-hooks
```

ESLint 본체는 9.39.5 그대로 둔다.

- [ ] **Step 2: `eslint.config.mjs` 전체를 아래로 교체**

```js
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Prettier is not run as an ESLint rule here. `eslint-config-prettier` only
 * turns off the rules that would fight with it; formatting itself is
 * `pnpm format` and the lint-staged hook.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      '.output/**',
      '.nitro/**',
      '.tanstack/**',
      'test-results/**',
      'playwright-report/**',
      'src/routeTree.gen.ts',
    ],
  },
  ...tseslint.configs.recommended,
  reactHooks.configs['recommended-latest'],
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;
```

트러블슈팅: 설치된 `eslint-plugin-react-hooks` 메이저에 따라 flat 프리셋 접근자가 `configs['recommended-latest']`가 아니라 `configs.flat.recommended`일 수 있다. `pnpm lint`가 "Cannot read properties of undefined" 류로 죽으면 `node -e "console.log(Object.keys(require('eslint-plugin-react-hooks').configs))"`로 실제 키를 확인해 그 이름으로 바꾼다. **프리셋 이름만 바꾸고 구조는 유지한다.**

- [ ] **Step 3: 검증**

```bash
pnpm lint
pnpm type-check && pnpm format:check && pnpm build
```

Expected: 전부 통과. 새 룰셋이 기존 코드에서 에러를 낸다면, 코드를 고치는 게 아니라 **해당 룰을 기존 동작(통과)에 맞게 꺼서** 이 태스크를 순수한 툴 교체로 유지한다. 끈 룰이 있으면 커밋 메시지 본문에 남긴다.

- [ ] **Step 4: 커밋**

```bash
git add eslint.config.mjs package.json pnpm-lock.yaml
git commit -m "refactor: make eslint config framework-agnostic"
```

**되돌리기:** `git revert` 후 `pnpm install`.

---

### Task 5: TanStack Start 전환 본체

가장 큰 태스크. 라우트 이전·의존성 교체·설정 교체가 서로를 전제하므로 한 커밋으로 묶는다 — 쪼개면 중간 커밋이 빌드 불능이 되고, pre-commit 훅이 있는 이 저장소에서는 그런 커밋을 만들 수 없다.

**JSX 본문은 글자 하나 바꾸지 않고 옮긴다.** 바뀌는 것은 import, 라우트 선언 껍데기, 그리고 `useRouter().push` → `useNavigate()` 딱 세 가지다. `td`→`th`는 **여기서 하지 않는다** (Task 8. 여기서 하면 Task 6의 HTML diff가 오염된다).

**Files:**

- Create: `vite.config.ts`, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/about.tsx`, `src/vite-env.d.ts`, `src/routeTree.gen.ts`(자동 생성, 커밋)
- Delete: `src/app/` 전체, `next.config.ts`, `next-env.d.ts`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`, `.prettierignore`
- 변경 금지: `src/contents/`, `src/styles/`, `.github/workflows/ci.yml`, `eslint.config.mjs`(Task 4에서 이미 완료)

**Interfaces:**

- Consumes: Task 4의 ESLint 구성(ignores에 `src/routeTree.gen.ts` 포함), Task 3의 `pnpm start` 계약.
- Produces: `pnpm dev`(vite, :3000), `pnpm build`(vite build + 프리렌더 → `.output/`), `pnpm start`(`node .output/server/index.mjs`, :3000). 라우트 파일 위치 `src/routes/*`. 이후 태스크는 전부 이 위에서 돈다.

- [ ] **Step 1: 의존성 교체**

```bash
pnpm remove next
pnpm add -E @tanstack/react-router @tanstack/react-start
pnpm add -D -E vite @vitejs/plugin-react nitro
```

- [ ] **Step 2: `vite.config.ts` 작성**

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Next와 동일하게 dev 서버를 3000에 띄운다 (문서·Playwright baseURL이 전제).
  server: { port: 3000 },
  resolve: {
    // tsconfig의 paths와 짝. '@/public'을 '@'보다 먼저 두어야 한다.
    alias: [
      {
        find: '@/public',
        replacement: fileURLToPath(new URL('./public', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  plugins: [
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    nitro(),
    viteReact(),
  ],
});
```

`crawlLinks: true`는 `/`가 링크하는 `/about`까지 프리렌더 대상에 넣기 위한 것이다 (스펙의 "두 라우트를 정적 HTML로 프리렌더"의 구현). Step 10에서 두 HTML이 실제로 나오는지 확인한다.

- [ ] **Step 3: `src/router.tsx` 작성**

```tsx
import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
```

트러블슈팅: TanStack Start 1.x 안에서 이 진입점의 기대 export 이름이 `getRouter`(최신 컨벤션)와 `createRouter` 사이에서 바뀐 이력이 있다. dev 서버가 "router export를 찾을 수 없다" 류의 에러를 내면 설치된 버전의 공식 문서를 확인해 **export 이름만** 맞춘다.

- [ ] **Step 4: `src/routes/__root.tsx` 작성**

기존 `src/app/layout.tsx`의 대체다. `metadata` export의 title·description·icon을 `head()`로 그대로 옮긴다 (문구 수정 금지 — description 재작성은 범위 밖). Next가 자동 주입하던 charset·viewport는 여기서 명시해야 한다. `metadataBase`는 OG 태그가 없으므로 옮길 대상이 없다.

```tsx
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import globalCss from '@/styles/global.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HaneulChaDotCom' },
      {
        name: 'description',
        content:
          'HaneulChaDotCom is a personal website of Haneul Cha dot com. Haneul Cha dot com is a software engineer and a web developer.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: globalCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: `src/routes/index.tsx` 작성**

기존 `src/app/page.tsx`의 대체. 변경점은 import와 라우트 선언, 그리고 `<Link href>` → `<Link to>` 뿐이다. JSX 본문은 동일하다.

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';

import styles from '@/styles/Home.module.css';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          <Link to="/about" className={styles.typo1}>
            ㅊ
          </Link>
          <a
            href="https://kicksky.tistory.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.typo3}
          >
            ㅎ
          </a>
          <div className={styles.typo2}>ㄴ</div>
        </h1>
      </main>

      <footer className={styles.footer}>
        <div> &copy; {new Date().getFullYear()} Haneul Cha</div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 6: `src/routes/about.tsx` 작성**

기존 `src/app/about/page.tsx`의 대체. 변경점은 정확히 네 가지다:

1. `'use client'` 삭제 (TSS에는 이 지시어가 없다. `document` 접근은 이벤트 핸들러 안이라 SSR에서 안전하다)
2. `import { useRouter } from 'next/navigation'` → `import { createFileRoute, useNavigate } from '@tanstack/react-router'`
3. `const router = useRouter()` → `const navigate = useNavigate()`, `router.push('/')` → `navigate({ to: '/' })`
4. 파일 하단 `export default About` 대신 상단에 `export const Route = createFileRoute('/about')({ component: About })`

**함정 두 가지, 여기서 절대 건드리지 말 것:**

- 닫기 버튼은 `<button>` 그대로. `About.module.css:59`의 `.buttonWrapper button` 엘리먼트 선택자 때문에 `<Link>`(=`<a>`)로 바꾸면 신호등이 깨진다. 그래서 `useNavigate()`다.
- `className={`aboutPage ${styles.main}`}`의 `aboutPage`는 `global.css:59` `.aboutPage *::selection`이 걸린 **전역 클래스 문자열**이다. 글자 그대로 유지한다.

파일 상단은 다음과 같아지고, `return (` 이하 JSX 본문(19–177행)은 기존 파일에서 **그대로 복사**한다 (`td scope` 포함 — Task 8 전까지 바꾸지 않는다):

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import content from '@/contents/resume.json';
import styles from '@/styles/About.module.css';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const navigate = useNavigate();

  const closeToggleHandler = () => {
    const detailsTags = document.querySelectorAll('details');
    const isAllOpen = [...detailsTags].every((el) => el.open);
    detailsTags.forEach((el) => {
      el.open = !isAllOpen;
    });
  };

  // ... 이하 기존 JSX 그대로. 닫기 버튼의 onClick만:
  // <button className={styles.close} onClick={() => navigate({ to: '/' })}>
```

파일 끝의 `export default About;`은 삭제한다 (라우트 등록은 `Route` export가 담당).

- [ ] **Step 7: `src/vite-env.d.ts` 작성**

`*.module.css`와 `?url` import의 타입을 공급한다 (Next에서는 `next-env.d.ts`가 하던 일).

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 8: Next 파일 삭제 + 설정 갱신**

```bash
git rm -r src/app next.config.ts next-env.d.ts
```

`tsconfig.json` 전체를 아래로 교체 (Next 플러그인·include 제거, 나머지 옵션은 유지):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/public/*": ["./public/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".output", ".nitro", ".tanstack"]
}
```

`package.json`의 `scripts`에서 세 줄 교체:

```json
"dev": "vite dev",
"build": "vite build",
"start": "node .output/server/index.mjs",
```

`.gitignore`에서 `# next.js` 블록(`/.next/`, `/out/`)을 아래로 교체:

```
# tanstack start / vite / nitro
/.output/
/.nitro/
/.tanstack/
```

`.prettierignore`에서 `.next`와 `next-env.d.ts`를 지우고 아래로 교체:

```
node_modules
pnpm-lock.yaml
.output
.nitro
.tanstack

# generated by tanstack router
src/routeTree.gen.ts
```

`src/routeTree.gen.ts`는 커밋하되(스펙) 생성기 포맷을 보존해야 하므로 Prettier·ESLint 양쪽에서 제외한다 (ESLint 쪽은 Task 4에서 이미 제외됨).

- [ ] **Step 9: 빌드해서 `routeTree.gen.ts` 생성 + 전체 검증**

```bash
pnpm build
pnpm type-check && pnpm lint && pnpm format && pnpm format:check
```

Expected: `pnpm build`가 `src/routeTree.gen.ts`를 생성하고 프리렌더까지 성공. 이어지는 3종 검증 통과. `vite build`는 Next와 달리 **타입 검사를 하지 않으므로** `type-check`가 실질 게이트다.

- [ ] **Step 10: 프리렌더 산출물에 두 라우트가 있는지 확인**

```bash
find .output/public -name '*.html'
grep -o '<title>[^<]*</title>' "$(find .output/public -name 'index.html' -not -path '*about*' | head -1)"
```

Expected: `/`와 `/about`의 HTML이 각각 존재 (`index.html`과 `about/index.html` 또는 `about.html`), title은 `HaneulChaDotCom`. **`/about` HTML이 없으면** `crawlLinks`가 링크를 못 찾은 것이다 — `tanstackStart`의 prerender 설정에 명시 경로(`pages: [{ path: '/' }, { path: '/about' }]` 형태, 설치 버전 문서의 옵션명 확인)를 추가해 두 라우트를 강제한다.

- [ ] **Step 11: dev 서버 스모크 확인**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -sf http://localhost:3000/ | grep -c 'ㅊ'
curl -sf http://localhost:3000/about | grep -c 'aboutPage'
kill $DEV_PID
```

Expected: 둘 다 1 이상.

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat: migrate from next.js to tanstack start"
```

**되돌리기:** 이 태스크가 실패한 채로 수렁에 빠지면 `git reset --hard HEAD && git clean -fd && pnpm install`로 Task 4 종료 시점(Next가 살아 있는 그린 상태)으로 복귀한다. 기준선(`docs/baseline/`)은 커밋돼 있으므로 `git clean`이 지우지 않는다.

---

### Task 6: 검증 1 — HTML 구조 diff

Next 기준선(Task 2)과 TSS 프리렌더 결과의 DOM 구조를 비교한다. **여기서 diff가 깨끗해진 뒤에야 Task 8의 의도된 마크업 변경으로 넘어갈 수 있다.**

**Files:** 저장소 변경 없음 (커밋 없음). 작업 파일은 전부 `/tmp`에 둔다.

- [ ] **Step 1: TSS 빌드를 서빙해서 스냅숏**

```bash
pnpm start &
SERVER_PID=$!
sleep 5
curl -sf http://localhost:3000/ -o /tmp/tss-index.html
curl -sf http://localhost:3000/about -o /tmp/tss-about.html
kill $SERVER_PID
```

> 기준선은 빌드 산출물에서, TSS 쪽은 서빙된 응답에서 왔다. 정규화가 `<body>` 밖과 `<script>`를
> 전부 걷어내므로 이 차이는 비교에 영향을 주지 않는다. Task 2 Step 1에서 기준선이 정규화를
> 통과하는 것을 이미 확인했다.

- [ ] **Step 2: 정규화 후 diff**

```bash
N=docs/baseline/normalize.mjs
node $N docs/baseline/next/index.html /tmp/next-index.norm.html
node $N /tmp/tss-index.html                /tmp/tss-index.norm.html
node $N docs/baseline/next/about.html /tmp/next-about.norm.html
node $N /tmp/tss-about.html                /tmp/tss-about.norm.html
diff -u /tmp/next-index.norm.html /tmp/tss-index.norm.html
diff -u /tmp/next-about.norm.html /tmp/tss-about.norm.html
```

Expected: **diff 없음이 목표.** 허용되는 예외는 다음 두 종류뿐이다:

- 공백·줄바꿈 차이 (`diff -uw`로 재확인해서 사라지는 것)
- 활성 링크에 라우터가 붙이는 상태 속성 (예: `<a>`의 `aria-current`, `data-status` 류)

그 외의 모든 차이 — 요소 추가/누락, 클래스 누락(특히 `aboutPage`), 텍스트 차이, `details`의 `open` 유무 — 는 **회귀다.** Task 5의 라우트 파일을 고치고 `pnpm build`부터 이 태스크를 다시 돈다. 원인 불명이면 superpowers:systematic-debugging을 따른다.

- [ ] **Step 3: head 메타 수동 대조**

body만 diff했으므로 head는 별도로 본다.

```bash
grep -o '<title>[^<]*</title>' /tmp/tss-index.html
grep -c 'name="description"' /tmp/tss-index.html
grep -c 'rel="icon"' /tmp/tss-index.html
grep -c 'lang="ko"' /tmp/tss-index.html
grep -c 'charset' /tmp/tss-index.html
grep -c 'name="viewport"' /tmp/tss-index.html
```

Expected: title은 `<title>HaneulChaDotCom</title>`, 나머지는 전부 1 이상.

---

### Task 7: 검증 2 — Playwright 회귀

Next 빌드에서 뜬 스크린샷 베이스라인으로 TSS 빌드를 검사한다. 여기 통과가 "시각적 결과 보존"의 증거다.

**Files:** 통과 시 변경 없음 (커밋 없음).

- [ ] **Step 1: 테스트 실행**

```bash
pnpm test
```

(`webServer`가 `pnpm start`로 Task 5의 빌드 산출물을 서빙한다. 빌드가 오래됐다면 `pnpm build` 먼저.)

Expected: 4/4 통과 — 스크린샷 2건(픽셀 비교), `details` 토글, 닫기 버튼 내비게이션.

- [ ] **Step 2: 실패 시 대응 규칙**

- **스크린샷 실패**: `playwright-report/`의 diff 이미지를 열어 본다. 실제 시각 차이(색·간격·폰트)면 회귀다 — Task 5로 돌아가 원인을 고친다. CSS 로드 순서나 안티에일리어싱 수준의 미세 차이로 판단되면, **diff 이미지를 육안으로 확인하고 그 근거를 기록한 뒤에만** `pnpm exec playwright test --update-snapshots`로 재베이스라인하고 `test: rebaseline screenshots after tanstack start migration` 커밋을 만든다. 근거 없는 재베이스라인 금지 — 그건 회귀 테스트를 스스로 무너뜨리는 짓이다.
- **토글/내비게이션 실패**: 기능 회귀다. 재베이스라인으로 덮을 수 없다. `<details open>`의 SSR/수화 어긋남(스펙의 리스크 항목)이 유력한 용의자다.

---

### Task 8: 접근성(`td`→`th`)과 색 토큰화

diff 기준선이 확보됐으므로 이제 의도된 변경을 얹는다. 두 변경은 성격이 달라 커밋을 나눈다.

**Files:**

- Modify: `src/routes/about.tsx`, `src/styles/About.module.css`

- [ ] **Step 1: `src/routes/about.tsx`의 행 머리 셀 교체**

`<td scope="row">…</td>`를 `<th scope="row">…</th>`로 바꾼다. 정확히 4곳이다: 개인 정보 테이블의 `{item.id}` 셀 1곳, 경력 테이블의 `기간`·`업무`·`기술` 셀 3곳. 닫는 태그도 함께 바꾼다.

- [ ] **Step 2: `About.module.css`의 선택자 동반 수정**

**한쪽만 바꾸면 레이아웃이 깨진다.** 네 군데를 함께 고친다. `th`는 UA 스타일이 `text-align: center`라 `text-align: left`를 명시해야 기존 렌더가 유지된다. 행 구조가 `th + td`가 되면서 값 셀이 유일한 `td`가 되므로 `td:nth-of-type(2)`는 `td`로 바꾼다.

```css
/* 기존 → 변경 */

.infoTable tr td[scope='row'] {
  /* → .infoTable tr th[scope='row'] { */
  padding-left: 0.5rem;
  min-width: 7.75rem;
  font-weight: bold;
  line-height: 2.5;
  text-align: left; /* ← 추가 (th의 UA 기본값 상쇄) */
}

.infoTable tr td:nth-of-type(2) {
  /* → .infoTable tr td { */
  padding-right: 1.5rem;
}

@media (max-width: 375px) {
  .infoTable tr td[scope='row'] {
    /* → .infoTable tr th[scope='row'] { */
    min-width: 4rem;
  }
}

@media (max-width: 320px) {
  .infoTable tr,
  .infoTable td {
    /* → .infoTable tr, .infoTable th, .infoTable td { */
    display: block;
  }
  .infoTable tr td[scope='row'] {
    /* → .infoTable tr th[scope='row'] { */
    line-height: 2.3;
  }
  .infoTable tr td:nth-of-type(2) {
    /* → .infoTable tr td { */
    padding: 0 0 0 0.5rem;
    line-height: 2.3;
  }
}
```

- [ ] **Step 3: 빌드 + 스크린샷으로 레이아웃 보존 확인**

```bash
pnpm build && pnpm test
```

Expected: 4/4 통과. `text-align: left` 명시 덕에 `about.png`는 픽셀 단위로 동일해야 한다. 스크린샷이 실패하면 diff 이미지를 확인한다 — 테이블 영역에 차이가 있으면 Step 2의 선택자 수정이 빠진 것이다.

- [ ] **Step 4: 검증 후 커밋 (1/2)**

```bash
pnpm type-check && pnpm lint && pnpm format:check
git add src/routes/about.tsx src/styles/About.module.css
git commit -m "fix: use th for resume table row headers"
```

- [ ] **Step 5: `#0550ae` 토큰화**

`About.module.css`의 `.content h2::before` 블록에서 (원래 168행, Step 2 이후 줄 번호는 밀렸을 수 있다):

```css
color: #0550ae;
```

를 다음으로 교체:

```css
color: var(--point-color);
```

같은 값이므로 렌더 변화가 없어야 한다. **이 파일의 다른 하드코딩 색(신호등·타이틀바)은 의도된 것이니 건드리지 않는다.**

- [ ] **Step 6: 검증 후 커밋 (2/2)**

```bash
pnpm build && pnpm test
git add src/styles/About.module.css
git commit -m "refactor: replace hardcoded point color with token"
```

Expected: 테스트 4/4 (스크린샷 픽셀 동일).

---

### Task 9: robots.txt + sitemap.xml

스펙의 "함께 처리하는 기술 부채" 마지막 항목. 정적 파일 두 개를 `public/`에 추가한다.

**Files:**

- Create: `public/robots.txt`, `public/sitemap.xml`

- [ ] **Step 1: `public/robots.txt` 작성**

```
User-agent: *
Allow: /

Sitemap: https://haneulcha.com/sitemap.xml
```

- [ ] **Step 2: `public/sitemap.xml` 작성**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://haneulcha.com/</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/about</loc>
  </url>
</urlset>
```

- [ ] **Step 3: 빌드 산출물에 포함되는지 확인**

```bash
pnpm build
ls .output/public/robots.txt .output/public/sitemap.xml
```

Expected: 두 파일 다 존재.

- [ ] **Step 4: 커밋**

```bash
pnpm format:check
git add public/robots.txt public/sitemap.xml
git commit -m "feat: add robots.txt and sitemap.xml"
```

---

### Task 10: 문서 갱신 — CLAUDE.md, README.md, package.json keywords

`CLAUDE.md`는 스스로를 기술 부채의 정본이라 선언한다. 갱신하지 않으면 즉시 거짓말이 된다. **스펙이 필수 범위로 못박은 태스크다.**

**Files:**

- Modify: `CLAUDE.md`(전면 재작성), `README.md`(부분), `package.json`(`keywords`)

- [ ] **Step 1: `CLAUDE.md` 전체를 아래 내용으로 교체**

````markdown
# CLAUDE.md

차하늘의 개인 웹사이트(haneulcha.com). 랜딩 화면과 이력서 화면 두 개로 이루어진
정적 사이트이며 Vercel에 배포된다. TanStack Start로 만들고, 빌드 시 두 라우트를
정적 HTML로 프리렌더한다.

## 명령어

```bash
pnpm dev           # 개발 서버 (http://localhost:3000)
pnpm build         # 프로덕션 빌드 + 정적 프리렌더 (.output/). 타입 검사는 하지 않는다
pnpm start         # 빌드 결과물 로컬 서빙 (node .output/server/index.mjs)
pnpm type-check    # tsc. build가 타입 검사를 겸하지 않으므로 반드시 별도로 돌린다
pnpm lint          # eslint (flat config)
pnpm format        # prettier --write .
pnpm format:check  # CI가 쓰는 검사 모드
pnpm test          # Playwright. 사전에 pnpm build가 필요하다
```

패키지 매니저는 **pnpm**이다 (`packageManager` 필드에 고정). npm이나 yarn을 쓰지 않는다.
Node는 `.nvmrc`의 22를 따른다.

## 구조

```
src/
├── router.tsx          라우터 팩토리 (getRouter)
├── routeTree.gen.ts    자동 생성 라우트 트리. 커밋 대상이지만 직접 수정 금지
├── routes/
│   ├── __root.tsx      루트 셸. <html lang="ko">, head() 메타, global.css
│   ├── index.tsx       / — 랜딩
│   └── about.tsx       /about — 이력서
├── contents/
│   └── resume.json     이력서의 단일 데이터 소스
└── styles/
    ├── global.css      CSS 변수 토큰 + 리셋
    └── *.module.css    화면별 CSS Modules
tests/                  Playwright 스크린샷·인터랙션 테스트 (베이스라인 PNG 포함)
```

경로 별칭은 `@/*` → `src/*`, `@/public/*` → `public/*`. **`tsconfig.json`의 `paths`와
`vite.config.ts`의 `resolve.alias` 양쪽에 선언되어 있으므로 둘을 같이 고쳐야 한다.**

## 알아둘 것

**이력서 내용은 `src/contents/resume.json`에서 고친다.** `/about`은 이 JSON을 그대로
렌더하므로 항목을 추가·수정할 때 컴포넌트 구조를 손댈 일은 없다. **예외가 하나 있다** —
"최종 수정" 날짜만은 `src/routes/about.tsx`의 `lastUpdatedAt` 문단에 하드코딩되어 있어
거기서 갱신해야 한다 (이 날짜를 JSON으로 옮기는 건 아래 기술 부채에 있다).

**`resume.json` 안의 HTML 문자열은 속성에 작은따옴표를 쓴다** (`<a href='...'>`).
JSON 문자열 안이라 큰따옴표를 쓰면 이스케이프해야 한다. 기존 관례를 따라라.

**라우팅은 파일 기반이다.** `src/routes/`에 파일을 추가하면 dev 서버나 빌드가
`src/routeTree.gen.ts`를 재생성한다. 이 파일은 커밋하지만 직접 수정하지 않으며,
Prettier와 ESLint 양쪽에서 제외되어 있다.

**`/about`의 닫기 버튼은 `<button>` + `useNavigate()`다.** `About.module.css:59`가
`.buttonWrapper button` 엘리먼트 선택자를 쓰므로 `<Link>`(=`<a>`)로 바꾸면 타이틀바
신호등 스타일이 깨진다.

**`about.tsx`의 `className={`aboutPage ${styles.main}`}`에서 `aboutPage`는 전역
클래스다.** CSS Modules 클래스가 아니라 `global.css`의 `.aboutPage *::selection`이 걸려
있다. 지우면 텍스트 선택 하이라이트 색이 조용히 사라진다.

**이력서 테이블의 행 머리는 `<th scope='row'>`이고 `About.module.css`의
`th[scope='row']` 선택자와 짝이다.** 마크업과 CSS 중 한쪽만 바꾸면 레이아웃이 깨진다.
`th`의 UA 기본 `text-align: center`를 CSS의 `text-align: left`가 상쇄하고 있다.

**새로 추가하는 색은 `global.css`의 CSS 변수를 쓴다** (`--color`, `--bg`, `--point-color`,
`--point-color-hover`, `--point-color-selection`, `--border-color`). 다만 기존 코드에는
하드코딩된 색이 많이 남아 있고, 대부분은 의도된 것이다 — `About.module.css`의 macOS
타이틀바·신호등 버튼 색과 `Home.module.css`의 랜딩 타이포 색은 토큰화 대상이 아니다.
시키지 않은 색 리팩터링을 시작하지 마라.

**`dangerouslySetInnerHTML`이 `/about`에 두 군데 있다.** `resume.json`의 문자열에
HTML 태그를 허용하기 위한 것이다. 데이터가 저장소 안의 직접 작성한 콘텐츠일 때만 성립하는
전제이므로, 외부 입력을 이 경로에 연결하지 않는다.

**스크린샷 베이스라인은 `tests/pages.spec.ts-snapshots/`에 커밋되어 있고 macOS(darwin)
기준이다.** 의도적으로 화면을 바꿨다면 diff 이미지를 육안으로 확인한 뒤
`pnpm build && pnpm exec playwright test --update-snapshots`로 갱신해서 함께 커밋한다.

## 컨벤션

- 커밋은 [Conventional Commits](https://www.conventionalcommits.org). commit-msg 훅과 CI
  양쪽에서 commitlint가 강제하며, CI는 PR의 모든 커밋을 검사한다. 메시지는 직접 형식에 맞춰
  써라 — `pnpm commit`(Commitizen)은 대화형 프롬프트라 사람용이다.
- 포매팅은 Prettier가 전담한다. ESLint는 포매팅 규칙을 갖지 않는다
  (`eslint-config-prettier`로 충돌 규칙을 꺼 둔다).
- pre-commit에서 lint-staged가, commit-msg에서 commitlint가 husky를 통해 돈다.

## 버전이 최신이 아닌 이유

- **TypeScript 6.0.3** (최신 7.x): `typescript-eslint`가 TS 7.0에서 실행을 거부한다.
  상류 지원이 붙으면 renovate가 PR을 올린다. 올리지 말 것.
- **ESLint 9.39.5**: 원래 핀 근거였던 `eslint-config-next`는 TanStack Start 이전과 함께
  제거됐다. 10 승격이 가능해졌을 수 있으나 별도 작업으로 남겨 두었다 (기술 부채 참고).

배경은 `docs/superpowers/specs/2026-08-10-stack-modernization-design.md`와
`docs/superpowers/specs/2026-08-17-tanstack-start-migration-design.md` 참고.

## 기술 부채

기능 개선 전 기반 정비(2026-08)와 TanStack Start 이전(2026-08) 때 범위 밖으로 남긴
것들이다. **이 목록이 정본이다** — 설계 문서에도 같은 목록이 있지만 그건 작성 시점의
스냅숏이다.

- `src/routes/about.tsx`가 200줄 단일 컴포넌트다. 섹션별로 쪼갠다. 인터랙션을 쌓을 때
  자연스럽게 다룰 문제다.
- `resume.json`에 타입 정의가 없다. 구조적 추론에만 기대고 있다.
- "최종 수정" 날짜가 `src/routes/about.tsx`에 하드코딩되어 있다. `resume.json`으로
  옮기면 이력서 수정이 JSON 한 파일로 닫힌다.
- Playwright 테스트가 CI에 연결되어 있지 않다. 스크린샷 베이스라인이 darwin 기준이라
  ubuntu 러너에서 그대로 못 쓴다. 연결하려면 리눅스 베이스라인 생성이 먼저다.
- ESLint 10 승격 — `eslint-config-next` 제거로 막던 근거는 사라졌다. `typescript-eslint`
  등 나머지 체인의 지원을 확인하고 별건으로 올린다.
- OG 이미지가 없다.
- `__root.tsx` `head()`의 description이 같은 말을 반복하는 키워드 나열이다. 다시 쓸
  가치가 있다.
````

- [ ] **Step 2: `README.md` 부분 수정 (4곳)**

1. 기술 스택 절의 `- [Next.js](https://nextjs.org) (App Router) / React` →
   `- [TanStack Start](https://tanstack.com/start) (Vite + Nitro 정적 프리렌더) / React`
2. 명령어 표의 `pnpm commit` 행 아래에 행 추가:
   `| \`pnpm test\` | Playwright 테스트 (사전 \`pnpm build\` 필요) |`
3. 디렉터리 구조 코드 블록의 `├── app/          라우트. layout.tsx가 루트 셸, page.tsx가 각 화면` →

   ```
   ├── routes/       파일 기반 라우트. __root.tsx가 루트 셸
   ├── router.tsx    라우터 팩토리 (routeTree.gen.ts는 자동 생성)
   ```

4. 이력서 내용 수정 절의 `` `src/app/about/page.tsx`에 하드코딩되어 있어 `` →
   `` `src/routes/about.tsx`에 하드코딩되어 있어 ``

- [ ] **Step 3: `package.json`의 `keywords`에서 `"nextjs"` → `"tanstack-start"`**

- [ ] **Step 4: 문서와 실제가 맞는지 교차 확인**

CLAUDE.md가 언급하는 경로·명령이 실제로 존재하는지 훑는다:

```bash
ls src/router.tsx src/routeTree.gen.ts src/routes/__root.tsx src/routes/index.tsx src/routes/about.tsx tests/pages.spec.ts
grep -n 'lastUpdatedAt' src/routes/about.tsx
grep -n 'buttonWrapper button' src/styles/About.module.css
grep -n 'aboutPage \*::selection' src/styles/global.css
```

Expected: 전부 존재/일치.

- [ ] **Step 5: 커밋**

```bash
pnpm format
pnpm format:check
git add CLAUDE.md README.md package.json
git commit -m "docs: update project docs for tanstack start"
```

---

### Task 11: 마무리 — 기준선 철거, 전체 검증, 육안 대조

**Files:**

- Delete: `docs/baseline/` (커밋된 디렉터리 — README, 스냅숏 2개, `normalize.mjs`)
- Modify: `.prettierignore` (`docs/baseline` 블록 제거)

- [ ] **Step 1: 기준선 철거**

**Task 6·7이 전부 통과한 뒤에만 한다.** 지우고 나면 되돌릴 수 없다.

`.prettierignore`에서 아래 두 줄을 지운다:

```
# 마이그레이션 검증용 HTML 스냅숏. 바이트 그대로 보존해야 하므로 포맷하지 않는다
docs/baseline
```

그리고:

```bash
git rm -r docs/baseline
git add .prettierignore
pnpm format:check
git commit -m "chore: drop migration baseline scaffolding"
```

- [ ] **Step 2: 완료 기준 전체 실행**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

Expected: 전부 통과. 이것이 스펙의 완료 기준 + 테스트다.

- [ ] **Step 3: 육안 대조 (검증 3)**

`pnpm dev`를 띄우고 브라우저에서 확인한다. 가능하면 Playwright MCP나 Chrome 도구로 직접 보고, 안 되면 사용자에게 확인을 요청한다. 체크리스트:

- `/`: ㅊ·ㅎ·ㄴ 타이포 3색, ㅊ 클릭 → `/about` 이동, ㅎ 클릭 → 블로그 새 탭, 푸터 연도
- `/about`: 이력서 전체 렌더, `<details>` 전부 열린 초기 상태
- **텍스트 선택 하이라이트**: `/about` 본문을 드래그하면 `--point-color-selection` 파란 배경 (`.aboutPage *::selection` — 전역 클래스가 살아 있다는 증거)
- **타이틀바 신호등 호버**: 빨강·노랑·초록 버튼에 호버하면 어두운 색으로 변함, 닫기 → `/`, 최소화 → 전체 토글
- 이력서 테이블: 행 머리(`Contact`, `기간` 등)가 왼쪽 정렬 + 굵게 (th 전환 후에도 이전과 동일)

- [ ] **Step 4: 저장소 밖 작업 안내 (사용자에게 보고)**

계획 실행자가 할 수 없는 일이므로 최종 보고에 명시한다:

> Vercel 대시보드의 Framework Preset이 Next.js로 고정돼 있으면 자동 감지가 걸리지 않을 수 있다. 이 브랜치의 첫 프리뷰 배포에서 `/`와 `/about`이 뜨는지 확인하고, 안 뜨면 Project Settings → Framework Preset을 확인해 달라 (TanStack Start 자동 감지 또는 수동 지정).

---

## 커밋 요약 (분할 지점)

| #     | 커밋                                                                    | 시점                      |
| ----- | ----------------------------------------------------------------------- | ------------------------- |
| ~~1~~ | ~~`chore: capture pre-migration HTML baseline`~~ — **완료 (`3e2c990`)** | Next 제거 전              |
| 2     | `test: add playwright screenshot and interaction tests`                 | Next 제거 전 (베이스라인) |
| 3     | `refactor: make eslint config framework-agnostic`                       | Next 제거 전              |
| 4     | `feat: migrate from next.js to tanstack start`                          | 전환 본체                 |
| (4b)  | `test: rebaseline screenshots after tanstack start migration`           | Task 7에서 근거 있을 때만 |
| 5     | `fix: use th for resume table row headers`                              | HTML diff 통과 후         |
| 6     | `refactor: replace hardcoded point color with token`                    |                           |
| 7     | `feat: add robots.txt and sitemap.xml`                                  |                           |
| 8     | `docs: update project docs for tanstack start`                          |                           |
| 9     | `chore: drop migration baseline scaffolding`                            | 마지막                    |

모든 커밋 시점에서 `pnpm type-check && pnpm lint && pnpm format:check && pnpm build`가 그린이어야 한다 (CI가 PR의 모든 커밋 메시지를 검사하고, 훅이 커밋마다 돈다).
