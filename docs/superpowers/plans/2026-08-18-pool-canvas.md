# 정오의 풀 캔버스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

- 작성일: 2026-08-18
- 근거 스펙: [2026-08-18 정오의 풀 캔버스 리디자인 설계](../specs/2026-08-18-pool-canvas-design.md) — **설계 확정. 결정을 다시 열지 않는다.** 이 계획의 모든 "왜"는 스펙에 있고, 계획은 "무엇을 어떤 순서로"만 답한다.
- 브랜치: `haneulcha/landing-toy`
- 실행자: **Codex** (CLAUDE.md 「모델 분담」). 이 대화의 맥락 없이 이 문서만 읽고 실행한다. 그래서 모든 결정은 본문에 다시 적혀 있고, 판단이 필요한 지점은 **판단 필요** 로 명시했다 — 그 지점에서 스스로 발명하지 말고 사람/Fable에 확인한다.

**Goal:** 랜딩을 "정오의 실외 자유수영장" 탑다운 풀로 재구축한다 — 부표 8개가 뜬 물, `ㅊ` 아바타, `/p/$id` 창 라우트, View Transition. DOM 층만으로 완결 동작하는 사이트를 먼저 만들고, 그 위에 Three.js 물을 페이즈별로 쌓는다.

**Architecture:** DOM 우선(스펙 「빌드 순서 — DOM이 먼저다」). 페이즈 1이 끝나면 캔버스 없이 배포 가능한 사이트가 존재하고, 그것이 프리렌더 출력·접근성 레이어·WebGL 폴백을 겸한다. Three.js는 lazy import로 그 위에 hydrate된다. 물은 jeantimex/threejs-water(MIT)를 출발점으로 포팅하되, 셰이딩은 Hockney 스타일(시뮬레이션은 진짜, 셰이딩만 그래픽)로 바꾼다. 부표의 심볼·라벨은 캔버스가 아니라 DOM 프록시(`<a>`)다 — 접근성·히트테스트·View Transition·텍스트 렌더링을 한 번에 해결한다.

**Tech Stack:** TanStack Start 1.168 + TanStack Router 1.170(유지), React 19.2.8(유지), Vite 8, CSS Modules, TypeScript 6.0.3(유지), **`three`(신규, Task 5에서 추가)**, Playwright 1.62.

## Global Constraints

모든 태스크에 암묵적으로 적용된다.

- 패키지 매니저는 **pnpm 전용**. 새 의존성은 정확 버전 고정(`pnpm add -E` / `pnpm add -D -E`).
- **`pnpm build`는 타입 검사를 하지 않는다.** `pnpm type-check`가 실질 게이트다. 타입을 건드리는 모든 태스크의 검증에 포함되어 있다 — 생략 금지.
- 커밋은 **Conventional Commits**(commitlint가 commit-msg 훅과 CI에서 강제). 제목은 기존 히스토리처럼 영어 소문자. `--no-verify` 금지. 각 태스크 끝에 커밋 메시지가 지정되어 있다.
- 포매팅은 Prettier 전담. 새 파일을 만들면 커밋 전에 `pnpm format`을 돌려 `pnpm format:check` 통과 상태로 커밋한다.
- `package.json`의 **`"type": "module"`을 지우지 마라** — 없으면 `vite.config.ts` 로드가 죽는다.
- 경로 별칭(`@/*`, `@/public/*`)은 `tsconfig.json`과 `vite.config.ts` **양쪽**에 있다. 이 계획은 새 별칭을 추가하지 않는다. 만약 추가하게 되면 둘 다 고치고, vite alias 배열에서 `@/public`이 `@`보다 앞이어야 한다.
- `src/routeTree.gen.ts`는 dev/build가 재생성한다. **커밋하되 직접 수정 금지.** Prettier·ESLint 제외 목록에 이미 있다.
- 새 라우트 ⇒ `public/sitemap.xml` 갱신 (생성기 없음, Task 4).
- `/about`의 닫기 컨트롤은 **`<button>` 유지 + `useNavigate()`** (`About.module.css`의 `.buttonWrapper button` 엘리먼트 선택자 때문). `/p/$id` 창의 신호등도 같은 CSS를 쓰므로 같은 제약이다. `/about`의 전역 `aboutPage` 클래스 문자열 유지 (`global.css`의 `.aboutPage *::selection`).
- **시키지 않은 색 리팩터링 금지.** `About.module.css`의 타이틀바·신호등 색은 의도된 하드코딩이다. 새 색은 전부 `global.css`의 `--pool-*` 토큰(Task 2에서 추가)을 쓴다.
- Playwright 기준선은 **darwin 전용, CI 미연결.** 재생성은 diff 이미지를 육안 확인한 뒤에만 (`--update-snapshots`). Task 12 전까지 `pnpm test`는 실패 상태가 정상이다(랜딩이 바뀌므로) — 중간 태스크의 검증에 `pnpm test`가 없는 이유다.
- GLSL은 별도 `.frag`/`.vert` 파일이 아니라 **TS 모듈 안의 템플릿 문자열**로 둔다 — vite에 glsl 로더 플러그인을 추가하지 않기 위해서다.
- **범위 밖** — 계획에 없으면 하지 마라: 잠수·카메라 이동·물리 엔진·충돌·멀티플레이어, 새 웹폰트, 이력서 텍스트 내용 갱신, `about.tsx` 컴포넌트 분할, `__root.tsx` description 재작성, OG 이미지, 리눅스 Playwright 기준선, ESLint 10 승격, R3F(`@react-three/fiber` — 스펙이 명시적으로 기각).

**되돌리는 법 (공통):** 태스크마다 커밋이 닫힌다. 실패하면 `git reset --hard HEAD`(커밋 전) 또는 `git revert <커밋>`(커밋 후). 의존성을 바꾼 태스크를 되돌린 뒤에는 `pnpm install`로 락파일과 재동기화.

## 판단 필요 — 사람/Fable에 확인하는 지점 (총람)

Codex가 스스로 발명하면 안 되는 것들이다. 각 태스크 본문에도 같은 표시가 있다. 기본값이 주어진 항목은 **기본값으로 일단 구현하고 진행하되**, 최종 확정은 사람/Fable 몫이다.

| #   | 항목                                                                                 | 위치     | 기본값                                    |
| --- | ------------------------------------------------------------------------------------ | -------- | ----------------------------------------- |
| J1  | `pool.json`의 제목·한 줄 소개·링크 URL·기술 스택 문구 (콘텐츠)                       | Task 1   | 본문에 초안 제공                          |
| J2  | 심볼 SVG 아트워크 최종본                                                             | Task 2   | 본문에 라인 아이콘 플레이스홀더 제공      |
| J3  | 부표 3D 몸체 색                                                                      | Task 5   | 튜브 `#f2545b` / 킥판 `#ffd23f` / 공 흰색 |
| J4  | 셰이더 미학 튜닝: Gerstner 파라미터, 밴드 경계값, 커스틱 임계값, 포말 폭, bloom 유무 | Task 6–8 | 본문에 기본값 제공                        |
| J5  | `x` 구성값 조정                                                                      | Task 1   | 스펙 표의 값                              |
| J6  | 스크린샷 재기준선 승인 (diff 육안 확인)                                              | Task 12  | —                                         |
| J7  | Hockney 레퍼런스 이미지 3–5장 확보 (저작권 있는 이미지 — 저장소 커밋 여부 포함)      | Task 13  | 디렉터리와 README만 준비                  |
| J8  | 부표 썸네일(`thumb`) 스크린샷 캡처                                                   | 후속     | 초기 데이터는 `thumb` 생략                |
| J9  | 물 현상 체크리스트 10/10 + 30초 정지 화면 테스트 최종 합격 판정                      | Task 13  | —                                         |

## 페이즈 ↔ 태스크 ↔ 체크리스트 매핑

스펙 「완성도 측정」의 물 현상 체크리스트 10행이 진행률 계기판이다. 각 페이즈가 어떤 행을 점등하는지 명시한다 — 점등 대상이 없는 페이즈는 구조 작업이다.

| 페이즈 (스펙의 빌드 순서)         | 태스크   | 점등하는 체크리스트 행                                                    |
| --------------------------------- | -------- | ------------------------------------------------------------------------- |
| 1. DOM 층                         | Task 1–4 | — (캔버스 없음. 단독 배포 가능이 합격 기준)                               |
| 2. 정적 씬                        | Task 5   | —                                                                         |
| 3. 수면                           | Task 6   | **#1** 수심 물색, **#2** 프레넬, **#3** 굴절, **#4** 굴절 수심 비례       |
| 4. 물결 시뮬 + 부력               | Task 7   | **#6** 부력·틸트, **#8** 파문 감쇠, **#9** 벽 반사                        |
| 5. 커스틱 + 포말                  | Task 8   | **#5** 커스틱-물결 동기화, **#7** 접촉 포말, **#10** 그림자가 커스틱 가림 |
| 6. 아바타 + 조작                  | Task 9   | —                                                                         |
| 7. View Transition                | Task 10  | —                                                                         |
| 8. 모바일 + reduced-motion + 폴백 | Task 11  | —                                                                         |
| 9. 테스트 + 기준선                | Task 12  | —                                                                         |
| 마무리 게이트 + 문서              | Task 13  | 10/10 전수 + 30초 테스트 + GPU 예산                                       |

## 파일 지도 (전체 조감)

```
src/
├── routes/
│   ├── __root.tsx           수정 없음
│   ├── _pool.tsx            신규 (T2) — 풀 레이아웃: PoolShell + <Outlet>
│   ├── _pool.index.tsx      신규 (T2) — / (창 없음)
│   ├── _pool.p.$id.tsx      신규 (T3) — /p/$id 창
│   ├── about.tsx            수정 (T1: lastUpdatedAt, T10: view-transition-name)
│   └── index.tsx            삭제 (T2) — _pool.index.tsx로 대체
├── components/pool/
│   ├── PoolShell.tsx        신규 (T2) — 데크+프록시+목록+캔버스 마운트
│   ├── Deck.tsx             신규 (T2)
│   ├── FloatProxy.tsx       신규 (T2)
│   ├── FloatWindow.tsx      신규 (T3)
│   ├── ListWindow.tsx       신규 (T3)
│   ├── PoolCanvas.tsx       신규 (T5) — lazy 경계 + WebGL 감지
│   └── symbols.tsx          신규 (T2)
├── lib/pool/
│   ├── positions.ts         신규 (T1) — √ 시간축 매핑 (three 무관, 순수 계산)
│   ├── constants.ts         신규 (T5)
│   ├── scene.ts             신규 (T5) — 카메라·루프·프록시 동기화
│   ├── floats.ts            신규 (T5) — 3D 몸체 + 부력(T7)
│   ├── water.ts             신규 (T6) — 수면 머티리얼(GLSL 문자열 포함)
│   ├── ripple.ts            신규 (T7) — 핑퐁 시뮬레이션
│   ├── caustics.ts          신규 (T8)
│   ├── avatar.ts            신규 (T9)
│   └── profiler.ts          신규 (T13) — dev 전용 GPU 타이머
├── contents/
│   ├── types.ts             신규 (T1) — PoolFloat + Resume
│   ├── pool.json            신규 (T1)
│   ├── pool.ts              신규 (T1) — 타입 입힌 재수출
│   ├── resume.ts            신규 (T1)
│   └── resume.json          수정 (T1: lastUpdatedAt 추가)
└── styles/
    ├── global.css           수정 (T2: --pool-* 토큰)
    ├── Pool.module.css      신규 (T2)
    ├── Home.module.css      삭제 (T2)
    └── About.module.css     수정 없음 (창이 그대로 import)
public/sitemap.xml           수정 (T4)
tests/pages.spec.ts          수정 (T12)
CLAUDE.md                    수정 (T13)
docs/pool-references/        신규 (T13, README만)
```

---

### Task 0: 준비 — 설치와 기준 그린 확인

**Files:** 변경 없음 (커밋 없음)

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/haneul/orca/workspaces/haneulchadotcom/landing-toy
pnpm install
```

Expected: 성공. `prepare: husky`가 훅을 설치한다.

- [ ] **Step 2: 4종 검증 + 기존 테스트 통과 확인**

```bash
pnpm type-check && pnpm lint && pnpm format:check && pnpm build && pnpm test
```

Expected: 전부 통과 (기존 테스트 4/4). 실패하면 **멈추고 보고한다** — 이 계획은 그린에서 출발한다.

---

### Task 1: 데이터 층 — `pool.json` + 타입 + 기술 부채 2건 (페이즈 1)

콘텐츠와 타입이 모든 것의 뿌리다. 같은 메커니즘으로 CLAUDE.md 기술 부채 2건(resume 타입, "최종 수정" 날짜)도 여기서 해소한다 (스펙 「데이터 모델」).

**Files:**

- Create: `src/contents/types.ts`, `src/contents/pool.json`, `src/contents/pool.ts`, `src/contents/resume.ts`, `src/lib/pool/positions.ts`
- Modify: `src/contents/resume.json` (필드 1개 추가), `src/routes/about.tsx` (하드코딩 날짜 → JSON 참조)

**Interfaces:**

- Produces: `import floats from '@/contents/pool'` → `PoolFloat[]` (pool.json 순서 그대로). `import resume from '@/contents/resume'` → `Resume`. `computePositions(floats)` → `{ id, x, y }[]` (y는 0..1, 0=최근/데크 쪽). `sortNewestFirst(floats)` → date 내림차순, 동률은 pool.json 순서. Task 2 이후 전부가 이 셋을 소비한다.

- [ ] **Step 1: `src/contents/types.ts` 작성**

```ts
export type FloatKind = 'made' | 'written' | 'seen';
export type FloatStatus = 'live' | 'archived' | 'wip';

