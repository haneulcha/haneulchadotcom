# CLAUDE.md

차하늘의 개인 웹사이트(haneulcha.com). 랜딩 화면과 이력서 화면 두 개로 이루어진
정적 사이트이며 Vercel에 배포된다.

## 명령어

```bash
pnpm dev           # 개발 서버 (http://localhost:3000)
pnpm build         # 프로덕션 빌드. 타입 검사를 겸한다
pnpm type-check    # tsc
pnpm lint          # eslint (flat config)
pnpm format        # prettier --write .
pnpm format:check  # CI가 쓰는 검사 모드
```

패키지 매니저는 **pnpm**이다 (`packageManager` 필드에 고정). npm이나 yarn을 쓰지 않는다.
Node는 `.nvmrc`의 22를 따른다.

## 구조

```
src/
├── app/
│   ├── layout.tsx      루트 셸. <html lang="ko">, global.css, metadata
│   ├── page.tsx        / — 랜딩. 서버 컴포넌트
│   └── about/page.tsx  /about — 이력서. 클라이언트 컴포넌트
├── contents/
│   └── resume.json     이력서의 단일 데이터 소스
└── styles/
    ├── global.css      CSS 변수 토큰 + 리셋
    └── *.module.css    화면별 CSS Modules
```

경로 별칭은 `@/*` → `src/*`, `@/public/*` → `public/*`.

## 알아둘 것

**이력서 내용은 `src/contents/resume.json`에서 고친다.** `/about`은 이 JSON을 그대로
렌더하므로 항목을 추가·수정할 때 컴포넌트 구조를 손댈 일은 없다. **예외가 하나 있다** —
"최종 수정" 날짜만은 `src/app/about/page.tsx:42`에 하드코딩되어 있어 거기서 갱신해야 한다
(이 날짜를 JSON으로 옮기는 건 아래 기술 부채에 있다).

**`resume.json` 안의 HTML 문자열은 속성에 작은따옴표를 쓴다** (`<a href='...'>`).
JSON 문자열 안이라 큰따옴표를 쓰면 이스케이프해야 한다. 기존 관례를 따라라.

**`/about`은 파일 전체가 클라이언트 컴포넌트다.** `useRouter`와 `document` 접근 때문인데,
원래는 타이틀바 버튼만 분리하는 게 맞다. 아래 기술 부채 참고.

**`About.module.css`가 `td[scope='row']`와 `td:nth-of-type(2)`를 선택자로 쓴다.**
테이블 마크업을 `th`로 고치려면 CSS를 같이 고쳐야 한다. 한쪽만 바꾸면 레이아웃이 깨진다.

**`about/page.tsx`의 `className={`aboutPage ${styles.main}`}`에서 `aboutPage`는 전역
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

## 컨벤션

- 커밋은 [Conventional Commits](https://www.conventionalcommits.org). commit-msg 훅과 CI
  양쪽에서 commitlint가 강제하며, CI는 PR의 모든 커밋을 검사한다. 메시지는 직접 형식에 맞춰
  써라 — `pnpm commit`(Commitizen)은 대화형 프롬프트라 사람용이다.
- 포매팅은 Prettier가 전담한다. ESLint는 포매팅 규칙을 갖지 않는다
  (`eslint-config-prettier`로 충돌 규칙을 꺼 둔다).
- pre-commit에서 lint-staged가, commit-msg에서 commitlint가 husky를 통해 돈다.

## 버전이 최신이 아닌 이유

두 패키지는 의도적으로 한 단계 낮다. 올리지 말 것. 상류 지원이 붙으면 renovate가 PR을 올린다.

- **TypeScript 6.0.3** (최신 7.0.2): `typescript-eslint`가 TS 7.0에서 실행을 거부한다.
- **ESLint 9.39.5** (최신 10.8.1): `eslint-config-next`가 의존하는 `eslint-plugin-react`
  최신판이 `eslint ^9.7`까지만 지원한다.

배경은 `docs/superpowers/specs/2026-08-10-stack-modernization-design.md` 참고.

## 기술 부채

기능 개선 전 기반 정비(2026-08) 때 범위 밖으로 남긴 것들이다. **이 목록이 정본이다** —
설계 문서에도 같은 목록이 있지만 그건 작성 시점의 스냅숏이다.

- `about/page.tsx`가 200줄 단일 컴포넌트다. 섹션별로 쪼개고 타이틀바만 클라이언트
  컴포넌트로 분리하면 본문은 서버 컴포넌트가 될 수 있다.
- `resume.json`에 타입 정의가 없다. 구조적 추론에만 기대고 있다.
- "최종 수정" 날짜가 `about/page.tsx`에 하드코딩되어 있다. `resume.json`으로 옮기면
  이력서 수정이 JSON 한 파일로 닫힌다.
- 테이블 접근성: `<td scope="row">`는 `<th scope="row">`여야 한다 (CSS 동반 수정 필요).
- `About.module.css:168`의 `#0550ae`는 `--point-color`와 같은 값이다. 그 파일을 만질 일이
  있으면 `var(--point-color)`로 바꿔라. (다른 하드코딩 색은 의도된 것이다 — 위 참고)
- 테스트가 없다.
- OG 이미지, sitemap, robots.txt가 없다.
- `layout.tsx`의 description이 같은 말을 반복하는 키워드 나열이다. 다시 쓸 가치가 있다.
