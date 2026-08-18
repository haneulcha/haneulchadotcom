# Next.js → TanStack Start 마이그레이션 설계

- 작성일: 2026-08-17
- 대상: `haneulchadotcom` (개인 포트폴리오)
- 상태: **설계 확정, 미실행**

## 배경

2026-08 스택 현대화([2026-08-10 설계](./2026-08-10-stack-modernization-design.md))로 Next.js 16
App Router 기반 정비를 마쳤다. 그 위에서 프레임워크 이전을 다시 검토한 이유는 **앞으로 이 사이트에
페이지 전반에 걸친 인터랙티브 요소를 다수 추가할 계획**이 생겼기 때문이다.

이 계획이 판단을 바꾼다. 상태가 라우트를 가로질러 살아있고 서로 떨어진 요소들이 같은 상태에 반응하는
형태라면, 지금 구조에서 두 가지가 어긋난다.

- **RSC의 이득을 못 쓴다.** 이 사이트는 서버 데이터 페칭·인증·API 라우트가 전부 없다. 서버 기능을
  쓰지 않으면서 서버/클라이언트 경계 비용만 낸다. 실제로 `/about`은 이미 파일 전체가 `'use client'`다.
- **지금이 가장 싼 시점이다.** 인터랙티브 코드가 아직 한 줄도 없다. React 컴포넌트를 쌓은 뒤에
  옮기면 비용이 몇 배가 된다.

Astro도 후보였으나 탈락했다. Astro islands는 "정적 본문 + 국소적 위젯"에 맞는 구조다. 페이지 대부분이
인터랙티브해지면 섬 간 상태 공유에 별도 스토어가 필요하고 라우트 전환에서 상태가 유실된다. 결국
"페이지 전체가 하나의 거대한 섬"이 되어 React를 더 불편하게 쓰는 결과가 된다.

## 목표와 비목표

**목표**: 기존 두 라우트의 동작과 시각적 결과를 보존한 채 TanStack Start로 이전하고, 앞으로 쌓을
인터랙션의 토대를 만든다.

**비목표**: 인터랙티브 기능 자체의 구현. 이번 작업에 새 기능은 없다. 디자인 변경도 없다.

## 현재 Next 의존 표면

이전 비용 산정의 근거다. 전체 904줄 중 Next에 묶인 곳은 네 군데뿐이다.

| 사용처                 | 위치                            |
| ---------------------- | ------------------------------- |
| `next/link`            | `src/app/page.tsx:1,10`         |
| `useRouter().push`     | `src/app/about/page.tsx:3,9,24` |
| `metadata` export      | `src/app/layout.tsx:6-12`       |
| App Router 파일 라우팅 | 라우트 2개                      |

서버 기능은 하나도 쓰지 않는다. route handler, middleware, `next/image`, `next/font`, ISR,
서버 액션, 데이터 페칭이 전부 없다. `next.config.ts`는 `reactStrictMode: true` 한 줄이다.

**옮길 서버 로직이 없다는 점이 이 마이그레이션을 쉽게 만든다.**

## 범위

### 포함

#### 1. 라우트 구조

```
src/app/layout.tsx        →  src/routes/__root.tsx
src/app/page.tsx          →  src/routes/index.tsx
src/app/about/page.tsx    →  src/routes/about.tsx
                             src/routeTree.gen.ts  (자동 생성, 커밋한다)
```

`src/contents/`와 `src/styles/`는 **건드리지 않는다** (아래 접근성·색 토큰 수정 제외). CSS 532줄과
`resume.json` 142줄은 그대로다. Vite가 CSS Modules와 JSON import를 네이티브로 처리한다.

#### 2. API 치환

| 현재                      | 이후                                           |
| ------------------------- | ---------------------------------------------- |
| `next/link` `<Link href>` | `@tanstack/react-router` `<Link to>`           |
| `useRouter().push('/')`   | `useNavigate()({ to: '/' })`                   |
| `export const metadata`   | `__root.tsx`의 `head: () => ({ meta, links })` |

JSX 본문은 그대로 옮겨진다. `dangerouslySetInnerHTML` 두 곳도 React이므로 변경 없다.

> **닫기 버튼은 `<button>`으로 유지한다.** `About.module.css:59`가 `.buttonWrapper button`으로
> 엘리먼트 선택자를 쓴다. `<Link>`(=`<a>`)로 바꾸면 타이틀바 신호등 스타일이 깨진다. 그래서
> `<Link>`가 아니라 `useNavigate()`를 쓴다.

#### 3. 렌더링과 배포

두 라우트를 정적 HTML로 프리렌더한다. 결과물은 지금과 같은 정적 사이트이되, 서버 함수가 필요해지면
그때 열 수 있는 상태로 남는다.

```ts
// vite.config.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    tanstackStart({ prerender: { enabled: true } }),
    nitro(),
    viteReact(),
  ],
});
```

Vercel은 Nitro와 함께 TanStack Start를 자동 감지한다.

> **저장소 밖 작업**: Vercel 대시보드의 Framework Preset이 Next.js로 고정돼 있을 수 있다.
> 자동 감지가 걸리지 않으면 수동 변경이 필요하다. 첫 프리뷰 배포에서 확인한다.

#### 4. 툴체인