export type PoolFloat = {
  id: string; //       /p/$id의 라우트 파라미터
  kind: FloatKind; //  모양 결정 (튜브/킥판/공)
  date: string; //     'YYYY-MM' 또는 'YYYY-MM-DD' — 세로 위치 결정 (√ 매핑)
  x: number; //        0..1 가로, 구성용 수동값
  title: string;
  subtitle: string;
  desc?: string;
  symbol: string; //   symbols.tsx의 키
  status: FloatStatus;
  tech?: string[];
  links: { label: string; href: string }[];
  thumb?: string; //   public/pool/ 아래 경로. 초기 데이터는 생략 (판단 필요 J8)
};

export type Resume = {
  title: string;
  lastUpdatedAt: string;
  introduction: string;
  infoLink: { id: string; href: string; desc: string }[];
  experience: {
    company: string;
    period: string;
    position: string;
    tech: string[];
    section: {
      title: string;
      period: string;
      desc: string;
      tech: string[];
      jobs: { id: number; summary: string; detail: string[] }[];
    }[];
  }[];
  portfolio: {
    title: string;
    url: string;
    period: string;
    desc: string;
    tech: string[];
  }[];
  language: { type: string; level: string }[];
};
```

주의: `Resume`는 현재 `resume.json`의 실제 구조를 옮긴 것이다. `pnpm type-check`가 어긋남을 알려주면 **JSON이 아니라 타입을 실제 구조에 맞춘다** (이력서 내용 변경은 범위 밖).

- [ ] **Step 2: `src/contents/pool.json` 작성**

**판단 필요 (J1, J5)** — 제목·한 줄 소개·저장소 URL은 초안이다. 아래를 그대로 넣고 진행하되, 최종 문구·URL 확정은 사람 몫이라고 최종 보고에 명시한다. 순서는 스펙 「초기 부표 8개」 표와 동일하다.

```json
[
  {
    "id": "jecheori",
    "kind": "made",
    "date": "2026-08",
    "x": 0.3,
    "title": "제철어리",
    "subtitle": "제철 과일 달력",
    "symbol": "fruit",
    "status": "live",
    "tech": ["Astro"],
    "links": [
      { "label": "사이트", "href": "https://haneulcha.github.io/jecheori/" },
      { "label": "저장소", "href": "https://github.com/haneulcha/jecheori" }
    ]
  },
  {
    "id": "health-defense",
    "kind": "made",
    "date": "2026-08",
    "x": 0.68,
    "title": "health-defense",
    "subtitle": "건강을 지키는 디펜스 게임 (만드는 중)",
    "symbol": "shield",
    "status": "wip",
    "links": [
      {
        "label": "저장소",
        "href": "https://github.com/haneulcha/health-defense"
      }
    ]
  },
  {
    "id": "pourover",
    "kind": "made",
    "date": "2026-07",
    "x": 0.48,
    "title": "pourover.work",
    "subtitle": "핸드드립 레시피 타이머",
    "symbol": "dripper",
    "status": "live",
    "links": [
      { "label": "사이트", "href": "https://pourover.work" },
      { "label": "저장소", "href": "https://github.com/haneulcha/pourover" }
    ]
  },
  {
    "id": "knitt",
    "kind": "made",
    "date": "2026-03",
    "x": 0.78,
    "title": "knitt",
    "subtitle": "뜨개 기록 (만드는 중)",
    "symbol": "yarn",
    "status": "wip",
    "links": [
      { "label": "저장소", "href": "https://github.com/haneulcha/knitt" }
    ]
  },
  {
    "id": "blog",
    "kind": "written",
    "date": "2025-11",
    "x": 0.22,
    "title": "blog.haneulcha.com",
    "subtitle": "가볍게 쓰는 블로그",
    "symbol": "notebook",
    "status": "live",
    "links": [{ "label": "블로그", "href": "https://blog.haneulcha.com/" }]
  },
  {
    "id": "tistory",
    "kind": "written",
    "date": "2022-07",
    "x": 0.6,
    "title": "kicksky.tistory.com",
    "subtitle": "2022년까지의 개발 블로그",
    "symbol": "pen",
    "status": "archived",
    "links": [{ "label": "블로그", "href": "https://kicksky.tistory.com/" }]
  },
  {
    "id": "galpi",
    "kind": "made",
    "date": "2020-07",
    "x": 0.35,
    "title": "galpi",
    "subtitle": "독서 기록 서비스",
    "symbol": "book",
    "status": "archived",
    "links": [
      { "label": "저장소", "href": "https://github.com/haneulcha/galpi" }
    ]
  },
  {
    "id": "kinderguri",
    "kind": "made",
    "date": "2020-04",
    "x": 0.72,
    "title": "kinderguri",
    "subtitle": "유치원 알림장",
    "symbol": "building",
    "status": "archived",
    "links": [
      { "label": "저장소", "href": "https://github.com/haneulcha/kinderguri" }
    ]
  }
]
```

`pool.json`의 모든 필드는 **평문**이다. HTML 문자열 금지, `dangerouslySetInnerHTML` 금지 (스펙 「데이터 모델」의 HTML 규칙).

- [ ] **Step 3: 재수출 모듈 2개 작성**

스펙이 정한 방식: 데이터는 JSON에 살고, `.ts` 모듈이 타입을 입혀 재수출하며, 컴포넌트는 JSON이 아니라 이 모듈에서 import한다. 한계(유니언 리터럴 오타는 못 잡음)는 스펙이 이미 감수했다 — 다른 방식(zod, satisfies 등)으로 바꾸지 마라.

`src/contents/pool.ts`:

```ts
import type { PoolFloat } from './types';
import poolJson from './pool.json';

const floats = poolJson as PoolFloat[];

export default floats;
```

`src/contents/resume.ts`:

```ts
import type { Resume } from './types';
import resumeJson from './resume.json';

const resume = resumeJson as Resume;

export default resume;
```

- [ ] **Step 4: `src/lib/pool/positions.ts` 작성 — √ 시간축 매핑**

스펙 「레이아웃」이 확정한 공식이다. **선형으로 "단순화"하지 마라** — 초기 8개 기준으로 선형은 5개가 상단 12%에 몰리고 동월 2개가 정확히 겹친다 (스펙에 수치가 있다).

```ts
import type { PoolFloat } from '@/contents/types';

export type FloatPosition = { id: string; x: number; y: number };

/** 데크가 차지하는 뷰포트 비율. Pool.module.css의 데크 높이 14%와 짝. */
export const DECK_FRACTION = 0.14;

function toTime(date: string): number {
  const [y, m, d = '15'] = date.split('-');
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

/** date 내림차순 정렬. 동률은 pool.json 순서 유지 (DOM/Tab 순서의 근거). */
export function sortNewestFirst(floats: PoolFloat[]): PoolFloat[] {
  return [...floats].sort((a, b) => toTime(b.date) - toTime(a.date));
}

/**
 * y = √((최신 − date) / (최신 − 最古)), 0 = 최근(데크 쪽), 1 = 최고(最古).
 * 동월 항목은 최소 세로 간격(minGap)만큼 아래로 밀어낸 뒤,
 * 1을 넘으면 전체를 최대값으로 나눠 0..1로 재정규화한다.
 */
export function computePositions(
  floats: PoolFloat[],
  minGap = 0.06,
): FloatPosition[] {
  const times = floats.map((f) => toTime(f.date));
  const newest = Math.max(...times);
  const oldest = Math.min(...times);
  const span = Math.max(newest - oldest, 1);

  const positions = floats.map((f, i) => ({
    id: f.id,
    x: f.x,
    y: Math.sqrt((newest - times[i]) / span),
  }));

  const ascending = [...positions].sort((a, b) => a.y - b.y);
  for (let i = 1; i < ascending.length; i++) {
    if (ascending[i].y - ascending[i - 1].y < minGap) {
      ascending[i].y = ascending[i - 1].y + minGap;
    }
  }
  const max = Math.max(1, ...positions.map((p) => p.y));
  for (const p of positions) p.y /= max;

  return positions;
}

/** y(0..1) → 뷰포트 세로 위치(%). 물 영역 안에서 상하 8% 여백. */
export function toViewportTopPercent(y: number): number {
  const inWater = 0.08 + y * 0.84;
  return (DECK_FRACTION + inWater * (1 - DECK_FRACTION)) * 100;
}
```

초기 8개에 대한 기대값(검산용): √ y는 `0, 0, 0.115, 0.256, 0.344, 0.803, 0.980, 1.000` → 넛지·재정규화 후 근사 `0, 0.058, 0.111, 0.246, 0.331, 0.772, 0.942, 1.0`. 순서는 date 순서와 항상 일치해야 한다.

- [ ] **Step 5: 기술 부채 해소 — `resume.json`에 `lastUpdatedAt`, `about.tsx`에서 하드코딩 제거**

`src/contents/resume.json`의 최상위에 필드를 추가한다 (`"title"` 바로 다음 줄):

```json
  "lastUpdatedAt": "2022. 7. 23",
```

`src/routes/about.tsx`에서 두 곳 수정:

1. import 교체: `import content from '@/contents/resume.json';` → `import content from '@/contents/resume';`
2. 하드코딩 제거: `<p className={styles.lastUpdatedAt}>최종 수정: 2022. 7. 23</p>` → `<p className={styles.lastUpdatedAt}>최종 수정: {content.lastUpdatedAt}</p>`

그 외에는 글자 하나 바꾸지 마라. 날짜 **값**은 그대로다(이력서 내용 갱신은 범위 밖) — 렌더 결과가 바이트 단위로 동일해야 한다.

- [ ] **Step 6: 데이터 무결성 검사 + 타입 게이트**

```bash
node -e "
const d = require('./src/contents/pool.json');
const ids = d.map(f => f.id);
console.assert(d.length === 8, 'floats: 8개여야 한다');
console.assert(new Set(ids).size === 8, 'id 중복');
console.assert(d.every(f => /^\d{4}-\d{2}(-\d{2})?$/.test(f.date)), 'date 형식');
console.assert(d.every(f => f.x >= 0 && f.x <= 1), 'x 범위');
console.assert(d.every(f => f.links.length > 0), 'links 비어 있음');
console.log('pool.json OK:', ids.join(', '));
"
pnpm type-check && pnpm lint
```

Expected: `pool.json OK: jecheori, health-defense, ...` 출력, type-check·lint 통과. type-check가 `Resume` 불일치를 잡으면 Step 1의 주의사항대로 타입 쪽을 고친다.

- [ ] **Step 7: 기존 화면 회귀 없음 확인 + 커밋 (2건)**

```bash
pnpm build && pnpm test
```

Expected: 기존 테스트 4/4 통과 — `/about` 렌더가 변하지 않았다는 증거다 (`about.png` 스크린샷 포함. lastUpdatedAt 치환은 같은 문자열을 렌더한다).

```bash
pnpm format && pnpm format:check
git add src/contents/types.ts src/contents/pool.json src/contents/pool.ts src/lib/pool/positions.ts
git commit -m "feat: add typed pool float data and time-axis mapping"
git add src/contents/resume.ts src/contents/resume.json src/routes/about.tsx
git commit -m "refactor: type resume data and move last updated date into json"
```

**되돌리기:** `git revert` 두 건. 의존성 변화 없음.

---

### Task 2: DOM 풀 — 레이아웃 라우트, 데크, 부표 프록시 (페이즈 1)

기존 랜딩(`index.tsx` + `Home.module.css`)을 철거하고 풀의 DOM 층을 깐다. **이 태스크가 끝나면 `/`는 캔버스 없이 완결 동작한다** — 부표는 평범한 `<a>` 링크 목록이고, 프리렌더 HTML에 그대로 박힌다.

**Files:**

- Create: `src/routes/_pool.tsx`, `src/routes/_pool.index.tsx`, `src/components/pool/PoolShell.tsx`, `src/components/pool/Deck.tsx`, `src/components/pool/FloatProxy.tsx`, `src/components/pool/symbols.tsx`, `src/styles/Pool.module.css`
- Delete: `src/routes/index.tsx`, `src/styles/Home.module.css`
- Modify: `src/styles/global.css` (`--pool-*` 토큰), `src/routeTree.gen.ts` (자동 재생성 — 손대지 말 것)

**Interfaces:**

- Consumes: Task 1의 `floats`, `sortNewestFirst`, `computePositions`, `toViewportTopPercent`.
- Produces: 라우트 `/`(레이아웃 `_pool` + 인덱스). `PoolShell`은 `children`(Outlet 내용 = 창)을 받고, 프록시 DOM 엘리먼트 레지스트리 `proxyEls: Map<string, HTMLAnchorElement>`를 유지한다(Task 5의 캔버스가 좌표 동기화에 쓴다). `Symbol` 컴포넌트: `symbols.tsx`의 `export function FloatSymbol({ name }: { name: string })`. Task 3의 창, Task 5의 캔버스가 이 위에 얹힌다.

- [ ] **Step 1: `global.css`에 풀 토큰 추가**

`:root` 블록의 기존 토큰 아래에 추가한다 (스펙 「정오 팔레트」의 확정값):

```css
--pool-deck: #f5f3ee;
--pool-water-shallow: #4ec5d9;
--pool-water-mid: #1e9bc4;
--pool-water-deep: #0b5e7d;
--pool-caustic: #fbffff; /* 커스틱 마크 — 거의 순백 */
--pool-tile-line: #d8dee2; /* 바닥 타일 그리드 */
--pool-avatar: #ad1d1d; /* ㅊ — 기존 typo1의 승격 */
```

다른 색은 추가하지도 바꾸지도 않는다.

- [ ] **Step 2: `src/components/pool/symbols.tsx` 작성**

**판단 필요 (J2)** — 아래는 사이트가 동작하기 위한 라인 아이콘 플레이스홀더다. 그대로 구현하고, 최종 아트워크 교체는 사람/Fable 몫으로 보고에 남긴다. 키 셋은 스펙이 확정: `fruit, dripper, notebook, shield, yarn, pen, book, building, clipboard`.

```tsx
import type { ReactNode } from 'react';

const paths: Record<string, ReactNode> = {
  fruit: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 7c1-3 4-4 4-4" />
    </>
  ),
  dripper: <path d="M5 5h14l-5 8v6h-4v-6z" />,
  notebook: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />,
  yarn: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12c5-2 11-2 16 0M6 7c4 3 8 7 12 10" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l2-6L16 4l4 4L10 18z" />
      <line x1="14" y1="6" x2="18" y2="10" />
    </>
  ),
  book: <path d="M4 5h7v14H4zM13 5h7v14h-7z" />,
  building: (
    <>
      <rect x="5" y="8" width="14" height="12" />
      <path d="M5 8l7-5 7 5" />
      <rect x="10" y="14" width="4" height="6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </>
  ),
};

