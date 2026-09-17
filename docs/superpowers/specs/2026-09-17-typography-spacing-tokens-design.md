# 타이포·간격 토큰 — 설계

2026-09-17

색은 이미 토큰이다 (`palette.theme.css`, design-system-starter 생성물). 타이포와
간격은 아직 아니다 — `text-[6rem]` `my-[0.4rem]` `mx-[0.7rem]` 같은 임의값이
13개 파일에 흩어져 있다. 이 사이클은 그 두 축을 토큰으로 닫는다.

## 정본은 starter 스키마 v1이다

값의 출처는 `~/Projects/design-system-starter`의 `src/schema/{typography,spacing}.ts`다.
그쪽이 이미 이 네 스케일을 갖고 있다:

```
SIZE_SCALE             10 11 12 14 16 18 20 24 28 32 36 48 64      (px)
WEIGHT_SCALE           400 500 600 700
LINE_HEIGHT_SCALE      1.0 1.1 1.2 1.3 1.4 1.5
LETTER_SPACING_VALUES  -0.02em  0  0.05em
SPACING SCALE          2 4 8 12 16 20 24 32 48 64 80 96            (px)
SPACING BASE_ALIASES   xxs4 xs8 sm12 md16 lg24 xl32 xxl48  (+ section 96)
```

현재 사이트 값은 여기 다 들어맞지 않는다 — 96·56·42·30·12.8·8px, 6.4·11.2·13.6·28.8px
같은 값이 스케일 밖이다. 지금 값은 원본 CSS를 픽셀 단위로 옮긴 결과이고
(`2026-09-15-tailwind-migration-design.md`의 목표가 그거였다), 그 충실도는 이번에
**포기한다**. 스케일이 이긴다. 대신 스크린샷 기준선 네 장을 전부 다시 뜬다.

**스케일은 제약으로 따르되 프로필은 이 사이트가 정한다.** 크기·굵기·행간·자간이
각각 위 집합 안에 있어야 한다는 게 규칙이고, 어느 역할이 어느 조합인지는 starter
기본 프로필을 베끼지 않는다 — starter `heading-xl`은 weight 500인데 랜딩 `ㅊㅎㄴ`이
bold인 것은 이 사이트의 판단이다.

## 토큰 파일

새 파일 `src/styles/tokens.theme.css`. `global.css`가 팔레트 바로 다음에 import한다.

```css
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source('..');
@import './palette.theme.css';
@import './tokens.theme.css'; /* ← 새로 */
```

**팔레트와 달리 손으로 쓰는 파일이다.** `.prettierignore`에 올리지 않는다. 파일
머리에 "생성물 아님 · 값의 출처는 starter 스키마 v1"을 명시해 팔레트와 혼동되지
않게 한다. (언젠가 starter에 Tailwind-native exporter가 붙으면 생성물로 승격될 수
있다 — 그래서 토큰 이름을 starter의 `category-size` 규칙에 맞춰 둔다.)

## 강제는 규칙이 아니라 구조로

```css
@theme {
  --spacing: initial; /* mt-4 · pr-6 · gap-1.5 가 컴파일되지 않는다 */
  --text-*: initial; /* text-base · text-2xl 제거 */
  --tracking-*: initial;
  --font-*: initial;
}
```

`--spacing: initial`이 Tailwind의 동적 간격 스케일을 죽이므로 `mt-4`는 **존재하지
않는 클래스**가 된다. 계획 단계에서 Tailwind 4.3.3으로 전부 실측했다 — 살아남는
것과 죽는 것의 경계는 이렇다:

| 죽는다                                            | 산다                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `mt-4` `px-2` `gap-1.5` `top-3` `min-w-20` `pl-7` | 임의값 `pl-[12px]` `h-[13px]` `max-w-[1024px]` `opacity-[.55]`                                      |
| `p-0` `m-0` `inset-0` `size-4`                    | 분수 `top-1/2` `-translate-y-1/2`, static `w-full` `h-px` `z-50` `flex-1` `mx-auto`                 |
| `text-base` `text-2xl`                            | `text-accent-solid` — 색은 `--color-*`에서 오므로 `--text-*: initial`과 무관                        |
| —                                                 | `font-bold` `font-medium` `font-normal` — `--font-weight-*`는 `--font-*: initial`이 건드리지 않는다 |

