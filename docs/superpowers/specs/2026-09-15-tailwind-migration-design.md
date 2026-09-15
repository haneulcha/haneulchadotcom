# Tailwind 전면 교체 — 설계

CSS Modules 두 파일(`About.module.css` 344줄, `Home.module.css` 129줄)을 걷어내고
Tailwind v4 유틸리티로 옮긴다. **색은 한 글자도 바꾸지 않는다.**

이 작업 자체가 목적은 아니다. 디자인 시스템(컬러 팔레트 → 토큰 → 컬러 바)을 이
사이트에 들이는 작업의 첫 단계이고, 토큰이 `@theme`를 통해 유틸리티로 내려오려면
Tailwind가 먼저 깔려 있어야 한다.

## 왜 별도 스펙인가

전체 작업은 네 덩어리다. 한 스펙에 묶지 않는 이유는 **합격 기준이 서로 충돌하기**
때문이다.

|     | 스펙                             | 합격 기준                       |
| --- | -------------------------------- | ------------------------------- |
| ①   | **Tailwind 전면 교체** (이 문서) | 스크린샷 **무변화**. 색 불변    |
| ②   | 토큰 도입 + 랜딩 세 글자 토큰화  | 의도한 색 변화만. 기준선 재생성 |
| ③   | 컬러 바 (컨트롤 스트립)          | 새 컴포넌트                     |
| ④   | 이력서에 디자인 시스템 항목 추가 | `resume.json`만                 |

①은 "픽셀이 안 움직여야" 성공이고 ②는 "색이 바뀌어야" 성공이다. 섞으면 diff가
났을 때 Tailwind 탓인지 색 탓인지 가릴 수 없다. ②는 ①이 닫힌 뒤 그 결과 위에서
다시 설계한다.

확정된 팔레트(②의 입력):

```
https://haneulcha.github.io/design-system-starter/color-palette?v=1&a=fa862e&n=green-soft&t=7-&ts=8-
```

액센트 `#fa862e`(주황, H 52.6°), 뉴트럴 그린 그레이(세이지), 대비 보정 2건 적용.
이 스펙에서는 **쓰지 않는다.** 기록만 해 둔다.

## 합격 기준

**`tests/pages.spec.ts-snapshots/`의 PNG 두 장이 그대로여야 한다.**

이것이 이 스펙의 핵심 규칙이다. preflight를 끄면 리셋이 `global.css` 그대로이고
색 정의도 그대로이므로, 포팅이 충실하다면 렌더 결과가 같을 수밖에 없다. 따라서
기준선은 재생성 대상이 아니라 **교체가 맞았는지 재는 자**다.

> 스크린샷이 실패하면 기준선을 다시 뜨지 않는다. 포팅을 고친다.

CLAUDE.md는 이미 "근거 없이 재생성하면 회귀를 정상으로 굳힌다"고 적어 두었다. 이
스펙에서는 그보다 강하게 — 재생성 자체를 금지한다. ②에서 색이 바뀔 때 비로소
재생성한다.

## 도입 방식

`@tailwindcss/vite` 플러그인을 `vite.config.ts`의 `plugins` 배열에 추가한다.
`design-system-starter/web`이 이미 같은 플러그인으로 돌고 있어 검증된 경로다.