export function FloatSymbol({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
```

- [ ] **Step 3: `src/components/pool/FloatProxy.tsx` 작성**

프록시가 곧 `<a>`이고, 포커스 대상이고, (Task 10에서) `view-transition-name` 보유자다 (스펙 「DOM 프록시」). TanStack `<Link>`는 `<a>`로 렌더되므로 여기서는 Link를 쓴다 — `<button>` 제약은 신호등에만 적용된다.

```tsx
import { Link } from '@tanstack/react-router';
import type { Ref } from 'react';

import type { PoolFloat } from '@/contents/types';
import { toViewportTopPercent } from '@/lib/pool/positions';
import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

type Props = {
  float: PoolFloat;
  y: number; // computePositions의 0..1
  anchorRef: Ref<HTMLAnchorElement>;
};

export function FloatProxy({ float, y, anchorRef }: Props) {
  return (
    <Link
      ref={anchorRef}
      to="/p/$id"
      params={{ id: float.id }}
      className={styles.proxy}
      data-status={float.status}
      data-kind={float.kind}
      style={{
        left: `${float.x * 100}%`,
        top: `${toViewportTopPercent(y)}%`,
      }}
    >
      <span className={styles.proxySymbol} data-symbol-id={float.id}>
        <FloatSymbol name={float.symbol} />
      </span>
      <span className={styles.proxyLabel}>
        {float.title}
        <small>{float.subtitle}</small>
      </span>
    </Link>
  );
}
```

- [ ] **Step 4: `src/components/pool/Deck.tsx` 작성**

데크 항목은 스펙 확정: 이력서(클립보드 → `/about`), 연락처(`mailto:tjaneul@gmail.com`), GitHub. 저작권 표기도 데크로 온다. "목록으로 보기" 버튼은 PoolShell의 상태를 토글한다.

```tsx
import { Link } from '@tanstack/react-router';

import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

export function Deck({ onToggleList }: { onToggleList: () => void }) {
  return (
    <header className={styles.deck}>
      <nav aria-label="데크" className={styles.deckNav}>
        <Link to="/about" className={styles.deckItem}>
          <span data-symbol-id="about">
            <FloatSymbol name="clipboard" />
          </span>
          이력서
        </Link>
        <a href="mailto:tjaneul@gmail.com" className={styles.deckItem}>
          연락처
        </a>
        <a
          href="https://github.com/haneulcha"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.deckItem}
        >
          GitHub
        </a>
        <button className={styles.listToggle} onClick={onToggleList}>
          목록으로 보기
        </button>
      </nav>
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} Haneul Cha
      </div>
    </header>
  );
}
```

- [ ] **Step 5: `src/components/pool/PoolShell.tsx` 작성**

```tsx
import { useRef, useState, type ReactNode } from 'react';

import floats from '@/contents/pool';
import { computePositions, sortNewestFirst } from '@/lib/pool/positions';
import styles from '@/styles/Pool.module.css';
import { Deck } from './Deck';
import { FloatProxy } from './FloatProxy';
import { ListWindow } from './ListWindow';

const ordered = sortNewestFirst(floats); // DOM 순서 = Tab 순서 = 최신→과거
const positions = new Map(computePositions(floats).map((p) => [p.id, p]));

export function PoolShell({ children }: { children: ReactNode }) {
  const [listOpen, setListOpen] = useState(false);
  const proxyEls = useRef(new Map<string, HTMLAnchorElement>());

  return (
    <div className={styles.pool} data-pool-ready="dom">
      {/* Task 5에서 이 자리(배경 최하층)에 <PoolCanvas>가 들어온다 */}
      <Deck onToggleList={() => setListOpen((v) => !v)} />
      <nav aria-label="풀에 떠 있는 것들" className={styles.water}>
        {ordered.map((f) => (
          <FloatProxy
            key={f.id}
            float={f}
            y={positions.get(f.id)!.y}
            anchorRef={(el) => {
              if (el) proxyEls.current.set(f.id, el);
              else proxyEls.current.delete(f.id);
            }}
          />
        ))}
      </nav>
      {listOpen && <ListWindow onClose={() => setListOpen(false)} />}
      {children}
    </div>
  );
}
```

주의: `ListWindow`는 Task 3에서 만든다. 이 태스크의 빌드를 그린으로 유지하려면 **Task 2·3을 한 브랜치 흐름에서 이어서 작업하고 커밋은 각 태스크 끝에서 나눈다** — Task 2 커밋 시점에는 `ListWindow` 관련 두 줄(import와 JSX)을 잠시 뺐다가 Task 3에서 넣는다.

- [ ] **Step 6: `src/styles/Pool.module.css` 작성**

폴백이 곧 기본 배경이다: 물색은 하드 스톱 그라디언트(=밴드)로, 캔버스가 없어도 Hockney 밴드가 보인다.

```css
.pool {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--pool-deck);
}

.deck {
  position: relative;
  z-index: 2;
  height: 14vh; /* positions.ts의 DECK_FRACTION 0.14와 짝 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  background: var(--pool-deck);
  color: var(--color);
}

.deckNav {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.deckItem {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--point-color);
}
.deckItem:hover {
  color: var(--point-color-hover);
}

.listToggle {
  color: var(--point-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
}

.copyright {
  font-size: 0.8rem;
  color: var(--color);
  opacity: 0.5;
}

.water {
  position: absolute;
  inset: 14vh 0 0 0;
  z-index: 2;
  /* 캔버스 부재 시(그리고 캔버스 로드 전) 물색 밴드 폴백 */
  background: linear-gradient(
    to bottom,
    var(--pool-water-shallow) 0 33%,
    var(--pool-water-mid) 33% 66%,
    var(--pool-water-deep) 66% 100%
  );
}

.proxy {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  color: #ffffff;
  text-align: center;
}

.proxy[data-status='archived'] {
  filter: saturate(0.4) opacity(0.75);
}

.proxySymbol {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.18);
}

.proxyLabel {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
}
.proxyLabel small {
  font-weight: 400;
  opacity: 0.85;
}

/* 포커스 링 = 물결 링 (정적 버전. 애니메이션은 넣지 않는다 — reduced-motion 병행 관리 비용) */
.proxy:focus-visible {
  outline: none;
}
.proxy:focus-visible .proxySymbol {
  box-shadow:
    0 0 0 3px rgb(255 255 255 / 0.9),
    0 0 0 7px rgb(255 255 255 / 0.35);
}
```

주의: `.water`의 z-index 2는 Task 5에서 캔버스(z-index 1)가 아래로 들어올 자리를 잡아 둔 것이다. `.water` 배경은 Task 5에서 캔버스 로드 성공 시 투명 처리된다.

- [ ] **Step 7: 라우트 교체**

```bash
git rm src/routes/index.tsx src/styles/Home.module.css
```

`src/routes/_pool.tsx` 작성:

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { PoolShell } from '@/components/pool/PoolShell';

export const Route = createFileRoute('/_pool')({
  component: PoolLayout,
});

function PoolLayout() {
  return (
    <PoolShell>
      <Outlet />
    </PoolShell>
  );
}
```

`src/routes/_pool.index.tsx` 작성:

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_pool/')({
  component: () => null, // 창 없음 — 풀만
});
```

트러블슈팅: TanStack Router 파일 컨벤션에서 pathless layout은 `_pool.tsx`, 그 인덱스 자식은 `_pool.index.tsx`이고 `createFileRoute`의 경로 문자열은 생성기가 요구하는 형식을 따라야 한다. `pnpm dev`가 라우트 경로 불일치 에러를 내면 **생성기가 제안하는 경로 문자열로 맞춘다** (routeTree.gen.ts를 손으로 고치는 게 아니다).

- [ ] **Step 8: 빌드·검증**

```bash
pnpm build
pnpm type-check && pnpm lint && pnpm format && pnpm format:check
```

Expected: 빌드가 `routeTree.gen.ts`를 재생성하고 프리렌더 성공. 이어서 프리렌더 HTML에 프록시 8개가 실제 앵커로 박혔는지 확인:

```bash
INDEX_HTML=$(find .output/public -maxdepth 1 -name 'index.html')
grep -o 'href="/p/[a-z-]*"' "$INDEX_HTML" | sort -u
grep -c 'aria-label="풀에 떠 있는 것들"' "$INDEX_HTML"
```

Expected: `/p/` 앵커 8종(blog, galpi, health-defense, jecheori, kinderguri, knitt, pourover, tistory), nav 1개. **이것이 "DOM 층 = 프리렌더 출력 = 접근성 레이어"의 물증이다.**

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat: replace landing with dom pool layout and float proxies"
```

**되돌리기:** `git revert`. `routeTree.gen.ts`는 다음 빌드에서 다시 맞춰진다.

---

### Task 3: 창 — `/p/$id` 라우트와 목록 창 (페이즈 1)

부표의 창과 "목록으로 보기" 창. macOS 크롬은 `About.module.css`를 **그대로 import**해 재사용한다 (추출 금지 — 스펙 「창」). 신호등: 빨강 = 닫기(`useNavigate`로 `/`), 노랑 = 접기(창 안의 `<details>` 일괄 토글), 초록 = 확대(폭 토글).

**Files:**

- Create: `src/routes/_pool.p.$id.tsx`, `src/components/pool/FloatWindow.tsx`, `src/components/pool/ListWindow.tsx`
- Modify: `src/components/pool/PoolShell.tsx` (Task 2에서 뺐던 ListWindow 두 줄 복원), `src/styles/Pool.module.css` (창 스타일 추가)

**Interfaces:**

- Consumes: Task 1의 `floats`·`sortNewestFirst`, Task 2의 `PoolShell`(Outlet 슬롯)·`FloatSymbol`.
- Produces: 라우트 `/p/$id` (loader가 `PoolFloat` 반환, 없는 id는 `/`로 redirect). `FloatWindow({ float })`, `ListWindow({ onClose })`. Task 10이 창 헤더의 `data-symbol-id`를 morph 대상으로 쓴다.

- [ ] **Step 1: `src/routes/_pool.p.$id.tsx` 작성**

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

