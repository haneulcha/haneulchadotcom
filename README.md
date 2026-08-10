# haneulcha.com

차하늘의 개인 웹사이트. 랜딩과 이력서, 두 화면으로 이루어져 있다.

- 배포: [haneulcha.com](https://haneulcha.com) (Vercel)

## 화면

| 경로     | 설명                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------- |
| `/`      | 랜딩. 이름의 초성 ㅊ·ㅎ·ㄴ을 세운 타이포그래피. ㅊ은 이력서로, ㅎ은 블로그로 이동하고 ㄴ은 장식이다. |
| `/about` | 이력서. macOS 창을 흉내낸 타이틀바를 두고, 내용은 `src/contents/resume.json`에서 렌더한다.           |

## 기술 스택

- [Next.js](https://nextjs.org) (App Router) / React
- TypeScript
- CSS Modules + CSS 변수 토큰
- pnpm / Node

정확한 버전은 `package.json`과 `.nvmrc`를 본다. TypeScript와 ESLint는 의도적으로 최신보다
한 단계 낮게 고정해 두었고, 그 이유는 [CLAUDE.md](CLAUDE.md)에 적어 두었다.

## 시작하기

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있다.

## 명령어

| 명령                | 설명                         |
| ------------------- | ---------------------------- |
| `pnpm dev`          | 개발 서버 실행               |
| `pnpm build`        | 프로덕션 빌드                |
| `pnpm start`        | 빌드 결과물 실행             |
| `pnpm type-check`   | TypeScript 타입 검사         |
| `pnpm lint`         | ESLint 검사                  |
| `pnpm format`       | Prettier 포매팅              |
| `pnpm format:check` | 포매팅 검사 (CI가 쓰는 모드) |
| `pnpm commit`       | Commitizen으로 커밋          |

## 디렉터리 구조

```
src/
├── app/          라우트. layout.tsx가 루트 셸, page.tsx가 각 화면
├── contents/     콘텐츠 데이터. resume.json이 이력서의 단일 소스
└── styles/       global.css(토큰·리셋) + 화면별 *.module.css
public/           정적 자산
docs/             설계 문서
```

`@/` 별칭으로 `src/` 아래를, `@/public/` 별칭으로 `public/` 아래를 가리킨다.

## 이력서 내용 수정

내용은 `src/contents/resume.json`에서 고친다. 항목을 추가하거나 바꿔도 컴포넌트 구조를
건드릴 일은 없다. `experience[].section[].title`과 `jobs[].detail[]`은 HTML 문자열로
렌더되므로(`dangerouslySetInnerHTML`) 태그를 넣을 수 있다. JSON 문자열 안이라 속성에는
작은따옴표를 쓴다. 외부 입력이 아닌 직접 작성한 콘텐츠에만 해당한다.

단, "최종 수정" 날짜는 예외다. `src/app/about/page.tsx`에 하드코딩되어 있어 거기서
함께 갱신해야 한다.

## 커밋 규칙

[Conventional Commits](https://www.conventionalcommits.org)를 따르며 commitlint가 강제한다.
`pnpm commit`을 쓰면 형식에 맞게 안내해 준다.

## 라이선스

MIT. [LICENSE.md](LICENSE.md) 참고.

이 프로젝트는 [jpedroschmitz/typescript-nextjs-starter](https://github.com/jpedroschmitz/typescript-nextjs-starter)
템플릿에서 시작했다. 원저작자의 저작권 고지를 LICENSE에 함께 남겨 두었다.