변형·부정 유틸리티도 그대로 동작한다: `-ml-xl`, `after:mx-sm`, `max-[321px]:py-xxs`. 리뷰가 놓쳐도 화면에서 드러난다. `global.css`의 `@layer base`
회귀를 테스트로 막아 둔 것과 같은 결이다 — 지킬 수 없는 관례는 안 쓴다.

**대가:** `--spacing`은 margin/padding/gap뿐 아니라 치수(`min-w-40`)와 위치(`top-3`)도
먹인다. 그리고 예외 구역도 숫자를 못 쓴다 — TitleBar의 `pl-3`은 `pl-[12px]`로 명시해야
하고, 안 고치면 조용히 패딩이 사라진다. 착수 전 전수 grep으로 숫자 유틸리티를 남김없이
찾는다.

## 타이포 토큰

Tailwind v4 네이티브 형태라 토큰 하나가 네 속성을 싣는다:

```css
--text-heading-xl: 64px;
--text-heading-xl--font-weight: 700;
--text-heading-xl--line-height: 1.1;
--text-heading-xl--letter-spacing: 0;
```

`className="text-heading-xl"` 하나로 끝난다. 지금처럼 `text-[6rem] leading-[1.15]
font-bold` 셋을 나란히 쓰지 않는다.

### 프로필 10개 — 소비자 있는 것만

| 토큰          | 자리                       | 현재            | → 토큰                     |
| ------------- | -------------------------- | --------------- | -------------------------- |
| `heading-xl`  | 랜딩 `ㅊㅎㄴ`              | 96 / 700 / 1.15 | **64** / 700 / **1.1** / 0 |
| `heading-lg`  | `/about` h1 이름           | 42 / 700        | **48** / 700 / 1.1 / 0     |
| `heading-md`  | h2 섹션                    | 30 / 700\*      | **32** / 700 / 1.2 / 0     |
| `heading-sm`  | h3 회사명                  | 24 / 700\*      | 24 / 700 / 1.3 / 0         |
| `heading-xs`  | h4 섹션 제목               | 20 / 700\*      | **18** / 700 / 1.4 / 0     |
| `heading-xxs` | 직무명 `<summary>`         | 18 / 500 / 1.65 | **16** / 500 / **1.4** / 0 |
| `body-md`     | 본문                       | 16 / 400 / 1.5  | 16 / 400 / 1.5 / 0         |
| `body-sm`     | 표 · 기술라벨 · h4 기간    | 14 / 400        | 14 / 400 / 1.5 / 0         |
| `caption-sm`  | 최종 수정 · 랜딩 copyright | 12 / 1.6 · 12.8 | **12** / 400 / **1.4** / 0 |
| `caption-xxs` | ThemeToggle                | 10 / 400        | 10 / 400 / 1.3 / 0         |

\* 브라우저 기본 `<h2>~<h4>`의 bold. `global.css` 리셋은 margin/padding만 지운다.

### 굵기 유틸리티

`--font-weight-*`는 죽이지 않는다 (`--font-*: initial`이 이 네임스페이스를 건드리지
않는다 — 실측). 다만 프로필이 weight를 싣게 되므로 **중복된
`font-bold` · `font-normal` · `font-medium`은 제거한다** (랜딩 h1, `/about` article,
`summary` 등). 남기는 것은 본문 타입 위에 얹는 **강조**뿐이다 — `infoTableTh`,
`techLabel`, `LanguageList`의 라벨. 이 셋은 타입 역할이 아니라 같은 역할 안의
강세라서 프로필로 올리지 않는다.

**이건 정리가 아니라 정확성 문제다.** 프로필은
`font-weight: var(--tw-font-weight, var(--text-heading-xl--font-weight))`로 컴파일된다
— `font-bold`가 `--tw-font-weight`를 세우므로 **클래스 순서와 무관하게 프로필을
이긴다**. 남겨 둔 `font-bold` 하나가 프로필의 weight를 조용히 덮는다. `line-height`도
`var(--tw-leading, …)`로 같은 구조라 `leading-*`이 프로필을 이긴다.