import { FloatWindow } from '@/components/pool/FloatWindow';
import floats from '@/contents/pool';

export const Route = createFileRoute('/_pool/p/$id')({
  loader: ({ params }) => {
    const float = floats.find((f) => f.id === params.id);
    if (!float) throw redirect({ to: '/' }); // 스펙: 없는 id는 풀로 안내
    return float;
  },
  head: (ctx) => ({
    meta: [
      { title: `${ctx.loaderData?.title ?? '풀'} — 차하늘` },
      { name: 'description', content: ctx.loaderData?.subtitle ?? '' },
    ],
  }),
  component: FloatWindowRoute,
});

function FloatWindowRoute() {
  const float = Route.useLoaderData();
  return <FloatWindow float={float} />;
}
```

트러블슈팅: `head()` 컨텍스트에서 loaderData를 받는 정확한 시그니처는 설치된 `@tanstack/react-router` 1.170.29 문서로 확인한다 (버전에 따라 `{ loaderData }` 구조분해 형태가 다를 수 있다). **의도는 고정이다: 부표의 title·subtitle이 문서 title·description이 된다.**

- [ ] **Step 2: `src/components/pool/FloatWindow.tsx` 작성**

```tsx
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import type { PoolFloat } from '@/contents/types';
import aboutStyles from '@/styles/About.module.css';
import styles from '@/styles/Pool.module.css';
import { FloatSymbol } from './symbols';

export function FloatWindow({ float }: { float: PoolFloat }) {
  const navigate = useNavigate();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [zoomed, setZoomed] = useState(false);

  // Esc = 닫기 (스펙 「인터랙션」 표)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate({ to: '/' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // 노랑 = 창 안의 details 일괄 토글 (about.tsx와 같은 로직, 창 범위로 한정)
  const toggleDetails = () => {
    const details = bodyRef.current?.querySelectorAll('details') ?? [];
    const isAllOpen = [...details].every((el) => el.open);
    details.forEach((el) => {
      el.open = !isAllOpen;
    });
  };

  return (
    <div
      className={`aboutPage ${styles.floatWindow} ${zoomed ? styles.zoomed : ''}`}
      role="dialog"
      aria-label={float.title}
    >
      <div className={aboutStyles.titlebar}>
        <nav className={aboutStyles.buttonWrapper}>
          <button
            className={aboutStyles.close}
            onClick={() => navigate({ to: '/' })}
          >
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
          <button className={aboutStyles.minimize} onClick={toggleDetails}>
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
          <button
            className={aboutStyles.zoom}
            onClick={() => setZoomed((v) => !v)}
          >
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
        </nav>
        <span data-symbol-id={float.id} className={styles.windowSymbol}>
          <FloatSymbol name={float.symbol} />
        </span>
        {float.title}
      </div>
      <div ref={bodyRef} className={styles.windowBody}>
        <p className={styles.windowSubtitle}>{float.subtitle}</p>
        {float.desc && <p>{float.desc}</p>}
        <details open>
          <summary>정보</summary>
          <dl>
            <dt>시기</dt>
            <dd>{float.date}</dd>
            {float.tech && (
              <>
                <dt>기술</dt>
                <dd>{float.tech.join(', ')}</dd>
              </>
            )}
          </dl>
        </details>
        {float.thumb && (
          <details open>
            <summary>화면</summary>
            <img src={float.thumb} alt={`${float.title} 화면`} />
          </details>
        )}
        <details open>
          <summary>링크</summary>
          <ul>
            {float.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
```

제약 재확인: 닫기는 `<button>` + `useNavigate()`다 — `About.module.css`의 `.buttonWrapper button` 선택자가 이 창에도 적용된다. 창 루트의 `aboutPage` 전역 클래스는 선택 하이라이트 색을 이력서와 맞추는 스펙 결정이다.

- [ ] **Step 3: `src/components/pool/ListWindow.tsx` 작성**

같은 항목들을 평범한 목록으로 — 스크린 리더 전용이 아니라 바쁜 사용자용이기도 하다 (스펙 「접근성」).

```tsx
import { Link } from '@tanstack/react-router';

import floats from '@/contents/pool';
import { sortNewestFirst } from '@/lib/pool/positions';
import aboutStyles from '@/styles/About.module.css';
import styles from '@/styles/Pool.module.css';

export function ListWindow({ onClose }: { onClose: () => void }) {
  return (
    <div
      className={`aboutPage ${styles.listWindow}`}
      role="dialog"
      aria-label="목록으로 보기"
    >
      <div className={aboutStyles.titlebar}>
        <nav className={aboutStyles.buttonWrapper}>
          <button className={aboutStyles.close} onClick={onClose}>
            <strong className={aboutStyles.inlineContent}></strong>
          </button>
        </nav>
        목록
      </div>
      <ul className={styles.listBody}>
        {sortNewestFirst(floats).map((f) => (
          <li key={f.id}>
            <Link to="/p/$id" params={{ id: f.id }}>
              {f.title}
            </Link>
            <span>
              {f.date} · {f.subtitle}
            </span>
          </li>
        ))}
        <li>
          <Link to="/about">이력서</Link>
        </li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: `PoolShell.tsx`에 ListWindow 복원 + `Pool.module.css`에 창 스타일 추가**

PoolShell: Task 2 Step 5 코드의 `ListWindow` import와 `{listOpen && <ListWindow …/>}` 줄을 넣는다 (Task 2에서 잠시 뺐던 그 두 줄).

`Pool.module.css` 끝에 추가:

```css
.floatWindow,
.listWindow {
  position: absolute;
  z-index: 3;
  top: 18vh;
  left: 50%;
  transform: translateX(-50%);
  width: min(600px, 92vw);
  border: 1px solid #acacac;
  border-radius: 6px;
  box-shadow: 0 0 20px rgb(0 0 0 / 0.25);
  background: rgb(251 252 255 / 0.88); /* 살짝 반투명 — 물이 비친다 */
  color: var(--color);
}

.floatWindow.zoomed {
  width: min(1024px, 96vw); /* 초록 = 확대: /about과 같은 max-width */
}

.windowSymbol {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(-120%);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--point-color);
}

.windowBody {
  padding: 1.5rem 2rem 2rem;
  font-family: 'Noto Sans KR', sans-serif;
}
.windowBody summary {
  color: var(--point-color);
  font-weight: 500;
  cursor: pointer;
  margin: 0.75rem 0 0.25rem;
}
.windowBody img {
  max-width: 100%;
}
.windowSubtitle {
  font-weight: 500;
}

.listBody {
  margin: 0;
  padding: 1rem 1.5rem;
  list-style: none;
  font-family: 'Noto Sans KR', sans-serif;
}
.listBody li {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--border-color);
}
.listBody a {
  color: var(--point-color);
  font-weight: 500;
}
.listBody a:hover {
  color: var(--point-color-hover);
}
.listBody span {
  font-size: 0.85rem;
  opacity: 0.7;
}
```

- [ ] **Step 5: 빌드·검증 — `/p/$id` 프리렌더 8장 확인**

```bash
pnpm build
find .output/public/p -name '*.html' | sort
grep -o '<title>[^<]*</title>' .output/public/p/jecheori/index.html
```

Expected: `p/` 아래 HTML 8개 (crawlLinks가 Task 2의 앵커 8개를 따라간 결과). jecheori의 title에 `제철어리`와 `차하늘`이 들어 있다. 8개가 안 나오면 프리렌더 crawl이 앵커를 못 찾은 것 — Task 2 Step 8의 앵커 확인부터 다시 본다.

```bash
pnpm type-check && pnpm lint && pnpm format && pnpm format:check
```

Expected: 전부 통과.

- [ ] **Step 6: dev 스모크 — 라우트 왕복**

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -sf http://localhost:3000/p/jecheori | grep -c 'aboutPage'
curl -sf http://localhost:3000/p/no-such-id -o /dev/null -w '%{http_code}\n' || true
kill $DEV_PID
```

Expected: 첫 grep ≥ 1 (창이 SSR됨). 두 번째는 redirect 계열 응답(3xx 또는 `/` 내용의 200) — 500이면 loader의 redirect가 잘못된 것이다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add float window route and list window"
```

**되돌리기:** `git revert`.

---

### Task 4: sitemap + 페이즈 1 배포 가능 게이트 (페이즈 1 완료)

**Files:**

- Modify: `public/sitemap.xml`

**Interfaces:**

- Produces: 페이즈 1 완료 선언 — **이 시점의 사이트는 캔버스 없이 완결이고 배포 가능하다.** 이것이 이후 모든 캔버스 태스크의 실패 폴백이다.

- [ ] **Step 1: `public/sitemap.xml` 전체를 아래로 교체**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://haneulcha.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://haneulcha.com/about</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://haneulcha.com/p/jecheori</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/health-defense</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/pourover</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/knitt</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/blog</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/tistory</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/galpi</loc>
  </url>
  <url>
    <loc>https://haneulcha.com/p/kinderguri</loc>
  </url>
</urlset>
```

- [ ] **Step 2: sitemap과 프리렌더 산출물 대조**

```bash
pnpm build
for u in $(grep -o '<loc>[^<]*</loc>' public/sitemap.xml | sed 's/<[^>]*>//g'); do
  p=${u#https://haneulcha.com}; p=${p%/}
  f=".output/public${p}/index.html"
  [ -f "$f" ] || [ -f ".output/public${p}.html" ] || echo "MISSING: $u"
done
echo "sitemap check done"
```

Expected: `MISSING` 출력 없음.

- [ ] **Step 3: 페이즈 1 접근성·JS 없는 환경 스모크**

```bash
INDEX_HTML=$(find .output/public -maxdepth 1 -name 'index.html')
grep -c '<a ' "$INDEX_HTML"                       # 프록시 8 + 데크 링크들 → 10 이상
grep -c 'lang="ko"' "$INDEX_HTML"                 # 1
grep -c 'mailto:tjaneul@gmail.com' "$INDEX_HTML"  # 1
```

Expected: 주석과 일치. 크롤러/스크린 리더 관점에서 이미 완전한 링크 지도다.

- [ ] **Step 4: 커밋**

```bash
pnpm format:check
git add public/sitemap.xml
git commit -m "chore: add pool float routes to sitemap"
```

---

### Task 5: three 도입 + 정적 씬 (페이즈 2)

`three`가 여기서 들어온다 (gzip ~150KB, lazy import — 첫 페인트를 막지 않는다). 고정 orthographic 탑다운 카메라, 데크·프로시저럴 타일 바닥·정지 상태의 부표 몸체, 그리고 DOM 프록시의 투영 좌표 동기화까지. **물은 아직 평평하다.**

이 태스크부터 Task 8까지는 [jeantimex/threejs-water](https://github.com/jeantimex/threejs-water)(MIT, TS+Vite+Three.js)를 출발점으로 쓴다. **빈 파일에서 시작할 이유가 없다** (스펙 「참고 자료와 의존성」). 절차: 저장소를 로컬 임시 디렉터리에 clone해 두고, 각 태스크가 지정한 알고리즘(파동 방정식, differential-area 커스틱)을 이 프로젝트의 모듈 구조로 옮긴다. 옮긴 파일 상단에 MIT 어트리뷰션 주석을 남긴다:

```ts
// Water simulation adapted from https://github.com/jeantimex/threejs-water (MIT, Yong Su),
// itself a port of https://github.com/evanw/webgl-water (MIT, Evan Wallace).
```

**Files:**

- Create: `src/components/pool/PoolCanvas.tsx`, `src/lib/pool/constants.ts`, `src/lib/pool/scene.ts`, `src/lib/pool/floats.ts`
- Modify: `package.json`·`pnpm-lock.yaml` (three), `src/components/pool/PoolShell.tsx` (캔버스 마운트), `src/styles/Pool.module.css` (캔버스 레이어)

**Interfaces:**

- Consumes: Task 1 `computePositions`, Task 2 `PoolShell.proxyEls`.
- Produces: `createPoolScene(canvas, opts): PoolScene`. `PoolScene = { start(): void; stop(): void; dispose(): void; setReducedMotion(v: boolean): void }`. opts:

```ts
type PoolSceneOptions = {
  colors: PoolColors; // constants.ts readPoolColors()의 반환
  floats: {
    id: string;
    kind: FloatKind;
    status: FloatStatus;
    x: number;
    y: number;
  }[];
  reducedMotion: boolean;
  rippleSize: 512 | 256;
  /** 매 프레임, 부표별 화면 좌표(%)를 콜백 — PoolShell이 프록시 style에 반영 */
  onProxyMove: (id: string, leftPct: number, topPct: number) => void;
  onReady: () => void; // 첫 프레임 렌더 후 1회
};
```

Task 6–9가 scene.ts 내부 구조(레이어 훅) 위에 쌓는다.

- [ ] **Step 1: 의존성 추가**

```bash
pnpm add -E three
pnpm add -D -E @types/three
```

- [ ] **Step 2: `src/lib/pool/constants.ts` 작성**

```ts
// 캔버스와 DOM이 같은 기하를 봐야 한다 — 값을 복사하지 말고 재수출한다.
export { DECK_FRACTION } from './positions';

// 월드 단위: 세로(깊이 방향, z) 10. 가로는 뷰포트 aspect를 따른다.
export const WORLD_DEPTH = 10;
export const WATER_Y = 0; // 수면 높이
export const FLOOR_SHALLOW = -0.6; // 데크 쪽 바닥
export const FLOOR_DEEP = -2.2; // 먼 쪽 바닥

export type PoolColors = {
  deck: string;
  shallow: string;
  mid: string;
  deep: string;
  caustic: string;
  tileLine: string;
  avatar: string;
};

/** 색의 단일 소스는 global.css다 — 캔버스 초기화 시 한 번 읽는다 (스펙 「정오 팔레트」). */
export function readPoolColors(): PoolColors {
  const s = getComputedStyle(document.documentElement);
  const read = (n: string) => s.getPropertyValue(n).trim();
  return {
    deck: read('--pool-deck'),
    shallow: read('--pool-water-shallow'),
    mid: read('--pool-water-mid'),
    deep: read('--pool-water-deep'),
    caustic: read('--pool-caustic'),
    tileLine: read('--pool-tile-line'),
    avatar: read('--pool-avatar'),
  };
}
```

- [ ] **Step 3: `src/lib/pool/scene.ts` 작성 — 카메라·루프·프록시 동기화**

핵심 결정(스펙 「렌더링 아키텍처」): 카메라는 **고정 orthographic 탑다운**, 움직이지 않는다. 월드는 XZ 평면(y가 높이). 뷰포트 전체가 풀이다.

```ts
import * as THREE from 'three';

import { DECK_FRACTION, WORLD_DEPTH, type PoolColors } from './constants';
// (Task 6+에서 water/ripple/caustics 모듈이 여기에 합류한다)

export function createPoolScene(
  canvas: HTMLCanvasElement,
  opts: PoolSceneOptions,
): PoolScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 50);
  camera.position.set(0, 10, 0);
  camera.up.set(0, 0, -1); // 화면 위 = -z (데크 쪽)
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const worldW = (WORLD_DEPTH * w) / h;
    camera.left = -worldW / 2;
    camera.right = worldW / 2;
    camera.top = -WORLD_DEPTH / 2;
    camera.bottom = WORLD_DEPTH / 2;
    camera.updateProjectionMatrix();
  }

  // 정오의 태양: 거의 수직 + 약간의 기울기 → 짧고 진한 그림자
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1.5, 10, 1);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.6));

  // ... 데크/바닥/부표 메시 추가 (Step 4, floats.ts)

  const v = new THREE.Vector3();
  function syncProxies() {
    for (const f of floatObjects) {
      v.copy(f.mesh.position).project(camera);
      opts.onProxyMove(f.id, (v.x * 0.5 + 0.5) * 100, (-v.y * 0.5 + 0.5) * 100);
    }
  }

  let raf = 0;
  let last = performance.now();
  let readyFired = false;
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    // Task 6+: 여기서 ripple/water/caustics 업데이트
    updateFloats(dt);
    syncProxies();
    renderer.render(scene, camera);
    if (!readyFired) {
      readyFired = true;
      opts.onReady();
    }
    raf = requestAnimationFrame(frame);
  }
  // start/stop/dispose/resize 배선은 통상적인 패턴대로 구현한다
  // (dispose: cancelAnimationFrame + renderer.dispose + geometry/material dispose).
}
```

위 코드는 뼈대다 — `floatObjects`/`updateFloats`는 Step 4의 floats.ts에서 온다. **데크·바닥·부표의 월드 좌표 규약**: DOM의 (x: 0..1, y: 0..1)를 월드로 옮길 때 `worldX = (x - 0.5) * worldW`, `worldZ = (-0.5 + DECK_FRACTION + (0.08 + y * 0.84) * (1 - DECK_FRACTION)) * WORLD_DEPTH`. 이 식은 `positions.ts`의 `toViewportTopPercent`와 같은 기하를 월드에서 재현한 것이다 — 둘이 어긋나면 프록시가 몸체에서 미끄러진다.

바닥은 프로시저럴 타일 셰이더(ShaderMaterial): `fract(worldPos.xz * tileScale)` 격자에 `--pool-tile-line` 색 선, 바탕은 흰색. 데크는 `--pool-deck` 색 PlaneGeometry, 물 영역(z 기준 DECK_FRACTION 아래)만 바닥·물이 차지한다. 텍스처 에셋 금지 — 전부 프로시저럴 (스펙 「시각 스타일」 에셋 결과).

- [ ] **Step 4: `src/lib/pool/floats.ts` 작성 — 3D 몸체 (정지 상태)**

모양은 스펙 확정: `made` = 튜브(TorusGeometry 반지름 0.45, 관 0.18, 수평으로 눕힘), `written` = 킥판(BoxGeometry 0.9×0.08×0.6), `seen` = 비치볼(SphereGeometry 0.28). **판단 필요 (J3)** — 몸체 색 기본값: 튜브 `#f2545b`, 킥판 `#ffd23f`, 공 `#ffffff`. `status`가 `archived`면 머티리얼 채도를 낮춘다(`THREE.Color#offsetHSL(0, -0.35, 0)` 정도). 각 몸체는 `WATER_Y`에 정지해 있다 — 들썩임은 Task 7.

