# 포트폴리오 스택 현대화 설계

- 작성일: 2026-08-10
- 대상: `haneulchadotcom` (개인 포트폴리오)
- 브랜치: `chore/modernize-stack`

## 배경

마지막 실질 업데이트는 2022년 7월이다. 그 사이 Next.js는 12에서 16으로, React는 18에서 19로,
ESLint는 설정 형식 자체가 바뀌었다. `.nvmrc`가 가리키는 Node 12.22는 2022년에 이미 EOL이다.

더 근본적인 문제는 레포가 아직 출발점이었던 스타터 템플릿(`jpedroschmitz/typescript-nextjs-starter`)의
껍데기를 쓰고 있다는 것이다. `package.json`의 이름·저자·설명, `README.md` 전문, `LICENSE.md`의
저작권자가 모두 원작자 것이다. 스타터에서만 오고 실제로는 쓰이지 않는 파일도 남아 있다.

기능 개선에 손대기 전에 이 기반을 정리한다.

## 범위

### 포함

| 영역 | 현재 | 목표 |
| --- | --- | --- |
| Next.js | 12.1.6 (Pages Router) | 16.x (App Router) |
| React | 18.1.0 | 19.x |
| TypeScript | 4.6.4 | 7.0.x |
| 패키지 매니저 | Yarn 1 | pnpm |
| Node | 12.22 | 22 LTS |
| ESLint | 8 (`.eslintrc`) | 10 (flat config) |
| Prettier | 2 | 3 |
| husky | 8 | 9 |
| lint-staged | 12 | 17 |
| commitlint | 17 | 21 |

여기에 더해 레포 정체성 복구(메타데이터·README·LICENSE·스타터 잔재 제거)와 `CLAUDE.md` 작성.

### 제외 (후속 작업으로 남김)

- 테스트 인프라 구축 (Vitest / Playwright)
- `about.tsx` 컴포넌트 분리 및 접근성 개선
- SEO 메타 확장 (OG 이미지, sitemap, robots)
- Tailwind 등 스타일링 스택 교체 — CSS Modules를 유지한다

App Router는 `next/head`를 지원하지 않으므로 기존 `<Head>`의 title·description을 `metadata`
export로 옮기는 작업은 전환의 필수 부산물로 포함한다. 그 이상의 SEO 확장은 하지 않는다.

## 설계

### App Router 전환

| 현재 | 이후 | 비고 |
| --- | --- | --- |
| `src/pages/_app.tsx` | `src/app/layout.tsx` | `<html lang="ko">`, `global.css` import, 공통 metadata |
| `src/pages/index.tsx` | `src/app/page.tsx` | 서버 컴포넌트. `<Head>` → `metadata`, `<Link><a>` 패턴 제거 |
| `src/pages/about.tsx` | `src/app/about/page.tsx` | `'use client'`. `next/router` → `next/navigation` |
| `src/pages/api/hello.ts` | 삭제 | 스타터 잔재 |

`<Link>` 안에 `<a>`를 중첩하는 패턴은 Next 13에서 제거되었으므로 반드시 고쳐야 한다.

`about.tsx`는 `useRouter`와 `document.querySelectorAll`을 사용하므로 클라이언트 컴포넌트여야 한다.
정석은 타이틀바 버튼만 별도 클라이언트 컴포넌트로 분리하고 본문은 서버 컴포넌트로 두는 것이지만,
리팩터링을 이번 범위에서 제외했으므로 파일 전체에 `'use client'`를 붙이는 최소 변경으로 간다.
페이지 2개짜리 정적 사이트라 실질적인 손해는 없다. 분리는 기술 부채 목록에 기록한다.

### 툴체인

- **ESLint**: `.eslintrc` → `eslint.config.mjs`. ESLint 9부터 flat config가 필수다.
  현재 `eslint-plugin-prettier`로 포매팅을 lint 규칙으로 돌리는데, 이는 더 이상 권장되지 않는다.
  Prettier는 `pnpm format`으로 분리 실행하고 ESLint는 `eslint-config-prettier`로 충돌 규칙만 끈다.
- **husky 9**: `.husky/_/husky.sh` 소싱 라인 제거. `.husky/common.sh`는 Windows + Yarn
  워크어라운드이므로 pnpm 전환과 함께 삭제. `postinstall: husky install` → `prepare: husky`.
