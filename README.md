# haneulcha.com

차하늘의 개인 웹사이트. 랜딩 페이지와 이력서 두 개의 화면으로 이루어져 있다.

- 배포: [haneulcha.com](https://haneulcha.com) (Vercel)

## 화면

| 경로     | 설명                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| `/`      | 랜딩. 「ㅊ · ㅎ · ㄴ」 세 글자 타이포그래피. ㅊ은 이력서로, ㅎ은 블로그로 이동한다.        |
| `/about` | 이력서. macOS 창을 흉내낸 타이틀바를 두고, 내용은 `src/contents/resume.json`에서 렌더한다. |

## 기술 스택

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- CSS Modules + CSS 사용자 정의 속성(변수) 기반 토큰
- pnpm / Node 22

## 시작하기

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있다.

## 명령어

| 명령              | 설명                 |
| ----------------- | -------------------- |
| `pnpm dev`        | 개발 서버 실행       |
| `pnpm build`      | 프로덕션 빌드        |
| `pnpm start`      | 빌드 결과물 실행     |
| `pnpm type-check` | TypeScript 타입 검사 |
| `pnpm lint`       | ESLint 검사          |
| `pnpm format`     | Prettier 포매팅      |
| `pnpm commit`     | Commitizen으로 커밋  |

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

`src/contents/resume.json` 한 곳만 고치면 된다. 컴포넌트를 건드릴 일은 없다.
`experience[].section[].title`과 `jobs[].detail[]`은 HTML 문자열로 렌더되므로
(`dangerouslySetInnerHTML`) 태그를 넣을 수 있다. 외부 입력이 아닌 직접 작성한
콘텐츠에만 해당한다.

수정 후에는 `/about` 상단의 "최종 수정" 날짜도 함께 갱신한다.

## 커밋 규칙

[Conventional Commits](https://www.conventionalcommits.org)를 따르며 commitlint가 강제한다.
`pnpm commit`을 쓰면 형식에 맞게 안내해 준다.

## 라이선스

MIT. [LICENSE.md](LICENSE.md) 참고.

이 프로젝트는 [jpedroschmitz/typescript-nextjs-starter](https://github.com/jpedroschmitz/typescript-nextjs-starter)
템플릿에서 시작했다. 원저작자의 저작권 고지를 LICENSE에 함께 남겨 두었다.