starter의 나머지 프로필(`code` `button` `badge` `nav` `card` `link`, `body-lg`,
`caption-md/xs`)은 **정의하지 않는다**. 소비자가 없다. 죽은 토큰은 시스템이 아니라
목록이다.

### 폰트 4종 — 지금 있는 것에 이름만

```css
--font-sans: 'Noto Sans KR', sans-serif; /* /about 본문 */
--font-system: -apple-system, BlinkMacSystemFont, …; /* html/body, 랜딩 */
--font-chrome:
  HelveticaNeue, 'Helvetica Neue', 'Lucida Grande', …; /* /about 창 프레임 */
--font-mono:
  ui-monospace, SFMono-Regular, Menlo, …; /* ColorBar · ThemeToggle */
```

`global.css`의 `@layer base`에 있는 `html, body`의 폰트 스택도 `var(--font-system)`을
가리키게 바꾼다 — 스택을 두 곳에 두면 갈라진다.

**폰트 교체는 이번 범위가 아니다.** starter의 `--ds-font-sans`(Inter, Pretendard …)를
채택하면 macOS에서 Apple SD Gothic Neo로 떨어져 본문 글꼴이 통째로 바뀐다 — 크기
스냅보다 큰 변화다. 원인과 결과를 분리하려고 이번엔 이름만 붙인다. `--font-mono`는
Tailwind 기본값을 그대로 복사해 고정하는 것이다 (`--font-*: initial`이 기본값을
지우므로 명시가 필요하다).

### 자간

`--tracking-*: initial` 후 starter의 세 값만 정의한다.

```css
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.05em;
```

ThemeToggle의 `tracking-wide`는 Tailwind 기본 0.025em에서 0.05em으로 미세하게 벌어진다.
mono 대문자 라벨이라 의도에 어긋나지 않는다.

### 표의 행 높이는 line-height를 그만둔다

`infoTableTh`의 `leading-[2.5]`와 좁은 화면의 `leading-[2.3]`은 스케일 밖일 뿐 아니라
**행간으로 행 높이를 만드는 편법**이다. 행 높이는 padding이 만들게 한다.

- 기본: th의 `leading-[2.5]` 제거 → `text-body-sm` + `py-xs`(8px). 행 높이 35px → 37px.
  td에도 같은 `py-xs`를 준다 — 지금 td는 base leading이 없어 th가 혼자 행 높이를
  만들고 있다. 둘을 같은 값으로 맞춰야 셀 사이 세로 정렬이 우연에 기대지 않는다.
- ≤320px(`max-[321px]:`): th/td가 block이 되는 구간. `leading-[2.3]` 제거 →
  `py-xxs`(4px). 줄 높이 32.2px → 29px(14×1.5 + 8). td의 기존 `py-0` override는
  이 `py-xxs`로 대체한다 — 그대로 두면 치환이 무효가 된다.

## 간격 토큰

필요한 값을 다 모으니 starter `BASE_ALIASES` + `section`과 거의 일치한다. 새로 만들
별칭은 `none` 하나뿐이다.

```css
--spacing-none: 0px;
--spacing-xxs: 4px;
--spacing-xs: 8px;
--spacing-sm: 12px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
--spacing-section: 96px;
```

`none`은 starter `BASE_ALIASES`에 없다. 넣는 이유는 **`p-0`과 `m-0`도 `--spacing`에
기대서 함께 죽기 때문**이다 (계획 단계에서 실측). 세 자리가 이걸 쓴다 — 랜딩 h1의
`m-0`, `/about` 최종수정의 `m-0`, `LanguageList` ul의 `p-0`(브라우저 기본 들여쓰기를
지운다). `p-[0px]`로 흩는 것보다 별칭 하나가 낫다.

### 전 구역 매핑

◆ = 값이 바뀌는 자리.