```ts
export type FloatObject = {
  id: string;
  mesh: THREE.Object3D;
  status: FloatStatus;
  bobScale: number; // wip이면 1.5, 아니면 1.0 (Task 7에서 사용)
};
export function createFloats(
  floats: PoolSceneOptions['floats'],
  worldW: number,
): FloatObject[];
export function updateFloats(dt: number): void; // Task 5 시점에는 no-op
```

- [ ] **Step 5: `src/components/pool/PoolCanvas.tsx` + PoolShell 마운트**

lazy 경계이자 WebGL 감지 지점. **첫 페인트 후에만** 로드한다 — 프리렌더 HTML에는 캔버스가 없다.

```tsx
import { lazy, Suspense, useEffect, useState, type RefObject } from 'react';

const PoolCanvasImpl = lazy(() => import('./PoolCanvasImpl'));

export type PoolCanvasProps = {
  onReady: () => void;
  proxyEls: RefObject<Map<string, HTMLAnchorElement>>;
};

export function PoolCanvas(props: PoolCanvasProps) {
  const [mode, setMode] = useState<'pending' | 'webgl' | 'none'>('pending');

  useEffect(() => {
    // 첫 페인트 이후에 결정 — three 번들이 초기 로드를 막지 않는다
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    setMode(gl ? 'webgl' : 'none');
  }, []);

  if (mode !== 'webgl') return null; // 폴백 = Task 2의 밴드 배경 + 링크. 그대로 동작한다.
  return (
    <Suspense fallback={null}>
      <PoolCanvasImpl {...props} />
    </Suspense>
  );
}
```

`PoolCanvasImpl.tsx`(같은 디렉터리에 신규)는 `<canvas className={styles.canvas}>`를 렌더하고 `useEffect`에서 `readPoolColors()`·`computePositions()`로 `createPoolScene`을 만들고, cleanup에서 `dispose()`한다.

배선은 PoolShell이 갖는다: `PoolShell`에 `canvasReady` 상태를 추가하고 `<PoolCanvas onReady={() => setCanvasReady(true)} proxyEls={proxyEls} />`를 데크보다 앞(최하층)에 렌더한다. 루트 div는 `data-pool-ready={canvasReady ? 'canvas' : 'dom'}`이 되고, `Pool.module.css`에 `.pool[data-pool-ready='canvas'] .water { background: none; }`를 추가해 캔버스가 뜨면 밴드 폴백 배경을 끈다. `onProxyMove`는 PoolCanvasImpl이 `proxyEls`에서 엘리먼트를 찾아 `style.left/top`을 직접 갱신한다(React 상태를 거치지 않는다 — 매 프레임이다).

`Pool.module.css`에 추가:

```css
.canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 6: 검증**

```bash
pnpm type-check && pnpm lint && pnpm build
INDEX_HTML=$(find .output/public -maxdepth 1 -name 'index.html')
grep -c '<canvas' "$INDEX_HTML" || echo "no canvas in prerender (OK)"
```

Expected: 통과 + `<canvas` 0건 — 프리렌더 HTML에 캔버스가 없다(첫 페인트는 여전히 DOM 층이고, three는 클라이언트에서 lazy 로드된다는 증거).

```bash
pnpm dev &
DEV_PID=$!
sleep 8
curl -sf http://localhost:3000/ | grep -c 'data-pool-ready="dom"'
kill $DEV_PID
```

Expected: 1 — SSR 시점에는 DOM 층뿐이다. 브라우저 확인(가능하면 Playwright MCP/Chrome 도구): 캔버스에 데크·타일 바닥·부표 몸체 8개가 보이고, 프록시 심볼이 몸체 위에 얹혀 있고, 창을 열어도(`/p/jecheori`) 캔버스가 언마운트되지 않는다.

- [ ] **Step 7: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: mount three.js static pool scene with proxy sync"
```

**되돌리기:** `git revert` 후 `pnpm install`. DOM 층은 캔버스 없이 그대로 산다 — 이것이 DOM 우선의 보험이다.

---

### Task 6: 수면 (페이즈 3) — 체크리스트 #1 #2 #3 #4 점등

분할 평면 + Gerstner 파 3개 + 수심 밴드 + 스크린스페이스 굴절 + 프레넬. 셰이딩 규칙(스펙 「시각 스타일」): **물색은 그라디언트가 아니라 3밴드 양자화. 양자화는 수심 필드에 대해서만** — 합성 이미지 포스터라이즈 금지.

**Files:**

- Create: `src/lib/pool/water.ts` (머티리얼 + GLSL 문자열)
- Modify: `src/lib/pool/scene.ts` (수면 메시, 굴절용 씬 RT 패스)

**Interfaces:**

- Consumes: scene.ts의 렌더 루프, constants.ts의 색·수심.
- Produces: `createWater(colors, size): { mesh: THREE.Mesh; material: THREE.ShaderMaterial; update(t: number): void }`. uniform 이름 `uTime, uShallow, uMid, uDeep, uSceneTex, uRippleTex, uFloorDepth` — Task 7·8이 이 이름으로 접근한다.

- [ ] **Step 1: 굴절용 씬 RT 패스**

scene.ts의 프레임에서: (1) 수면 메시를 `visible = false`로 두고 바닥+데크+부표를 `sceneRT`(RGBA, 뷰포트 크기)에 렌더 → (2) 수면을 켜고 본 렌더. 수면 프래그먼트가 `uSceneTex = sceneRT.texture`를 UV 왜곡해 샘플하면 그것이 스크린스페이스 굴절이다.

- [ ] **Step 2: `water.ts` — 버텍스 (Gerstner 3파)**

수면은 `PlaneGeometry(worldW, waterDepthWorld, 192, 192)` (Task 11에서 모바일 96²). **판단 필요 (J4)** — 파라미터 기본값 (정오의 잔물결, 낮은 진폭):

| 파  | 방향(xz)    | 파장 | 진폭  | 속도 |
| --- | ----------- | ---- | ----- | ---- |
| 1   | (1.0, 0.3)  | 1.8  | 0.025 | 0.6  |
| 2   | (-0.6, 1.0) | 1.1  | 0.018 | 0.9  |
| 3   | (0.3, -1.0) | 0.6  | 0.010 | 1.3  |

버텍스 셰이더에서 표준 Gerstner 합(각 파: `amp * sin(dot(dir, pos.xz) * 2π/λ + t * speed)` + 수평 변위)에 Task 7의 `uRippleTex` 높이 샘플을 더한다(이번 태스크에서는 uniform만 선언하고 0 텍스처를 바인딩). 노멀은 이웃 차분 또는 해석적 미분으로 계산해 varying으로 넘긴다.

- [ ] **Step 3: `water.ts` — 프래그먼트**

핵심 로직(발췌 — 이 구조를 그대로 쓴다):

```glsl
// 수심 0..1 (데크 쪽 얕음 → 먼 쪽 깊음). vWorldZ 기반.
float depthT = clamp((vWorldZ - shallowEdge) / (deepEdge - shallowEdge), 0.0, 1.0);

// #1: 수심 밴드 — 부드러운 mix 금지, step으로 하드 경계 (판단 필요 J4: 경계 0.33 / 0.66)
vec3 waterColor = uShallow;
waterColor = mix(waterColor, uMid, step(0.33, depthT));
waterColor = mix(waterColor, uDeep, step(0.66, depthT));

// #3 #4: 굴절 — 노멀로 UV를 왜곡하되 어긋남은 수심에 비례
vec2 refractUv = vScreenUv + vNormal.xz * (0.02 + 0.06 * depthT);
vec3 floorSeen = texture2D(uSceneTex, refractUv).rgb;

// #2: 프레넬 — 시선각이 낮은(먼) 곳일수록 하늘 반사
float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 3.0);
vec3 sky = vec3(0.92, 0.97, 1.0);

vec3 color = mix(floorSeen * waterColor, sky, fresnel * 0.6);
// 정오 스페큘러 (하드한 하이라이트)
float spec = pow(max(dot(reflect(-uSunDir, vNormal), vViewDir), 0.0), 240.0);
color += spec * 0.8;
```

