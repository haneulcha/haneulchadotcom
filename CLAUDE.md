# CLAUDE.md

차하늘의 개인 웹사이트(haneulcha.com). 랜딩 화면과 이력서 화면 두 개로 이루어진
정적 사이트이며 Vercel에 배포된다.

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
│   ├── __root.tsx      루트 문서. <html lang="ko">, head(), global.css
│   ├── index.tsx       / — 랜딩
│   └── about.tsx       /about — 이력서
├── router.tsx          라우터 생성 (getRouter export)
├── routeTree.gen.ts    자동 생성. 커밋하되 직접 수정하지 않는다
├── contents/
│   └── resume.json     이력서의 단일 데이터 소스
└── styles/
    ├── global.css      CSS 변수 토큰 + 리셋
    └── *.module.css    화면별 CSS Modules
```

경로 별칭은 `@/*` → `src/*`, `@/public/*` → `public/*`. **`tsconfig.json`과
`vite.config.ts` 양쪽에 있으므로 바꿀 때 둘 다 고쳐야 한다.** `vite.config.ts`의 alias
배열은 순서가 중요하다 — `@/public`이 `@`보다 앞에 와야 한다.

## 알아둘 것

**이력서 내용은 `src/contents/resume.json`에서 고친다.** `/about`은 이 JSON을 그대로
렌더하므로 항목을 추가·수정할 때 컴포넌트 구조를 손댈 일은 없다. **예외가 하나 있다** —
"최종 수정" 날짜만은 `src/routes/about.tsx`에 하드코딩되어 있어 거기서 갱신해야 한다
(이 날짜를 JSON으로 옮기는 건 아래 기술 부채에 있다).

**`resume.json` 안의 HTML 문자열은 속성에 작은따옴표를 쓴다** (`<a href='...'>`).
JSON 문자열 안이라 큰따옴표를 쓰면 이스케이프해야 한다. 기존 관례를 따라라.

**`package.json`의 `"type": "module"`을 지우지 마라.** 없으면 `vite.config.ts`가 CJS로
취급되고, ESM 전용인 `@tanstack/react-start/plugin/vite` 로드에 실패해 빌드가 죽는다.

**`about.tsx`의 닫기 버튼은 `<button>`이어야 한다.** `About.module.css`가
`.buttonWrapper button`으로 엘리먼트 선택자를 쓰기 때문에 `<Link>`(=`<a>`)로 바꾸면
타이틀바 신호등 스타일이 깨진다. 그래서 라우팅에 `<Link>`가 아니라 `useNavigate()`를 쓴다.

**`about.tsx`의 `className={`aboutPage ${styles.main}`}`에서 `aboutPage`는 전역
클래스다.** CSS Modules 클래스가 아니라 `global.css`의 `.aboutPage *::selection`이 걸려
있다. 지우면 텍스트 선택 하이라이트 색이 조용히 사라진다.

**새로 추가하는 색은 `global.css`의 CSS 변수를 쓴다** (`--color`, `--bg`, `--point-color`,
`--point-color-hover`, `--point-color-selection`, `--border-color`). 다만 기존 코드에는
하드코딩된 색이 많이 남아 있고, 대부분은 의도된 것이다 — `About.module.css`의 macOS
타이틀바·신호등 버튼 색과 `Home.module.css`의 랜딩 타이포 색은 토큰화 대상이 아니다.
시키지 않은 색 리팩터링을 시작하지 마라.

**`dangerouslySetInnerHTML`이 `/about`에 두 군데 있다.** `resume.json`의 문자열에
HTML 태그를 허용하기 위한 것이다. 데이터가 저장소 안의 직접 작성한 콘텐츠일 때만 성립하는
전제이므로, 외부 입력을 이 경로에 연결하지 않는다.

**라우트를 추가하면 `public/sitemap.xml`도 갱신한다.** 생성기를 붙이지 않고 정적 파일로
관리한다.

## 테스트

`tests/pages.spec.ts`가 Playwright로 두 라우트의 스크린샷과 상호작용(`<details>` 전체 토글,
닫기 버튼 내비게이션)을 검사한다. 기준선 PNG는 `tests/pages.spec.ts-snapshots/`에 커밋돼 있다.

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

Fable5는 판단과 설계와 품질 게이트에 충실하며, 리서치는 Sonnet, 구현은 Codex, 기계 작업은
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

- `about.tsx`가 183줄 단일 컴포넌트다. 섹션별로 쪼갤 여지가 있다.
- `resume.json`에 타입 정의가 없다. 구조적 추론에만 기대고 있다.
- "최종 수정" 날짜가 `about.tsx`에 하드코딩되어 있다. `resume.json`으로 옮기면
  이력서 수정이 JSON 한 파일로 닫힌다.
- Playwright 기준선이 darwin 전용이라 CI에 붙어 있지 않다. CI에서 돌리려면 리눅스
  기준선을 함께 만들거나 컨테이너로 렌더 환경을 고정해야 한다.
- OG 이미지가 없다.
- `__root.tsx`의 description이 같은 말을 반복하는 키워드 나열이다. 다시 쓸 가치가 있다.
