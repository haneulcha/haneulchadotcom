# CLAUDE.md

차하늘의 개인 웹사이트(haneulcha.com). 랜딩 화면과 이력서 화면 두 개로 이루어진
정적 사이트이며 Vercel에 배포된다.

**수영장 랜딩은 폐기됐다** (2026-08-26). Three.js 시각 층을 먼저 걷어냈고
(`docs/superpowers/specs/2026-08-19-pool-canvas-postmortem.md`), 남은 DOM 층도
프로덕션에서 되돌려 `ㅊㅎㄴ` 랜딩으로 복귀했다. 설계·계획·실패 기록은 `docs/`에
남아 있다 — 다시 시도하기 전에 postmortem을 먼저 읽어라.

## 명령어

```bash
pnpm dev           # 개발 서버 (http://localhost:3000)
pnpm build         # 프로덕션 빌드 + 두 라우트 정적 프리렌더 → .output/
pnpm start         # 빌드 결과물 실행 (node .output/server/index.mjs)
pnpm type-check    # tsc
pnpm lint          # eslint (flat config)
pnpm format        # prettier --write .
pnpm format:check  # CI가 쓰는 검사 모드
pnpm test          # playwright. 먼저 pnpm build가 되어 있어야 한다
```

**`pnpm build`는 타입 검사를 겸하지 않는다.** `vite build`는 타입을 보지 않으므로
`pnpm type-check`가 실질적인 게이트다. (Next 시절에는 빌드가 타입 검사를 겸했다.)

패키지 매니저는 **pnpm**이다 (`packageManager` 필드에 고정). npm이나 yarn을 쓰지 않는다.
Node는 `.nvmrc`의 22를 따른다.

## 구조

```
src/
├── routes/
│   ├── __root.tsx        루트 문서. <html lang="ko">, head(), global.css,
│   │                      첫 페인트 전 .dark를 붙이는 인라인 스크립트
│   ├── index.tsx         / — 랜딩
│   └── about.tsx         /about — 이력서
├── router.tsx            라우터 생성 (getRouter export)
├── routeTree.gen.ts      자동 생성. 커밋하되 직접 수정하지 않는다
├── components/
│   ├── ColorBar.tsx       색 토큰 띠. __root.tsx에 있어 두 라우트 모두에 뜬다
│   ├── ThemeToggle.tsx    시스템/라이트/다크 3순환 토글. 마찬가지로 두 라우트 모두
│   └── about/             /about 전용 컴포넌트
│       ├── TitleBar.tsx        macOS 타이틀바 + 신호등 버튼
│       ├── ExperienceItem.tsx
│       ├── JobSection.tsx
│       ├── PortfolioItem.tsx
│       ├── LanguageList.tsx
│       └── classes.ts          반복되는 Tailwind 클래스 문자열 상수
├── contents/
│   ├── resume.json       이력서의 단일 데이터 소스 (최종 수정일 포함)
│   └── types.ts + resume.ts           타입과 재수출 모듈
├── lib/
│   └── theme.ts           다크 판정 규칙(resolveDark)과 첫 페인트 인라인
│                           스크립트(THEME_INIT_SCRIPT)를 한 파일에 둔다
└── styles/
    ├── global.css         리셋 + Tailwind import + dark: variant 재정의
    └── palette.theme.css  생성물. 팔레트 토큰(--color-{scale}-{role}), 직접 고치지 않는다
```

경로 별칭은 `@/*` → `src/*`, `@/public/*` → `public/*`. **`tsconfig.json`과
`vite.config.ts` 양쪽에 있으므로 바꿀 때 둘 다 고쳐야 한다.** `vite.config.ts`의 alias
배열은 순서가 중요하다 — `@/public`이 `@`보다 앞에 와야 한다.

## 알아둘 것