탑다운 정사영에서 프레넬 효과가 화면 전체에 균일해지지 않도록, `vViewDir`은 카메라 위치가 아니라 **화면 하단(먼 쪽)으로 갈수록 시선각이 낮아지는 가상 시점**으로 계산한다 — 먼 가장자리가 밝아지는 것이 체크리스트 #2의 확인 방법이다. 구현이 모호하면 `fresnel = smoothstep(0.6, 1.0, depthT) * 0.5 + pow(...)` 형태로 깊은 쪽 가중치를 더하는 근사를 쓰고 주석으로 남긴다.

- [ ] **Step 4: 검증 — 체크리스트 #1–#4**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저(dev 서버)에서 눈으로 확인하고 결과를 기록한다:

- **#1** 얕은 쪽(데크 근처)과 깊은 쪽 색이 하드 경계로 구분되는가 — 경계가 부드럽게 뭉개져 있으면 step이 mix로 잘못 들어간 것
- **#2** 먼 가장자리가 밝아지는가
- **#3** 바닥 타일 격자선이 일렁이는가
- **#4** 깊은 쪽이 얕은 쪽보다 크게 일렁이는가

**판단 필요 (J4):** 네 개가 켜진 뒤의 미학(밴드 경계 위치, 스페큘러 강도)은 스크린샷을 찍어 사람/Fable 확인을 받고 진행한다.

- [ ] **Step 5: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: add banded water surface with refraction and fresnel"
```

---

### Task 7: 물결 시뮬레이션 + 부력 (페이즈 4) — 체크리스트 #6 #8 #9 점등

핑퐁 파동 방정식이 "내가 헤엄치면 진짜 물결이 퍼진다"의 근거다 (스펙 렌더링 레이어 4·5). jeantimex/threejs-water의 시뮬레이션 모듈을 포팅한다 — 어트리뷰션 주석 필수 (Task 5 서두).

**Files:**

- Create: `src/lib/pool/ripple.ts`
- Modify: `src/lib/pool/water.ts` (`uRippleTex` 실 바인딩), `src/lib/pool/floats.ts` (부력), `src/lib/pool/scene.ts` (시뮬 업데이트 순서)

**Interfaces:**

- Produces: `createRipple(renderer, size: 512 | 256): RippleSim`.

```ts
type RippleSim = {
  texture: THREE.Texture; // 현재 높이 필드 (water.ts의 uRippleTex)
  addImpulse(
    worldX: number,
    worldZ: number,
    strength: number,
    radius: number,
  ): void;
  step(dt: number): void; // 핑퐁 1스텝
  /** CPU 부력 샘플용 저해상도(64²) 높이 스냅숏. 매 프레임 1회 readback. */
  sampleHeight(worldX: number, worldZ: number): number;
  sampleNormal(worldX: number, worldZ: number): { x: number; z: number };
  setPaused(v: boolean): void;
};
```

Task 8(커스틱)·Task 9(아바타 임펄스)가 이 인터페이스를 쓴다.

- [ ] **Step 1: 핑퐁 시뮬레이션**

RT 두 장(`RGFormat` 또는 `RGBAFormat`, `FloatType` — 미지원 GPU는 `HalfFloatType` 폴백)을 번갈아 쓴다. 업데이트 프래그먼트의 수식(표준형 — 포팅 결과가 이 수식과 동치인지 확인):

```glsl
uniform sampler2D uPrev;  // t-1 높이(r) + 속도(g) 또는 t-1/t-2 2장 방식
uniform vec2 uTexel;
uniform float uDamping;   // 0.985 (판단 필요 J4 — 스펙 기준 ~0.98)
void main() {
  float c = texture2D(uPrev, vUv).r;
  float lap =
      texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
    + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
    + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
    + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r
    - 4.0 * c;
  // (2중 버퍼 파동 방정식: next = 2c - prev + lap * c2) * damping
  ...
}
```

**#9 벽 반사**: RT의 wrap을 `ClampToEdgeWrapping`으로 두면 경계에서 라플라시안이 자연스럽게 반사 경계 조건이 된다. jeantimex 구현이 별도 경계 처리를 하면 그걸 따른다.

`addImpulse`는 작은 가우시안 스플랫을 높이 필드에 더하는 별도 패스다.

- [ ] **Step 2: 부력 — floats.ts의 `updateFloats` 구현**

스펙 레이어 5가 부력의 전부다 — 물리 엔진 금지:

```ts
// 매 프레임, 부표마다:
const h =
  ripple.sampleHeight(f.worldX, f.worldZ) +
  gerstnerHeight(f.worldX, f.worldZ, t);
f.mesh.position.y = WATER_Y + h * f.bobScale; // wip은 bobScale 1.5로 더 들썩인다
const n = ripple.sampleNormal(f.worldX, f.worldZ);
f.mesh.rotation.x = n.z * TILT; // 기울기 노멀 추종. TILT 기본 0.6 (판단 필요 J4)
f.mesh.rotation.z = -n.x * TILT;
```

`sampleHeight`의 readback은 **매 프레임 1회, 64² 다운샘플 RT에서만** 한다 (부표 8개가 각자 GPU 동기화를 일으키면 안 된다). 들썩이는 부표는 자기 아래에 주기적으로 약한 임펄스를 넣는다(`addImpulse(x, z, 0.02, 0.15)`, 0.8초 간격) — 스펙 레이어 4.

- [ ] **Step 3: 검증 — 체크리스트 #6 #8 #9**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저에서: 물을 클릭해 임펄스를 넣는 임시 dev 핸들러(다음 태스크에서 아바타로 대체될 자리)로 —

- **#8** 파문이 퍼지고, 손을 떼면 잦아드는가 (damping)
- **#9** 가장자리에서 파문이 되돌아오는가
- **#6** 부표가 지나가는 파문을 따라 뜨고 기울어지는가 (기울기가 파면 법선을 따르는가)

프레임률 확인: 데스크톱에서 60fps 근처인지 브라우저 성능 패널로 본다. 크게 미달이면 여기서 멈추고 보고 — 이후 태스크가 더 얹기 전에 원인을 잡는다.

- [ ] **Step 4: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: add ripple simulation and float buoyancy"
```

---

### Task 8: 커스틱 + 포말 + 그림자 (페이즈 5) — 체크리스트 #5 #7 #10 점등

**5번이 아마추어와 프로를 가르는 항목이다** (스펙 「완성도 측정」): 커스틱은 스크롤 텍스처가 아니라 **시뮬레이션된 수면에서 differential-area 방식으로 계산**한다. 그래서 파문을 만들면 그 자리의 커스틱이 같이 변한다. 구현 전에 스펙 「참고 자료와 의존성」의 Wallace 커스틱 해설 글을 읽는다.

**Files:**

- Create: `src/lib/pool/caustics.ts`
- Modify: `src/lib/pool/scene.ts` (커스틱/그림자 마스크 패스), 바닥 셰이더 (커스틱 합성), `src/lib/pool/water.ts` (포말)

**Interfaces:**

- Consumes: Task 7의 `RippleSim.texture`(수면 높이 필드).
- Produces: `createCaustics(renderer, rippleTex): { texture: THREE.Texture; update(): void }` — 바닥 셰이더가 이 텍스처를 곱한다. `shadowMask: THREE.Texture` — 부표 실루엣의 탑다운 마스크.

- [ ] **Step 1: differential-area 커스틱 패스 (jeantimex 포팅)**

원리(포팅 대상이 이 원리를 구현하는지 확인): 수면 메시를 커스틱 RT에 그리되, 버텍스에서 태양광선을 수면 노멀로 굴절시켜 바닥 히트 지점으로 정점을 이동시키고, 프래그먼트에서 변형 전/후 면적비(`oldArea / newArea`, 파생 함수 기반)를 강도로 쓴다. 얇고 밝은 선 구조가 여기서 나온다.

- [ ] **Step 2: Hockney 포스터라이즈**

강도 필드에 임계값 — **커스틱 자체의 강도에 대한 임계값이지 최종 프레임 처리가 아니다** (스펙 「시각 스타일」 실패 모드):

```glsl
float intensity = ...; // differential-area 결과
// 판단 필요 J4: uThreshold 기본 0.85, 폭 0.05
float mark = smoothstep(uThreshold, uThreshold + 0.05, intensity);
float mid  = smoothstep(uThreshold - 0.25, uThreshold - 0.2, intensity) * 0.35;
gl_FragColor = vec4(vec3(max(mark, mid)), 1.0); // 2~3단계 흰 마크
```

바닥 셰이더에서: `floorColor = mix(floorColor, uCausticColor, causticMark * (1.0 - shadowMask))`.

- [ ] **Step 3: 그림자 마스크 — #10**

부표 메시들을 탑다운 카메라로 저해상도 RT(256²)에 실루엣 렌더(흰색, 배경 검정)한 뒤 약간 블러 없이 그대로 쓴다 — **하드 엣지가 스타일이다.** 바닥 셰이더에서 이 마스크가 커스틱을 죽이고(위 수식) 바닥을 어둡게 한다(`floorColor *= 1.0 - shadowMask * 0.45`). 정오의 짧은 그림자: 마스크 렌더 시 태양 방향으로 아주 작은 오프셋(월드 0.1)만 준다.

- [ ] **Step 4: 접촉 포말 — #7**

water.ts 프래그먼트에서 수심 차이 기반: 부표·벽과 만나는 곳(씬 깊이와 수면 깊이의 차가 작은 곳)에 흰 테두리. 하드 엣지 — `smoothstep` 폭을 최소로:

```glsl
float rim = 1.0 - smoothstep(0.0, uFoamWidth, depthGap); // uFoamWidth 기본 0.08 (판단 필요 J4)
color = mix(color, vec3(1.0), step(0.5, rim));
```

벽 쪽은 풀 가장자리와의 거리로 같은 처리를 한다.

- [ ] **Step 5: 검증 — 체크리스트 #5 #7 #10**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저에서:

- **#5** 물을 클릭해 파문을 만들고, **그 자리의 커스틱 마크가 같이 변형되는지** 본다. 커스틱이 파문과 무관하게 일정 패턴으로 흐르면 실패 — 스크롤 텍스처로 구현된 것이다. 다시 Step 1로.
- **#7** 부표 둘레와 벽 가장자리에 흰 테두리가 서는가, 경계가 하드한가
- **#10** 부표 그림자 안에서 커스틱이 죽는가

**판단 필요 (J4):** 임계값·마크 두께·그림자 농도의 미학 확정은 스크린샷으로 사람/Fable 확인. **여기가 이 프로젝트에서 가장 시간을 빨아들일 수 있는 지점이다** — 체크리스트 3개가 켜졌으면 튜닝을 멈추고 커밋한 뒤 다음 태스크로 간다. 미학 튜닝은 Task 13의 게이트에서 몰아서 한다.

