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

**이력서 내용은 `src/contents/resume.json`만 고친다.** `/about`은 이 JSON을 그대로
렌더한다. 항목을 추가·수정할 때 컴포넌트를 손댈 일은 없다. 수정 후 `about/page.tsx`
상단의 "최종 수정" 날짜도 함께 갱신한다.

**`/about`은 파일 전체가 클라이언트 컴포넌트다.** `useRouter`와 `document` 접근 때문인데,
원래는 타이틀바 버튼만 분리하는 게 맞다. 아래 기술 부채 참고.

**`About.module.css`가 `td[scope='row']`와 `td:nth-of-type(2)`를 선택자로 쓴다.**
테이블 마크업을 `th`로 고치려면 CSS를 같이 고쳐야 한다. 한쪽만 바꾸면 레이아웃이 깨진다.

**색은 `global.css`의 CSS 변수를 쓴다** (`--color`, `--bg`, `--point-color`,
`--point-color-hover`, `--point-color-selection`, `--border-color`). 값을 직접 박지 않는다.

**`dangerouslySetInnerHTML`이 `/about`에 두 군데 있다.** `resume.json`의 문자열에
HTML 태그를 허용하기 위한 것이다. 데이터가 저장소 안의 직접 작성한 콘텐츠일 때만 성립하는
전제이므로, 외부 입력을 이 경로에 연결하지 않는다.

## 컨벤션

- 커밋은 [Conventional Commits](https://www.conventionalcommits.org). commitlint가 강제한다.
  `pnpm commit`으로 안내를 받을 수 있다.
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

기능 개선 전 기반 정비(2026-08) 때 범위 밖으로 남긴 것들이다.

- `about/page.tsx`가 200줄 단일 컴포넌트다. 섹션별로 쪼개고 타이틀바만 클라이언트
  컴포넌트로 분리하면 본문은 서버 컴포넌트가 될 수 있다.
- `resume.json`에 타입 정의가 없다. 구조적 추론에만 기대고 있다.
- 테이블 접근성: `<td scope="row">`는 `<th scope="row">`여야 한다 (CSS 동반 수정 필요).
- 테스트가 없다.
- OG 이미지, sitemap, robots.txt가 없다.
- `layout.tsx`의 description이 같은 말을 반복하는 키워드 나열이다. 다시 쓸 가치가 있다.