**이력서 내용은 `src/contents/resume.json`에서 고친다.** `/about`은 이 JSON을 그대로
렌더하므로 항목을 추가·수정할 때 컴포넌트 구조를 손댈 일은 없다. 이력서 수정은
`resume.json` 한 파일로 닫힌다 ("최종 수정" 날짜는 `lastUpdatedAt` 필드).

**`resume.json` 안의 HTML 문자열은 속성에 작은따옴표를 쓴다** (`<a href='...'>`).
JSON 문자열 안이라 큰따옴표를 쓰면 이스케이프해야 한다. 기존 관례를 따라라.

**`package.json`의 `"type": "module"`을 지우지 마라.** 없으면 `vite.config.ts`가 CJS로
취급되고, ESM 전용인 `@tanstack/react-start/plugin/vite` 로드에 실패해 빌드가 죽는다.

**`TitleBar`의 닫기 버튼은 `<button>`이어야 한다.** `tests/pages.spec.ts`가
`page.locator('nav button')`으로 신호등을 찾기 때문에 `<Link>`(=`<a>`)로 바꾸면
상호작용 테스트 두 개가 깨진다. 그래서 라우팅에 `<Link>`가 아니라
`useNavigate()`를 쓴다. (Tailwind 이전 전에는 이유가 달랐다 —
`.buttonWrapper button` 엘리먼트 선택자였다.)

**`global.css`의 리셋은 `@layer base` 안에 있다. 밖으로 꺼내지 마라.** CSS
캐스케이드에서 비레이어 선언은 레이어 선언을 특정도와 무관하게 이긴다. 리셋이
비레이어로 돌아가면 `button { all: unset }`이 모든 Tailwind 유틸리티를 이겨
신호등 버튼이 사각형이 되고, 전역 `::selection`이 `selection:` 유틸리티를
이겨 선택 하이라이트가 조용히 바뀐다.

**Tailwind는 preflight 없이 쓴다.** `global.css`가 이미 리셋을 갖고 있어
겹치면 기존 렌더가 흔들린다. Tailwind 쪽에서는 `tailwindcss/theme.css`와
`tailwindcss/utilities.css`만 가져온다 — `tailwindcss`를 통째로 불러오면
같이 딸려 오는 preflight를 피하는 방법이다. (팔레트 토큰인
`palette.theme.css`는 이 둘과 별개로 바로 뒤에서 import한다.)

**`global.css`에 자손 선택자가 하나 더 있다** (`.resumeHtml a`).
`resume.json`의 HTML 문자열이 `dangerouslySetInnerHTML`로 들어가는 두 자리의
링크를 잡는다. 그 노드는 React가 만든 것이 아니라 JSX에서 `className`을 붙일 수
없다. 이력서 링크를 JSON에 두는 편의를 지키기로 한 결정의 대가다. 색은
`var(--color-accent-text)`(호버 시 `--color-accent-text-strong`)로 토큰을 가리킨다.

**Tailwind v4의 `max-[Npx]:`는 `width < Npx`(배타)로 컴파일된다.** CSS의
`max-width: Npx`는 Npx를 포함(포괄)하므로 그대로 옮기면 정확히 그 픽셀에서
동작이 어긋난다. `about.tsx`와 `classes.ts`의 `max-[1025px]:`·`max-[321px]:`
같은 N+1 패턴은 이 어긋남을 상쇄하려고 일부러 한 픽셀 올려 쓴 것이다.

**`global.css`의 유틸리티 import는 `source('..')`를 달고 있다.** 기본 자동
탐지가 저장소 전체(`docs/`의 예시 클래스 문자열까지)를 훑는 것을 막아 `src`만
스캔하도록 좁힌 것이다. `global.css`가 다른 위치로 옮겨지거나 두 번째 CSS
진입점이 생기면 이 상대 경로가 조용히 깨진다.