`global.css` 맨 위를 이렇게 연다:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```

**preflight를 넣지 않는다.** `tailwindcss/preflight.css`를 빼는 것이 위 세 줄의
전부다. 이유:

1. `global.css`에 이미 리셋이 있다 — `html,body { padding:0; margin:0 }`,
   `* { box-sizing: border-box }`, `button { all: unset }`, 제목·`p` margin 0.
   preflight는 그 위에 겹쳐지는 중복이다.
2. 겹치면 반드시 어딘가 어긋난다. preflight의 `button` 규칙과 `all: unset`,
   제목의 `font-size: inherit`, `ul/ol` 초기화가 전부 후보다.
3. 끄면 시각 변화가 0이라 **합격 기준이 깨끗하게 성립한다.** 도입 성공을
   "스크린샷이 통과했다"로 증명할 수 있다.

Google Fonts의 Noto Sans KR `@import`는 그대로 둔다. 테스트가
`document.fonts.ready`를 기다리는 전제가 바뀌지 않는다.

## 색을 바꾸지 않는 방법

`@theme` 블록을 **이 스펙에서는 만들지 않는다.** CSS 변수 6개(`--color`, `--bg`,
`--point-color`, `--point-color-hover`, `--point-color-selection`,
`--border-color`)는 `global.css`의 `:root`에 지금 모습 그대로 남고, 유틸리티는
arbitrary value로 그 변수를 가리킨다.

```
color: var(--point-color)   →   text-[var(--point-color)]
```

변수 정의가 한 글자도 안 바뀌므로 계산되는 색이 같다. `@theme` 기반 유틸리티
(`text-accent-text` 등)로 갈아타는 것은 ②에서 `palette.theme.css`를 넣을 때 한다.

하드코딩된 색(타이틀바 그라디언트 `#ebebeb`→`#d5d5d5`, 신호등 `#ff6057`
`#ffbd2e` `#27c93f`, 랜딩 타이포 `#ad1d1d` `#736356` `#261201`, 푸터 `#bfb1a8`,
`.contentWrapper`의 `#acacac`)도 전부 리터럴 arbitrary value로 그대로 옮긴다.
랜딩 세 글자를 토큰으로 바꾸는 것은 ②의 일이다.

## 무엇을 옮기나

`About.module.css`는 클래스 16개 + **자손 선택자 27개**로 이루어져 있다. 자손
선택자가 문제의 핵심이다 — 지금은 `.content h1` 하나가 JSX의 맨 `<h1>`을
스타일링하지만, 유틸리티로 가면 그 클래스가 `<h1>`에 직접 올라와야 한다.

옮겨야 하는 자손 선택자 27개:

```
.buttons:hover a          .content h1               .content h2
.content h3               .content p                .buttonWrapper button
.experienceSection > p    .experienceSection > ul   .experienceSection h4
.experienceSection h4 div .experienceSection h4 span
.experienceSection details              .experienceSection details ul
.experienceSection details li           .experienceSection details li div
.experienceSection details summary      .experienceSection details summary span
.experienceSection > p:nth-of-type(2) > span (+ ::after)
.infoTable caption        .infoTable tr             .infoTable tr th
.infoTable tr td          .language ul              .language ul li
.language ul span (+ ::after)           .main a     .main p
```

`Home.module.css`는 129줄 중 **`.description` `.code` `.grid` `.card` `.logo`와
그에 딸린 `@media`가 죽어 있다.** `index.tsx`가 참조하지 않는다 — Next.js 스타터
잔재다. 교체하면서 함께 사라진다. 살아있는 것은 `.container` `.main` `.footer`
`.title` `.typo1` `.typo2` `.typo3` 일곱 개뿐이다.

## about.tsx를 함께 쪼갠다

27개 자손 선택자가 전부 JSX로 올라오면 지금도 188줄인 단일 컴포넌트가 더
두꺼워진다. CLAUDE.md의 기술 부채 1번이 정확히 이것이다 — "`about.tsx`가 183줄
단일 컴포넌트다. 섹션별로 쪼갤 여지가 있다" (적힌 시점 이후 다섯 줄 늘었다).
유틸리티를 붙이는 바로 그 순간이 쪼개기 가장 자연스러운 시점이므로 같이 한다.

`src/components/about/` 아래로 분리한다:

| 컴포넌트         | 담당                                                |
| ---------------- | --------------------------------------------------- |
| `TitleBar`       | macOS 타이틀바 + 신호등 버튼 3개 + 토글/내비 핸들러 |
| `InfoTable`      | `infoLink` 표                                       |
| `ExperienceItem` | 회사 1건 — 헤더, 기술 스택, `section[]` 반복        |
| `JobDetails`     | `<details>` + `<summary>` + 상세 `<ul>`             |
| `PortfolioItem`  | 개인 프로젝트 1건                                   |
| `LanguageList`   | 언어 섹션                                           |
| `about.tsx`      | 데이터 주입과 조립만                                |

경계 기준은 **`resume.json`의 데이터 모양**이다. `experience[]`, `portfolio[]`,
`language[]`가 이미 독립된 배열이므로 컴포넌트도 거기서 갈린다. 새 추상을
발명하지 않는다.