| 자리                                             | 현재            | →                                        |
| ------------------------------------------------ | --------------- | ---------------------------------------- |
| 랜딩 `px-2` / `gap-x-4`                          | 8 / 16          | `px-xs` / `gap-x-md`                     |
| 랜딩 `py-20` ◆                                   | 80              | `py-xxl` (48)                            |
| `/about` 창 `px-36` ◆                            | 144             | `px-section` (96)                        |
| `/about` 창 `pt-24`                              | 96              | `pt-section`                             |
| `/about` 창 `pb-32` ◆                            | 128             | `pb-section` (96)                        |
| h1 `mb-8`                                        | 32              | `mb-xl`                                  |
| h2 `mt-10` ◆ / `mb-4`                            | 40 / 16         | `mt-xxl` (48) / `mb-md`                  |
| h2 `-ml-[1.8rem]` ◆                              | 28.8            | `-ml-xl` (32)                            |
| 표 `mt-5` ◆ / `pl-2` / `pr-6`                    | 20 / 8 / 24     | `mt-lg` (24) / `pl-xs` / `pr-lg`         |
| 섹션 `mt-4`                                      | 16              | `mt-md`                                  |
| h4 `my-7` ◆ / `mb-4`                             | 28 / 16         | `mt-lg` (24) / `mb-md`                   |
| 단락 `my-[0.4rem]` ◆                             | 6.4             | `my-xs` (8)                              |
| 기술라벨 `after:mx-[0.7rem]` ◆                   | 11.2            | `after:mx-sm` (12)                       |
| 업무 `ul pl-[0.85rem]` ◆                         | 13.6            | `pl-sm` (12)                             |
| `summary my-[0.35rem]` ◆ / `span ml-[0.35rem]` ◆ | 5.6             | `my-xxs` / `ml-xxs` (4)                  |
| 상세 `ul my-2 mb-4 pl-7` ◆                       | 8 / 16 / 28     | `my-xs mb-md pl-lg` (24)                 |
| 상세 `li mb-[0.4rem]` ◆ / `div ml-2`             | 6.4 / 8         | `mb-xs` (8) / `ml-xs`                    |
| 언어 `ul my-2` / `li mb-2`                       | 8 / 8           | `my-xs` / `mb-xs`                        |
| 언어 `after:mx-[0.65rem]` ◆                      | 10.4            | `after:mx-sm` (12)                       |
| 경력 `h3 mt-2`                                   | 8               | `mt-xs`                                  |
| ColorBar `pt-2 pr-8 pb-8 mt-1`                   | 8 / 32 / 32 / 4 | `pt-xs pr-xl pb-xl mt-xxs` — 값 동일     |
| ThemeToggle `top-3 right-3 px-2 py-1`            | 12 / 12 / 8 / 4 | `top-sm right-sm px-xs py-xxs` — 값 동일 |

넓은 화면에서 가장 눈에 띄는 변화는 **`px-36`(144) → `px-section`(96)** 이다.
`/about` 창의 좌우 여백이 48px씩 줄어든다.

### 치수는 간격 토큰이 아니다

`--spacing: initial`이 죽이는 것 중 표 칼럼 폭은 리듬이 아니라 **측정값**이다.
간격 별칭으로 부르면 거짓말이 되므로 명시적 임의값으로 내린다.

```
min-w-40 → min-w-[160px]   (표 th)
min-w-31 → min-w-[124px]   (좁은 화면 th)
min-w-16 → min-w-[64px]    (≤376px th)
min-w-20 → min-w-[80px]    (LanguageList 라벨)
min-w-2  → min-w-[8px]     (신호등 glyph)
```

랜딩 footer의 `h-[50px]`도 같은 이유로 그대로 둔다.

### 유동값은 손대지 않는다

`my-[6vh]`, `max-[1025px]:px-[10vw]`, `pt-[9vw]`, `pb-[10vw]`. 뷰포트 비례라 애초에
토큰이 될 수 없다.

## 예외 — 토큰이 아니라 인용·보정값

CLAUDE.md가 TitleBar의 macOS 색을 토큰화 대상에서 뺀 것과 같은 논리다. 인용은
시스템이 아니다.