- [ ] **Step 6: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: add differential-area caustics, contact foam and shadows"
```

---

### Task 9: 아바타 + 조작 (페이즈 6)

`ㅊ`가 헤엄친다. **불가침 규칙(스펙 「인터랙션」): 수영은 즐기는 레이어이지 통행료가 아니다** — 부표는 언제나 클릭/Enter 한 번으로 즉시 열린다. 이 태스크는 그 규칙을 깨지 않고 재미만 얹는다.

**Files:**

- Create: `src/lib/pool/avatar.ts`
- Modify: `src/lib/pool/scene.ts` (아바타 합류), `src/components/pool/PoolShell.tsx`·`PoolCanvasImpl.tsx` (입력 배선)

**Interfaces:**

- Consumes: Task 7 `RippleSim.addImpulse`, Task 2 `proxyEls`(포커스 추종), Task 1 positions(부표 월드 좌표).
- Produces: `createAvatar(colors): Avatar`.

```ts
type Avatar = {
  mesh: THREE.Object3D;
  setKeys(dx: number, dz: number): void; // -1..1 (방향키/WASD 합성)
  swimTo(worldX: number, worldZ: number): void; // 물 클릭/탭, 포커스 추종
  update(dt: number, ripple: RippleSim): void;
  /** 부표 반경 안에 dwellSeconds 이상 머물렀으면 해당 id 반환 (1회성) */
  pollDwell(): string | null;
  setReducedMotion(v: boolean): void; // true면 트위닝 없이 즉시 이동
};
```

- [ ] **Step 1: `avatar.ts` — ㅊ 글리프와 이동**

글리프는 텍스처로 만든다(웹폰트 추가 금지): 256² 오프스크린 캔버스에 `bold 200px 'Noto Sans KR', sans-serif`로 `ㅊ`를 `--pool-avatar` 색으로 그려 `THREE.CanvasTexture` → 수면 위 0.05의 PlaneGeometry(0.8×0.8)에 입힌다.

이동(스펙 튜닝값): 최대 속도 = `WORLD_DEPTH / 5`(풀 세로 5초 종단), 가속 후 감쇠 계수 0.92/frame로 글라이드. `swimTo` 목표가 있으면 그쪽으로 조향. 진행 방향으로 메시를 회전시킨다. 초기 위치는 **데크 중앙 바로 아래 사다리 지점** — `(0, WATER_Y, 데크 경계 z + 0.5)`. 고정값이다(테스트 결정성, 스펙 「검증」).

물결 자국: 이동 중 0.12초 간격으로 `ripple.addImpulse(pos.x, pos.z, 0.015, 0.1)`.

dwell: 부표 반경 0.7 안에 연속 1.0초 머물면 `pollDwell()`이 그 id를 반환한다. 벗어나면 타이머 리셋.

- [ ] **Step 2: 입력 배선 (PoolCanvasImpl)**

| 입력        | 처리                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 방향키/WASD | `window` keydown/keyup → `setKeys`. 창 라우트가 열려 있거나 포커스가 input/버튼이면 무시. 방향키는 `preventDefault()`(페이지 스크롤 방지)                                                   |
| 물 클릭/탭  | `.water` 영역 클릭(프록시 제외 — 이벤트 타깃이 `<a>` 내부면 무시) → 화면 좌표를 월드로 역변환해 `swimTo`                                                                                    |
| 부표 클릭   | **아무 처리 없음** — 프록시 `<a>`의 기본 내비게이션이 즉시 연다. 가로채지 마라                                                                                                              |
| Tab         | 프록시 `focus` 이벤트 리스너 → 해당 부표 좌표로 `swimTo` (포커스 추종)                                                                                                                      |
| Enter       | 포커스된 `<a>`의 기본 동작 — 코드 불필요                                                                                                                                                    |
| dwell       | 프레임 루프에서 `pollDwell()` → `useNavigate()`로 얻은 `navigate({ to: '/p/$id', params: { id } })` (PoolCanvasImpl은 React 컴포넌트이므로 훅 사용 가능 — navigate 함수를 씬 콜백에 넘긴다) |

- [ ] **Step 3: 검증**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저에서: 방향키로 헤엄 — 관성·글라이드가 느껴지고 뒤로 파문이 남는가(#5·#8이 아바타 임펄스에도 반응하는지 재확인). 물 클릭 → 그 지점으로 헤엄. 부표 클릭 → **아바타 위치와 무관하게 즉시** `/p/$id`. Tab → 포커스 링(물결 링)이 뜨고 아바타가 따라간다. 부표에 1초 머무르면 열린다. 창이 열린 상태에서 방향키가 씹히는가(무시 규칙).

- [ ] **Step 4: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: add swimming avatar with keyboard and pointer controls"
```

---

### Task 10: View Transition (페이즈 7)

프록시의 심볼이 창 헤더로 morph되고, 역방향은 줄어든다. 미지원 브라우저는 즉시 내비게이션 — 별도 분기 코드 없이 저하되어야 한다.

**Files:**

- Modify: `src/components/pool/FloatProxy.tsx`, `src/components/pool/FloatWindow.tsx`, `src/components/pool/Deck.tsx`, `src/routes/about.tsx`, `src/components/pool/PoolShell.tsx`(dwell 내비게이션), `src/styles/global.css`(전환 CSS 필요 시)

**Interfaces:**

- Consumes: Task 2·3의 `data-symbol-id` 지점들.
- Produces: 없음 (시각 효과 종단).

- [ ] **Step 1: TanStack Router의 view transition API 표면 확인**

**스펙 지시: 정확한 API는 설치 버전(1.170.29) 문서로 확인한다.** 예상 표면: `<Link viewTransition>` prop과 `navigate({ ..., viewTransition: true })` 옵션. context7 등으로 현행 문서를 조회해 실제 이름을 확정하고, 이 계획의 나머지 스텝에서 그 이름을 쓴다. 라우터가 내부에서 `document.startViewTransition` 존재를 확인하므로 미지원 브라우저 분기는 우리가 만들지 않는다.

- [ ] **Step 2: `view-transition-name` 부여**

- `FloatProxy`의 심볼 span: `style={{ viewTransitionName: `float-${float.id}` }}`
- `FloatWindow`의 타이틀바 심볼 span: 같은 이름 `float-${float.id}`
- `Deck`의 클립보드 span: `view-transition-name: window-about`
- `about.tsx`의 `.contentWrapper` div: `style={{ viewTransitionName: 'window-about' }}` — **about.tsx에서 이 한 줄 외에 아무것도 바꾸지 마라**

TS가 `viewTransitionName`을 CSSProperties로 거부하면 `style={{ ['viewTransitionName' as never]: ... }}` 대신 **`src/vite-env.d.ts`에 CSSProperties 보강을 추가**한다:

```ts
import 'react';
declare module 'react' {
  interface CSSProperties {
    viewTransitionName?: string;
  }
}
```

- [ ] **Step 3: 내비게이션에 viewTransition 적용**

프록시 Link, 창 닫기 navigate, 데크 이력서 Link, dwell 내비게이션, Esc 핸들러 — 풀 ↔ 창 ↔ about을 오가는 **모든** 내비게이션에 Step 1에서 확정한 옵션을 단다.

- [ ] **Step 4: 검증**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저(Chrome — View Transition 지원)에서: 프록시 클릭 → 심볼이 창 헤더로 morph. 닫기/Esc → 역방향. 데크 이력서 → about 창으로 morph, 캔버스는 언마운트(스펙: `/about`은 캔버스를 떠난다 — `_pool` 레이아웃 밖이므로 자동). morph 중 물이 계속 움직이는지(캔버스 유지) 확인. Safari 구버전 등 미지원 환경이 있으면 즉시 전환으로 동작하는지 확인(없으면 확인 불가로 기록만).

- [ ] **Step 5: 커밋**

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: morph float symbols into windows with view transitions"
```

---

### Task 11: 모바일 + reduced-motion + 성능 저하 경로 (페이즈 8)

**Files:**

- Modify: `src/components/pool/PoolCanvasImpl.tsx`, `src/lib/pool/scene.ts`, `src/lib/pool/ripple.ts`, `src/lib/pool/caustics.ts`, `src/lib/pool/avatar.ts`, `src/styles/Pool.module.css`

**Interfaces:**

- Produces: `PoolSceneOptions.reducedMotion`·`rippleSize`가 실제로 동작. 프레임 예산 초과 시 자동 다운그레이드.

- [ ] **Step 1: reduced-motion 경로**

`PoolCanvasImpl`에서 `matchMedia('(prefers-reduced-motion: reduce)')`를 읽어 opts로 전달 + change 리스너로 라이브 반영. 씬에서 (스펙 「접근성」 확정 동작):

- Gerstner 진폭 uniform 0
- `ripple.setPaused(true)`
- 커스틱: **한 프레임 계산 후 고정** — `caustics.update()`를 1회 부르고 이후 스킵 (정지 화면에도 커스틱 마크는 보인다)
- `avatar.setReducedMotion(true)` — 트위닝 없이 즉시 이동
- 프레임 루프는 유지하되(프록시 동기화·즉시 이동 반영) 물 관련 업데이트만 스킵

- [ ] **Step 2: 모바일**

judge: `matchMedia('(pointer: coarse)')` 또는 `innerWidth < 768` — 참이면 `rippleSize: 256`, 수면 분할 96². 세로 뷰포트에서 풀이 세로로 늘어나는 것은 Task 2의 % 레이아웃이 이미 보장한다 — 확인만 한다. 터치: 탭=클릭이므로 추가 코드 없음을 확인.

- [ ] **Step 3: 자동 다운그레이드**

`EXT_disjoint_timer_query_webgl2`는 어디서나 없으므로(스펙: 예산 검사는 개발 도구지 런타임 게이트가 아니다) 런타임 트리거는 **프레임 시간**으로 한다: scene.ts에서 rAF dt의 이동 평균(120프레임)이 16.6ms(모바일 33ms)를 넘으면 ripple RT를 한 단계 내린다(512→256, 256→128). 한 방향으로만, 세션당 최대 1회 로그와 함께.

- [ ] **Step 4: no-WebGL 경로 재확인**

Task 5의 `mode === 'none'` 분기가 살아 있는지: dev 도구에서 WebGL을 끄거나(크롬 `--disable-webgl`) `probe.getContext`를 강제로 null 리턴하게 임시 수정해 확인 — 밴드 배경 + 프록시 링크 + 창 + 목록이 전부 동작해야 한다. 확인 후 임시 수정 원복.

- [ ] **Step 5: 검증 + 커밋**

```bash
pnpm type-check && pnpm lint && pnpm build
```

브라우저: macOS 시스템 설정 또는 DevTools Rendering 탭에서 `prefers-reduced-motion` 에뮬레이션 → 물이 정지하고 커스틱이 정지 마크로 남고 아바타가 즉시 이동. 뷰포트를 iPhone 크기로 → 데크 위, 과거 아래 세로 흐름.

```bash
pnpm format && pnpm format:check
git add -A
git commit -m "feat: add reduced motion, mobile and no-webgl degradation paths"
```

---

### Task 12: 테스트 + 기준선 재생성 (페이즈 9)

랜딩이 완전히 바뀌었으므로 기준선을 다시 뜬다. WebGL 결정성은 마스킹이 아니라 **reduced-motion 강제**로 얻는다 (스펙 「검증」).

**Files:**

- Modify: `tests/pages.spec.ts`, `tests/pages.spec.ts-snapshots/` (재생성 커밋)

**Interfaces:**

- Consumes: `data-pool-ready` 속성(dom→canvas), reduced-motion 경로(Task 11).

- [ ] **Step 1: `tests/pages.spec.ts` 전체를 아래로 교체**

```ts
import { expect, test, type Page } from '@playwright/test';

// global.css가 Noto Sans KR을 Google Fonts에서 불러온다. 폰트가 자리잡기 전에
// 찍으면 스크린샷이 흔들리므로 로드 완료를 기다린다.
async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

// WebGL 출력은 실행 간 비결정적이다. 캔버스를 마스킹하는 대신 reduced-motion을
// 강제해 씬 자체를 결정적으로 만든다 (파도 0, 시뮬 정지, 정적 커스틱, 아바타 고정).
async function gotoPoolDeterministic(page: Page, url: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await waitForFonts(page);
  await page.waitForSelector('[data-pool-ready="canvas"]', { timeout: 15000 });
}

test('pool landing renders', async ({ page }) => {
  await gotoPoolDeterministic(page, '/');
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('about.png', { fullPage: true });
});

test('float proxies are ordered newest to oldest', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('nav[aria-label="풀에 떠 있는 것들"] a')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs).toEqual([
    '/p/jecheori',
    '/p/health-defense',
    '/p/pourover',
    '/p/knitt',
    '/p/blog',
    '/p/tistory',
    '/p/galpi',
    '/p/kinderguri',
  ]);
});

test('clicking a float opens its window route', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/p/jecheori"]').click();
  await page.waitForURL('/p/jecheori');
  await expect(page.getByRole('dialog', { name: '제철어리' })).toBeVisible();
});

test('escape closes the window back to the pool', async ({ page }) => {
  await page.goto('/p/jecheori');
  await page.keyboard.press('Escape');
  await page.waitForURL('/');
});

test('window close button navigates back to pool', async ({ page }) => {
  await page.goto('/p/pourover');
  await page.getByRole('dialog').locator('nav button').first().click();
  await page.waitForURL('/');
});

test('list toggle opens and closes the list window', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '목록으로 보기' }).click();
  const list = page.getByRole('dialog', { name: '목록으로 보기' });
  await expect(list).toBeVisible();
  await expect(list.locator('a[href^="/p/"]')).toHaveCount(8);
  await list.locator('nav button').first().click();
  await expect(list).not.toBeVisible();
});

test('deck clipboard navigates to about', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '이력서' }).click();
  await page.waitForURL('/about');
});

test('about minimize button toggles every details element', async ({
  page,
}) => {
  await page.goto('/about');
  const details = page.locator('details');
  const minimize = page.locator('nav button').nth(1);
  const openStates = () =>
    details.evaluateAll((els) =>
      els.map((el) => (el as HTMLDetailsElement).open),
    );

  expect(await details.count()).toBeGreaterThan(0);
  expect(await openStates()).not.toContain(false);

  await minimize.click();
  expect(await openStates()).not.toContain(true);

  await minimize.click();
  expect(await openStates()).not.toContain(false);
});