`<details>` 전체 토글은 `TitleBar`의 최소화 버튼이 `document.querySelectorAll`로
DOM을 직접 만지는 지금 방식을 유지한다. 상태를 끌어올려 prop으로 내리면 컴포넌트
경계가 데이터가 아니라 인터랙션을 따라 휘고, 테스트가 보는 동작도 바뀐다.

## 남기는 예외 — `dangerouslySetInnerHTML`

**전면 교체는 완전히 달성될 수 없다.** `resume.json`의 문자열 두 자리가
`dangerouslySetInnerHTML`로 들어가고 그 안에 `<a>` 태그가 있다:

- `experience[].section[].title` — 회사/서비스 링크
- `experience[].section[].jobs[].detail[]` — 상세 항목 안의 링크

이 `<a>`들은 React가 만든 노드가 아니라 브라우저가 문자열을 파싱해 만든
노드이므로 JSX에서 `className`을 붙일 수 없다. JSON을 고쳐 HTML을 걷어내지 않는
한 자손 선택자가 반드시 하나 남는다.

`resume.json`을 고치는 선택지는 **택하지 않는다.** CLAUDE.md가 "이력서 수정은
`resume.json` 한 파일로 닫힌다"를 이 사이트의 성질로 명시하고 있고, HTML을
걷어내면 링크를 넣을 때마다 컴포넌트를 고쳐야 한다. 그 편의가 유틸리티 순수성보다
값어치 있다.

따라서 `global.css`에 규칙 하나를 남긴다:

```css
/* resume.json의 HTML 문자열 안에 있는 <a>. dangerouslySetInnerHTML이 만든
   노드라 JSX에서 className을 못 붙인다 — Tailwind로 옮길 수 없는 유일한 규칙.
   이력서 링크를 JSON에 두는 대가이고, 그 편의를 유지하기로 한 결정의 결과다. */
.resumeHtml a {
  color: var(--point-color);
}
.resumeHtml a:hover {
  color: var(--point-color-hover);
}
```

지금 `.main a` / `.main a:hover`가 하던 일을 그대로 옮긴 것이다. 값이 같으므로
`dangerouslySetInnerHTML` 안의 링크는 픽셀이 안 움직인다.

`dangerouslySetInnerHTML`을 쓰는 두 자리의 래퍼에 `resumeHtml` 클래스를 붙인다.
지금은 `.main a`가 `/about` 전체의 링크를 잡고 있는데, 그 범위를 이 두 자리로
좁히는 셈이라 오히려 명시적이 된다.

## 까다로운 지점 다섯 개

**1. 소제목 앞의 점.** `.content h2::before { content: '˙'; font-size: 56px;
line-height: 28px; color: var(--point-color) }` →
`before:content-['˙'] before:text-[56px] before:leading-[28px]
before:text-[var(--point-color)]`. `h2`가 `margin-left: -1.8rem`로 밀려 있는
것까지 같이 옮겨야 위치가 맞는다.

**2. 문자열 리스트 마커.** `.experienceSection details ul { list-style-type: '•' }`
는 따옴표가 들어간 값이라 arbitrary value 문법에서 이스케이프가 필요하다.
`[list-style-type:'•']`가 통하는지 실제로 렌더해 확인한다. 안 되면 이 한 줄은
예외 CSS로 남긴다 — 무리해서 우회하지 않는다.

**3. `nth-of-type` 구조 선택자.** `.experienceSection > p:nth-of-type(2) > span`은
"기술 스택" 라벨을 잡는다. Tailwind는 부모에서 자식의 구조를 지목하는 선택자를
표현하지 않는다. **해당 `<span>`에 클래스를 직접 붙여** 구조 의존을 없앤다.
`<p>`의 순서가 바뀌어도 안 깨지므로 순수한 개선이다.

**4. 선택 하이라이트.** `.main p::selection`(과 짝인 `::-moz-selection`)은
`p` 안의 텍스트를 드래그했을 때 색을 바꾼다. Tailwind의 `selection:` 변형으로
`selection:bg-[var(--point-color)] selection:text-[var(--bg)]`이 된다.
**`::-moz-selection`은 버리고 가져오지 않는다** — Firefox가 62부터 표준
`::selection`을 지원하므로 죽은 규칙이고, 기준선을 찍는 chromium에서는 애초에
관여하지 않는다. `global.css`의 `.aboutPage *::selection`은 별개이며 그대로
남는다.