| 자리                          | 남기는 값                                                                                                                           | 이유                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **TitleBar 전체**             | `text-[11pt]`, `leading-[10px]`, `text-[10px]`, `leading-[14px]`, `w-[10px]`, `min-w-[8px]`, `py-[5px]`, `gap-x-[7px]`, `pl-[12px]` | macOS 크롬 인용. 이 픽셀값이 곧 "macOS처럼 보임"이다 |
| **ColorBar 스트립 내부 기하** | `13×13` 마크, `19×12` 패치, `3px` 틱, `gap-[6px]`, `text-[8px]` 라벨, `tracking-[.09em]`                                            | 1989년 옵셋 인쇄 컨트롤 스트립 인용                  |
| **h2 앞 `˙`**                 | `before:text-[56px]`, `before:leading-[28px]`                                                                                       | 장식 글리프의 광학 보정. 타입 역할이 아니다          |
| **h1 `tracking-[6px]`**       | `6px`                                                                                                                               | 이름 표기의 넓은 자간 — 의도된 서명                  |

ColorBar의 **바깥 여백은 예외가 아니다** — `pt-2 pr-8 pb-8 mt-1`이 값 그대로 별칭에
떨어진다. 예외는 스트립 내부 기하로 한정한다.

## 검증

|               |                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| 스크린샷 4장  | **전부 재생성**한다. 의도된 변경이다 — diff를 눈으로 확인한 뒤에만 `--update-snapshots`                   |
| 계약 테스트 ① | 랜딩 `ㅊ`의 computed `font-size`가 `64px` — 타입 프로필이 `?url` 스타일시트를 통해 실제로 페이지에 닿는지 |
| 계약 테스트 ② | 로드된 스타일시트 전체에 문자열 `var(--spacing)`이 **0회** — 숫자 유틸리티 금지의 방어선                  |
| 기존 게이트   | `pnpm type-check` · `pnpm lint` · `pnpm format:check` · `pnpm build`                                      |
| 문서          | CLAUDE.md 「알아둘 것」에 새 파일·강제 기제·예외 목록 추가                                                |

계약 테스트 둘은 `tests/tailwind-setup.spec.ts`에 붙인다 — 스크린샷으로 못 잡는 것을
모아 두는 파일이라는 그 파일의 목적에 맞는다.

**테스트 ②의 형태가 바뀐 이유.** 처음에는 "`mt-4`를 붙인 요소의 `margin-top`이 0px"로
잡았는데, 이건 **거짓 통과**한다. Tailwind는 소스에 없는 클래스를 아예 컴파일하지
않으므로, 누가 `--spacing: initial`을 지워도 `mt-4`를 쓰는 코드가 없는 한 그 클래스는
여전히 존재하지 않고 테스트는 통과한다. 같은 이유로 `--spacing` 변수의 존재를 보는
것도 안 된다 — 미사용 테마 변수는 tree-shake돼 두 상태의 `:root`가 동일하다 (실측).

대신 **컴파일 결과의 지문**을 본다. 숫자 간격 유틸리티는 전부
`calc(var(--spacing) * N)`으로 컴파일된다. 실측: `initial` 없이
`mt-4 px-2 gap-1.5 p-0 m-0 top-3 min-w-20`을 쓰면 `var(--spacing)`이 5회,
`initial`을 넣으면 **0회**. `global.css`의 `@layer base` 검사가 이미 쓰는
`document.styleSheets` 순회로 확인한다.

## 범위 밖

- **폰트 교체.** 이름만 붙이고 체인은 그대로 둔다 (위 「폰트 4종」 참조).
- **ColorBar에 타이포·간격 토큰 그리기.** 띠는 색만 그린다. 타입 스케일과 간격
  리듬을 같은 스트립에 넣는 것은 별개의 디자인 문제다.
- **starter에 Tailwind-native exporter 붙이기.** 이번 사이클이 두 저장소에 걸치면
  안 된다. 이름 규칙을 맞춰 두었으니 나중에 갈아타도 이름이 그대로 맞는다.
- **radius / elevation 토큰화.** `about.tsx`의 창 테두리·그림자와 `rounded-md`가
  남는다. 다음 사이클 후보다.
- **색 리팩터링.** 팔레트는 이미 닫혔다. 시키지 않은 색 작업을 시작하지 않는다.