- **제거**: `next`, `eslint-config-next`, `next.config.ts`, `next-env.d.ts`
- **추가**: `@tanstack/react-router`, `@tanstack/react-start`, `nitro`, `vite`, `@vitejs/plugin-react`
- **경로 별칭**: `@/*` → `src/*`, `@/public/*` → `public/*`를 `tsconfig.json`과 Vite `resolve.alias`
  양쪽에 유지한다. 현재 값과 동일하게 동작해야 한다.
- **스크립트**: `dev`/`build`/`type-check`/`lint`/`format` 이름을 그대로 둔다. CI(`ci.yml`)가 이
  이름들을 부르므로 워크플로 수정이 필요 없다.

> **ESLint 재구성은 선택이 아니다.** `eslint-config-next`가 빠지면 `pnpm lint`가 죽고 CI가 실패한다.
> `typescript-eslint` + `eslint-plugin-react-hooks` 기반으로 flat config를 다시 짠다. 이건
> 마이그레이션의 필수 경로에 있다.

#### 5. 문서 갱신 (필수)

`CLAUDE.md`는 Next.js를 전제로 쓰여 있고 스스로를 기술 부채 목록의 **정본**이라 선언한다.
마이그레이션과 함께 갱신하지 않으면 즉시 거짓말이 된다. 갱신 대상:

- 「명령어」절 — `next dev`/`next build` 기준 설명
- 「구조」절 — `src/app/` 트리 전체
- 「알아둘 것」절 — `/about`이 클라이언트 컴포넌트라는 설명, `about/page.tsx:42` 줄 번호 참조
- 「버전이 최신이 아닌 이유」절 — ESLint 핀 근거(`eslint-config-next`)가 사라진다.
  TypeScript 핀은 남는다
- 「기술 부채」절 — 이번에 해소한 항목 제거, 남은 항목 유지

`README.md`와 `package.json`의 `keywords`(`"nextjs"`)도 함께 본다.

#### 6. 함께 처리하는 기술 부채

마크업을 어차피 다시 쓰므로 자연스럽게 딸려오는 것들만 포함한다.

- `<td scope="row">` → `<th scope="row">`. `About.module.css`의 `td[scope='row']`와
  `td:nth-of-type(2)` 선택자를 **동반 수정한다.** 한쪽만 바꾸면 레이아웃이 깨진다.
- `About.module.css:168`의 `#0550ae` → `var(--point-color)` (같은 값이다).
- `public/robots.txt`, `public/sitemap.xml`을 정적 파일로 추가.

### 제외 (후속 작업으로 남김)

- 인터랙티브 기능 구현 — 이번 마이그레이션의 목적은 토대를 놓는 것까지다.
- OG 이미지
- `resume.json` 타입 정의
- "최종 수정" 날짜의 `resume.json` 이전 (현재 `about/page.tsx:42` 하드코딩)
- `layout.tsx` description 재작성
- ESLint 10 승격 — `eslint-config-next` 제거로 핀 근거는 사라지지만 별건으로 다룬다.
  TypeScript 6 핀은 `typescript-eslint` 때문이므로 **그대로 남는다.**
- `about.tsx` 200줄 단일 컴포넌트 분할 — 인터랙션을 쌓을 때 자연스럽게 다룰 문제다.

## 검증

테스트가 없는 상태에서 마크업과 CSS를 건드린다. 세 겹으로 잡는다.

1. **HTML 스냅숏 diff.** 마이그레이션 착수 전 현재 Next 빌드의 `/`와 `/about` HTML을 받아둔다.
   TSS 프리렌더 결과와 DOM 구조를 비교한다. 해시된 CSS Modules 클래스명은 정규화한다.
   구조적 회귀를 정확히 잡는다.
2. **Playwright 스크린샷 회귀 테스트.** 두 라우트의 스크린샷 테스트를 새로 깐다. 기술 부채의
   "테스트가 없다"를 함께 해소하고, 앞으로 인터랙션을 쌓을 토대가 된다. `<details>` 전체 토글
   동작도 함께 커버한다.
3. **육안 대조.** dev 서버로 두 페이지를 직접 확인한다. 특히 텍스트 선택 하이라이트
   (`global.css:59`의 `.aboutPage *::selection`)와 타이틀바 신호등 호버.

`pnpm type-check`, `pnpm lint`, `pnpm format:check`, `pnpm build`가 전부 통과해야 한다.

## 리스크

| 리스크                                           | 대응                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `.aboutPage` 전역 클래스 유실                    | CSS Modules 클래스가 아니다. 문자열 그대로 유지, 검증 3에서 확인 |
| `<th scope>` 전환 시 테이블 레이아웃 파손        | CSS 선택자 동반 수정 필수. 검증 1·2가 잡는다                     |
| Vercel Framework Preset 고정                     | 프리뷰 배포로 조기 확인. 저장소 밖 수동 작업일 수 있음           |
| ESLint 재구성이 기존 규칙과 어긋남               | 마이그레이션 필수 경로. CI 통과를 완료 기준으로 삼는다           |
| `<details open>` 초기 상태가 SSR/수화에서 어긋남 | Playwright 테스트로 토글 동작 커버                               |

## 참고

- [TanStack Start Static Prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- [2026-08-10 스택 현대화 설계](./2026-08-10-stack-modernization-design.md)