**5. 좁은 화면에서 표 무너뜨리기.** `@media (max-width: 320px)`에서 `tr`/`th`/`td`를
`display: block`으로 바꾸는 규칙 → `max-[320px]:block`. 1024px과 375px
브레이크포인트도 같은 방식으로 arbitrary variant를 쓴다. Tailwind 기본
브레이크포인트(`sm` `md` `lg`)로 **치환하지 않는다** — 값이 달라지면 픽셀이
움직이고 합격 기준이 깨진다.

## 검증

순서대로 전부 통과해야 한다.

```bash
pnpm type-check   # vite build가 타입을 안 보므로 실질적 게이트
pnpm lint
pnpm format:check
pnpm build
pnpm test         # 빌드 결과물을 서빙해 검사한다
```

`pnpm test`가 보는 것:

- `landing.png` / `about.png` **무변화** — 이 스펙의 합격 기준
- 최소화 버튼이 모든 `<details>`를 토글한다 — `TitleBar` 분리가 동작을 바꾸지
  않았는지
- 닫기 버튼이 `/`로 내비게이트한다 — `page.locator('nav button')`이 클래스가 아닌
  구조로 찾으므로 교체에 영향받지 않아야 한다

## 하지 않는 것

- **색 변경** — 리터럴이든 변수든 계산 결과가 달라지는 변경 일체
- **`@theme` 블록 작성** — ②의 일
- **기준선 PNG 재생성** — 위의 합격 기준 참조
- **Tailwind 기본 브레이크포인트로 치환** — 값이 달라진다
- **preflight 도입** — 지금은 끈다. 나중에 켜려면 별건으로 다룬다
- **`resume.json` 구조 변경** — 이력서 내용 추가는 ④
- **`Home.module.css`의 죽은 규칙 이전** — 그냥 사라진다

## 완료 후 CLAUDE.md 갱신

이 작업으로 사실이 아니게 되는 문단들:

1. **"`about.tsx`의 닫기 버튼은 `<button>`이어야 한다"** — 이유가 사라진다.
   `.buttonWrapper button` 엘리먼트 선택자가 없어지므로. 다만 테스트가
   `nav button`으로 찾으니 `<button>`은 유지한다. **제약의 근거가 CSS에서
   테스트로 옮겨간다**는 사실을 다시 쓴다.
2. **"`className={`aboutPage ${styles.main}`}`의 `aboutPage`는 전역 클래스"** —
   `styles.main`이 사라지므로 표현을 고친다. `aboutPage` 자체와
   `.aboutPage *::selection`은 그대로 남는다.
3. **구조 트리의 `*.module.css`** — 없어진다.
4. **기술 부채 1번** ("about.tsx가 183줄 단일 컴포넌트다") — 해소.
5. **새로 추가** — `dangerouslySetInnerHTML` 때문에 `global.css`에 자손 선택자
   하나가 남는다는 사실과 그 이유.

## ②로 넘기는 미해결 항목

- **다크 모드를 켤 것인가.** `palette.theme.css`는 `:root`와 `.dark` 두 벌을
  낸다. 지금 사이트에는 다크 모드가 없다. 켜지 않으면 팔레트의 절반이 죽은 코드가
  되고, 켜면 타이틀바·신호등 같은 하드코딩 색의 다크 대응을 새로 정해야 한다.
- **랜딩 세 글자의 배치.** `ㅊ`을 액센트(`#fa862e`)로 올리기로 했는데, `ㅎ`
  (`#261201`)과 `ㄴ`(`#736356`)을 뉴트럴 스케일의 어느 스톱에 앉힐지는 실제로
  띄워 보고 정한다.
- **타이틀바와 신호등.** CLAUDE.md는 "토큰화 대상이 아니다"라고 적어 두었다.
  macOS UI를 그대로 인용한 것이라 팔레트와 무관하게 유지하는 것이 맞다고 보지만,
  ②에서 한 번 더 확인한다.

## 관련 문서

- [스택 현대화 설계](2026-08-10-stack-modernization-design.md)
- [TanStack Start 이관 설계](2026-08-17-tanstack-start-migration-design.md)
- 팔레트 생성기: `~/Projects/design-system-starter` — `/color-palette`