- **tsconfig**: `target` es2015 → ES2022, `moduleResolution` node → bundler, Next TS 플러그인 등록.
  `strict`와 경로 별칭(`@/*`)은 유지.
- **next.config.js → next.config.ts**: Next 15부터 TypeScript 설정 파일을 지원한다.
- **renovate.json**: `config:base`는 deprecated → `config:recommended`.
  `stabilityDays` → `minimumReleaseAge`.
- **CI**: pnpm 셋업 추가, actions 버전 갱신, `pnpm build` 검증 단계 추가.
  현재 워크플로는 type-check와 lint만 돌아서 빌드가 깨져도 CI가 통과한다.

### 정체성 복구

`package.json`의 name·description·author·keywords를 본인 프로젝트 것으로 교체.
`README.md`는 실제 프로젝트 문서로 전면 재작성.

삭제 대상:

- `src/pages/api/hello.ts` — 스타터 예제
- `public/vercel.svg` — 스타터 잔재
- `src/styles/typoEffect.scss` — 어디서도 import되지 않는 죽은 파일이며 `sass` 패키지도 미설치
- `.husky/common.sh` — Windows + Yarn 워크어라운드

**LICENSE 처리**: 원본 스타터는 MIT이고, MIT는 저작권 고지 유지를 조건으로 단다.
마이그레이션 후에도 스타터에서 유래한 설정 파일 일부는 남는다. 따라서 원저작자 고지를 유지한 채
본인 저작권을 병기하고, README에 스타터 출처를 밝힌다.

### CLAUDE.md

담을 내용: 프로젝트 개요 / 스택과 버전 / 디렉터리 구조 / 명령어 / 컨벤션(Conventional Commits,
CSS Modules + CSS 변수 토큰, `@/` 별칭) / `src/contents/resume.json`이 about 페이지의 단일
데이터 소스라는 점 / 알려진 기술 부채 목록.

## 진행 순서

각 단계는 독립적으로 검증 가능한 커밋 단위다.

1. pnpm + Node 22 전환
2. 스타터 잔재 제거 + 정체성 복구
3. Next 16 / React 19 / TS 7 + App Router 전환
4. ESLint flat config + Prettier 3 + husky 9 + lint-staged / commitlint
5. CI + renovate 갱신
6. CLAUDE.md 작성

3번에서 Next 업그레이드와 App Router 전환을 한 덩어리로 묶는 이유는, `eslint-config-next`가
Next 버전과 함께 올라가야 해서 쪼개면 중간 상태에서 lint가 깨지기 때문이다.

## 검증

- `pnpm type-check` · `pnpm lint` · `pnpm build` 전부 통과
- `pnpm dev` 후 `/`와 `/about` 렌더 육안 확인
  - `/`: 세 글자 타이포그래피, `/about` 링크, 외부 블로그 링크
  - `/about`: 이력서 렌더, 닫기 버튼(홈 이동), 최소화 버튼(details 일괄 토글)

## 리스크

**TypeScript 7**은 Go 기반 네이티브 재작성판이라 `typescript-eslint` 및 Next TS 플러그인과의
조합에서 문제가 발생할 수 있다. 3단계에서 툴체인이 깨지면 막히지 않고 5.9로 내린 뒤 그 사실을
보고한다. 이번 작업의 목적은 기반 정비이지 TS 7 디버깅이 아니다.

**Next 12 → 16은 메이저 4개 점프**다. 중간 버전을 거치지 않으므로 예상 못한 breaking change가
나올 수 있다. 페이지가 2개뿐이고 서드파티 의존성이 없어 표면적은 작지만, 단계별 빌드 검증으로
어디서 깨졌는지 특정할 수 있게 한다.

## 기술 부채 (이번 범위 밖, 후속 작업 후보)

- `about.tsx` 200줄 단일 컴포넌트 → 섹션별 분리, 타이틀바만 클라이언트 컴포넌트로
- `resume.json`에 타입 정의 없음 (현재 구조적 타입 추론에만 의존)
- `<table>`에 `tbody` 누락, `<td scope="row">`는 `<th scope="row">`여야 함
- `dangerouslySetInnerHTML` 사용처 2곳 (`resume.json`의 HTML 문자열)
- 테스트 없음
- OG 이미지, sitemap, robots.txt 없음