**새로 추가하는 색은 `src/styles/palette.theme.css`의 팔레트 토큰을 쓴다**
(`--color-{scale}-{role}`, 예: `--color-accent-solid`, `--color-neutral-text-strong`).
이 파일은 [design-system-starter](https://github.com/haneulcha/design-system-starter)가
생성한 산출물이라 직접 고치지 않는다 — 팔레트를 다시 뽑아 통째로 덮어쓴다
(`.prettierignore`에도 그래서 올라가 있다). 기존 6개 CSS 변수(`--color`, `--bg`,
`--point-color` 등)는 이 토큰 체계로 완전히 대체됐다. 다만 `TitleBar.tsx`의 macOS
타이틀바·신호등 버튼 색과 `about.tsx` 창 테두리·그림자 색은 여전히 하드코딩이고
의도된 것이다 — 토큰화 대상이 아니다. 시키지 않은 색 리팩터링을 시작하지 마라.

**다크 모드는 `<html>`의 `.dark` 클래스로 구동된다.** `palette.theme.css`가
`.dark` 선택자를 하드코딩하므로(생성물이라 못 바꾼다) 클래스를 붙이는 쪽만
우리가 맡는다. `src/lib/theme.ts`가 판정 규칙(`resolveDark`)과 첫 페인트 인라인
스크립트(`THEME_INIT_SCRIPT`)를 **한 파일에** 갖고 있다 — 갈라지면 첫 페인트와
이후 동작이 어긋난다.

**`__root.tsx`의 `<head>`에 인라인 스크립트가 있다. 지우지 마라.** 첫 페인트
전에 `.dark`를 결정하지 않으면 다크 사용자가 흰 화면을 한 번 보고 깜빡인다.
라우터의 `headScripts`를 쓰지 않는 것은 그쪽이 하이드레이션 후 DOM을 다시
만지기 때문이다. (렌더된 HTML에서 이 스크립트가 실제로 어디 놓이는지는
`__root.tsx`의 주석을 봐라 — JSX 순서와 다르다.)

**`dark:` 유틸리티도 `.dark` 클래스를 따르도록 `@custom-variant`로 바꿔 뒀다.**
Tailwind 기본값은 `prefers-color-scheme`이라, 그대로 두면 팔레트(클래스 기반)와
크롬 색(미디어 쿼리 기반)이 서로 다른 신호를 따라 갈라진다.

**컬러 바(`ColorBar.tsx`)는 hex를 박지 않고 `var(--color-…)`를 그린다.** 팔레트를
다시 뽑거나 테마를 바꾸면 띠가 자동으로 맞는다. 이 성질이 깨지면 띠는 팔레트의
그림일 뿐 팔레트가 아니게 된다. 띠를 누르면 `/about#design-system` —
이력서 개인 프로젝트의 `design-system-starter` 항목 — 으로 이동한다.

**`dangerouslySetInnerHTML`이 `/about`에 두 군데 있다.** `resume.json`의 문자열에
HTML 태그를 허용하기 위한 것이다. 데이터가 저장소 안의 직접 작성한 콘텐츠일 때만 성립하는
전제이므로, 외부 입력을 이 경로에 연결하지 않는다.

**라우트를 추가하면 `public/sitemap.xml`도 갱신한다.** 생성기를 붙이지 않고 정적 파일로
관리한다.

## 테스트

`tests/pages.spec.ts`가 Playwright로 두 라우트의 스크린샷과 상호작용(`<details>` 전체 토글,
닫기 버튼 내비게이션)을 검사한다. 기준선은 **네 장**이다 — 라이트/다크 × 랜딩/이력서
(`landing.png`, `landing-dark.png`, `about.png`, `about-dark.png`). 다크는
`page.emulateMedia({ colorScheme: 'dark' })` 같은 에뮬레이션이 아니라
`document.documentElement.classList.add('dark')`로 직접 클래스를 붙여 찍는다 —
팔레트가 `.dark` 클래스로 동작하므로 실제 경로를 지나야 한다. 기준선 PNG는
`tests/pages.spec.ts-snapshots/`에 커밋돼 있다.

`tests/tailwind-setup.spec.ts`는 스크린샷으로 못 잡는 것 두 가지를 따로 검사한다. 하나는
랜딩 'ㅊ'의 computed color가 `text-accent-solid` 유틸리티 값(`rgb(250, 134, 46)`,
팔레트의 `--color-accent-500`)과 같은지 확인해 Tailwind 유틸리티가 `?url` 스타일시트를
통해 실제로 페이지에 닿는지를 본다. 다른 하나는 `document.styleSheets`를 직접 순회해
리셋이 `@layer base` 안에 있는지 확인한다 — 위 "`@layer base` 밖으로 꺼내지 마라" 경고가
가리키는 바로 그 회귀를 잡는 테스트다. 전역 `::selection`이 비레이어 리셋에 밀려나는
사고는 텍스트를 드래그해 선택하는 테스트가 없는 한 스크린샷에 안 잡히므로, 이 테스트가
그 회귀의 유일한 방어선이다.

- **`pnpm test` 전에 `pnpm build`가 필요하다.** 빌드 결과물을 서빙해서 검사한다.
- 기준선은 **darwin 전용**이다. 다른 OS에서는 스크린샷이 어긋나므로 CI에 붙어 있지 않다.
- 스크린샷이 실패하면 먼저 diff 이미지를 보고 **의도한 변경인지 확인한 뒤에만**
  `--update-snapshots`로 다시 뜬다. 근거 없이 재생성하면 회귀를 정상으로 굳힌다.

## 컨벤션

- 커밋은 [Conventional Commits](https://www.conventionalcommits.org). commit-msg 훅과 CI
  양쪽에서 commitlint가 강제하며, CI는 PR의 모든 커밋을 검사한다. 메시지는 직접 형식에 맞춰
  써라 — `pnpm commit`(Commitizen)은 대화형 프롬프트라 사람용이다.
- 포매팅은 Prettier가 전담한다. ESLint는 포매팅 규칙을 갖지 않는다
  (`eslint-config-prettier`로 충돌 규칙을 꺼 둔다).
- pre-commit에서 lint-staged가, commit-msg에서 commitlint가 husky를 통해 돈다.

## 모델 분담

Fable5는 판단과 설계와 품질 게이트에 충실하며, 리서치는 Sonnet, 구현은 Opus, 기계 작업은
하위 모델에게 위임한다.

## 버전이 최신이 아닌 이유

**TypeScript 6.0.3** (최신 7.0.2): `typescript-eslint`가 TS 7.0에서 실행을 거부한다.
상류 지원이 붙으면 renovate가 PR을 올린다.

ESLint는 더 이상 고정 대상이 아니다. 핀의 원인이던 `eslint-config-next`를 제거했고,
남은 세 패키지(`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`)는
전부 `eslint ^10`을 peer로 허용한다. 9.39.5에 머물 이유가 없으니 10 승격은 별건으로 다룬다.

`nitro`는 `3.0.260610-beta`다. Vercel 배포 경로가 요구하는 버전이라 베타지만 그대로 쓴다.

배경은 `docs/superpowers/specs/`의 설계 문서 두 편을 참고.

## 기술 부채

**이 목록이 정본이다** — 설계 문서에도 비슷한 목록이 있지만 그건 작성 시점의 스냅숏이다.

- Playwright 기준선이 darwin 전용이라 CI에 붙어 있지 않다. CI에서 돌리려면 리눅스
  기준선을 함께 만들거나 컨테이너로 렌더 환경을 고정해야 한다.
- OG 이미지가 없다.
- 랜딩이 다시 `ㅊㅎㄴ` 세 글자다. 컬러 바가 `/about#design-system`으로는 이어주지만,
  사이트가 살아있는 위성(pourover.work, blog.haneulcha.com, jecheori)은 여전히 어디서도
  가리키지 않는다 — 수영장 랜딩이 풀려던 문제가 부분적으로만 해소됐다.
- `__root.tsx`의 description이 같은 말을 반복하는 키워드 나열이다. 다시 쓸 가치가 있다.