test('about close button navigates back to pool', async ({ page }) => {
  await page.goto('/about');
  await page.locator('nav button').first().click();
  await page.waitForURL('/');
});
```

주의: Tab 순회는 브라우저별 포커스 이동의 변덕 때문에 키 입력 대신 **DOM 순서 검사**(`float proxies are ordered ...`)로 커버한다 — 스펙의 "DOM 순서 = Tab 순서" 결정 덕에 동치다.

- [ ] **Step 2: 스테일 기준선 삭제 후 실행 — 실패 확인**

```bash
rm tests/pages.spec.ts-snapshots/landing-chromium-darwin.png
pnpm build
pnpm exec playwright test
```

Expected: `landing.png` 스냅숏 부재로 스크린샷 1건 실패(또는 자동 생성 안내), 나머지 상호작용 테스트는 통과, `about.png`는 기존 기준선과 일치(이번 작업이 `/about` 렌더를 바꾸지 않았다는 증거 — `lastUpdatedAt` 치환과 view-transition-name 스타일은 픽셀에 나타나지 않는다). **about.png가 실패하면 회귀다** — 원인을 잡기 전에 재기준선 금지.

- [ ] **Step 3: 기준선 재생성 — 판단 필요 (J6)**

```bash
pnpm exec playwright test --update-snapshots
pnpm exec playwright test
```

생성된 `landing-chromium-darwin.png`를 **열어서 본다**: 데크·밴드 물·부표 8개·심볼·아바타가 스펙의 화면과 맞는가. **육안 확인 결과와 근거를 기록한 뒤에만** 커밋한다 (CLAUDE.md: 근거 없는 재생성 금지). 확신이 없으면 이미지를 첨부해 사람/Fable에 확인.

Expected: 재실행 전체 통과 — 결정적이라는 증거. 스크린샷이 실행 간 흔들리면 reduced-motion 경로가 덜 결정적인 것이다(커스틱 고정 프레임 타이밍이 유력) — 마스킹으로 덮지 말고 원인을 고친다.

- [ ] **Step 4: 커밋**

```bash
pnpm format && pnpm format:check
git add tests/
git commit -m "test: cover pool interactions and rebaseline screenshots"
```

---

### Task 13: 완성도 게이트 + GPU 프로파일러 + 문서 갱신 (마무리)

스펙 「완성도 측정」의 세 겹을 전부 밟고, CLAUDE.md를 현실에 맞춘다.

**Files:**

- Create: `src/lib/pool/profiler.ts`, `docs/pool-references/README.md`
- Modify: `src/lib/pool/scene.ts` (프로파일러 훅), `CLAUDE.md`

- [ ] **Step 1: dev 전용 GPU 프로파일러**

`?profile` 쿼리 파람이 있을 때만 활성. `EXT_disjoint_timer_query_webgl2`로 패스별 GPU 시간을 재고 5초마다 콘솔에 표로 출력한다. 참조 구현은 [figma/webgl-profiler](https://github.com/figma/webgl-profiler) — 구조(쿼리 풀, 비동기 결과 수거)를 따른다.

```ts
export type PassName =
  'ripple' | 'caustics' | 'refraction-rt' | 'water' | 'scene-rest';

export function createProfiler(gl: WebGL2RenderingContext): {
  begin(pass: PassName): void;
  end(pass: PassName): void;
  /** 5초 윈도 평균(ms). GPU_DISJOINT_EXT가 참이었던 프레임은 버린다. */
  report(): Record<PassName, number> | null;
} | null; // 확장 미지원이면 null — 프로파일링 없이 정상 동작
```

`GPU_DISJOINT_EXT` 참이면 그 측정은 무효 처리(스펙 주의사항). 확장이 없으면 null을 반환하고 씬은 아무 영향 없이 돈다 — **개발 도구이지 런타임 게이트가 아니다.**

- [ ] **Step 2: GPU 예산 검사**

`pnpm dev` 후 `http://localhost:3000/?profile`에서 1분 방치, 콘솔 표를 스펙 예산과 대조한다:

| 패스          | 예산  |
| ------------- | ----- |
| ripple        | 1.5ms |
| caustics      | 2.0ms |
| refraction-rt | 3.0ms |
| water         | 4.0ms |
| scene-rest    | 3.0ms |
| (여유)        | 3.1ms |

초과 패스가 있으면: 해당 태스크(6–8)의 해상도·분할 파라미터를 낮춰 재측정. 예산 안이면 결과 수치를 최종 보고에 기록. `renderer.info`로 드로 콜 <30, 삼각형 수도 함께 기록.

- [ ] **Step 3: 물 현상 체크리스트 10/10 전수 — 판단 필요 (J9)**

브라우저에서 스펙 「완성도 측정」 표의 10행을 순서대로 밟고 각 행의 합격/불합격을 기록한다 (확인 방법은 표에 있다: #1 수심 색 구분, #2 먼 가장자리 밝음, #3 격자 일렁임, #4 수심 비례, #5 파문-커스틱 동기화, #6 부력·틸트, #7 접촉 포말, #8 감쇠, #9 벽 반사, #10 그림자가 커스틱 가림). 불합격 행이 있으면 해당 태스크로 돌아간다. **10/10의 최종 판정은 사람/Fable 확인을 받는다.**

- [ ] **Step 4: 30초 정지 화면 테스트 + 레퍼런스 — 판단 필요 (J7, J9)**

`docs/pool-references/README.md` 작성:

```markdown
# 풀 레퍼런스 이미지

스펙 「완성도 측정」의 정지 화면 테스트용. Hockney 레퍼런스 3–5장을 여기에 둔다
(Paper Pools 1978, A Bigger Splash 1967, Portrait of an Artist 1972 — 스펙
「참고 자료와 의존성」의 시각 레퍼런스 절 참고).

이미지는 저작권이 있으므로 **사람이 직접 확보해 추가한다** (커밋 여부 포함 판단).
비교 방법: 구현 스크린샷과 나란히 놓고, 강하게 블러한 버전끼리 명암 구조를
비교한다 (squint test).
```

이미지 확보와 30초 테스트("아무것도 만지지 않고 30초를 그냥 봤을 때 좋은가")의 판정은 사람/Fable 몫 — Codex는 스크린샷을 찍어 첨부하는 것까지 한다.

- [ ] **Step 5: `CLAUDE.md` 갱신**

스펙 「문서 갱신 (필수)」 그대로. 네 군데를 정확히 고친다 (「모델 분담」 절은 건드리지 않는다):

1. **첫 문단** — 사이트 설명 교체:

   현재의 "랜딩 화면과 이력서 화면 두 개로 이루어진 정적 사이트이며" 문장을 다음으로 교체:

   > 탑다운 수영장 랜딩(`/`), 부표별 창(`/p/$id`), 이력서(`/about`)로 이루어진
   > 정적 사이트이며 Vercel에 배포된다. 랜딩은 Three.js 물 캔버스 위에 DOM
   > 오버레이(부표 프록시 `<a>`)가 얹힌 구조다 — 캔버스가 없어도 완결 동작한다.

2. **「구조」절** — 트리를 다음으로 교체:

   ```
   src/
   ├── routes/
   │   ├── __root.tsx        루트 문서. <html lang="ko">, head(), global.css
   │   ├── _pool.tsx         풀 레이아웃 (캔버스 + 프록시 + <Outlet>)
   │   ├── _pool.index.tsx   / — 풀 (창 없음)
   │   ├── _pool.p.$id.tsx   /p/$id — 부표 창
   │   └── about.tsx         /about — 이력서 (캔버스 밖)
   ├── components/pool/      데크·프록시·창·목록·심볼·캔버스 경계
   ├── lib/pool/             Three.js 씬 (jeantimex/threejs-water 포팅 기반)
   ├── router.tsx            라우터 생성 (getRouter export)
   ├── routeTree.gen.ts      자동 생성. 커밋하되 직접 수정하지 않는다
   ├── contents/
   │   ├── pool.json         부표의 단일 데이터 소스 (전 필드 평문 — HTML 금지)
   │   ├── resume.json       이력서의 단일 데이터 소스 (최종 수정일 포함)
   │   └── types.ts + pool.ts/resume.ts   타입과 재수출 모듈
   └── styles/
       ├── global.css        CSS 변수 토큰 (--pool-* 포함) + 리셋
       └── *.module.css      화면별 CSS Modules
   ```

3. **「알아둘 것」절** —
   - "최종 수정" 예외 문단을 삭제하고 해당 자리에: `이력서 수정은 resume.json 한 파일로 닫힌다 ("최종 수정" 날짜는 lastUpdatedAt 필드).`
   - `pool.json` 문단 추가: `부표는 src/contents/pool.json에서 고친다. 전 필드 평문 — HTML 문자열 금지. 항목을 추가하면 /p/$id가 자동으로 생기므로 public/sitemap.xml에 URL을 추가한다. 세로 위치는 date에서 √ 매핑으로 계산된다 (lib/pool/positions.ts) — 선형으로 바꾸지 마라.`
   - 테스트 결정성 문단 추가: `Playwright 스크린샷은 reduced-motion을 강제해 캔버스를 결정적으로 만든 상태에서 찍는다 (tests/pages.spec.ts의 gotoPoolDeterministic). 캔버스를 마스킹하지 마라.`
   - 닫기 버튼 제약 문단에 한 문장 추가: `/p/$id 창의 신호등도 About.module.css를 공유하므로 같은 제약이다.`

4. **「기술 부채」절** — 다음 두 항목을 삭제: `resume.json에 타입 정의가 없다...`, `"최종 수정" 날짜가 about.tsx에 하드코딩되어 있다...`. 나머지 항목 유지.

5. **「테스트」절** — 첫 문단을 다음으로 교체:

   > `tests/pages.spec.ts`가 Playwright로 두 화면의 스크린샷(랜딩은 reduced-motion
   > 강제로 결정화), 부표 창 열기/닫기(클릭·Esc·닫기 버튼), 프록시 순서(최신→과거),
   > 목록 창 토글, 데크→이력서 내비게이션, `/about`의 `<details>` 토글을 검사한다.

- [ ] **Step 6: 최종 게이트 + 커밋**

```bash
pnpm type-check && pnpm lint && pnpm format && pnpm format:check && pnpm build && pnpm test
```

Expected: 전부 통과.

```bash
git add src/lib/pool/profiler.ts src/lib/pool/scene.ts docs/pool-references/README.md CLAUDE.md
git commit -m "docs: update project docs and add completion gate tooling"
```

- [ ] **Step 7: 최종 보고에 반드시 담을 것**

- 체크리스트 10행 각각의 합격/불합격과 확인 방법
- GPU 예산 표 실측치 + 드로 콜/삼각형 수
- 판단 필요 잔여 항목: J1(콘텐츠 문구·URL), J2(심볼 아트), J3·J4(미학 확정), J7(레퍼런스 이미지), J8(썸네일), J9(최종 판정)
- 30초 정지 화면 테스트용 스크린샷 첨부
- 저장소 밖 작업: Vercel 프리뷰에서 `/`·`/p/jecheori`·`/about` 확인 요청

---

## 커밋 요약 (분할 지점)

| #   | 커밋                                                              | 태스크                            |
| --- | ----------------------------------------------------------------- | --------------------------------- |
| 1   | `feat: add typed pool float data and time-axis mapping`           | T1                                |
| 2   | `refactor: type resume data and move last updated date into json` | T1                                |
| 3   | `feat: replace landing with dom pool layout and float proxies`    | T2                                |
| 4   | `feat: add float window route and list window`                    | T3                                |
| 5   | `chore: add pool float routes to sitemap`                         | T4 — **페이즈 1 완료, 배포 가능** |
| 6   | `feat: mount three.js static pool scene with proxy sync`          | T5                                |
| 7   | `feat: add banded water surface with refraction and fresnel`      | T6                                |
| 8   | `feat: add ripple simulation and float buoyancy`                  | T7                                |
| 9   | `feat: add differential-area caustics, contact foam and shadows`  | T8                                |
| 10  | `feat: add swimming avatar with keyboard and pointer controls`    | T9                                |
| 11  | `feat: morph float symbols into windows with view transitions`    | T10                               |
| 12  | `feat: add reduced motion, mobile and no-webgl degradation paths` | T11                               |
| 13  | `test: cover pool interactions and rebaseline screenshots`        | T12                               |
| 14  | `docs: update project docs and add completion gate tooling`       | T13                               |

모든 커밋 시점에서 `pnpm type-check && pnpm lint && pnpm format:check && pnpm build`가 그린이어야 한다. `pnpm test`는 T1(기존 기준선)과 T12 이후(새 기준선)에서만 그린이다 — T2~T11 사이에는 돌리지 않는다(랜딩 기준선이 무효인 구간).
