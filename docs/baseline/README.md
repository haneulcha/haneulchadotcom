# 마이그레이션 검증용 베이스라인 스냅숏

TanStack Start 마이그레이션([2026-08-17 설계](../superpowers/specs/2026-08-17-tanstack-start-migration-design.md))
검증 1단계용 자료다.

## 이게 뭔가

`next/`의 두 파일은 **마이그레이션 착수 전** Next.js 16.3.0 빌드가 생성한 정적 HTML이다.

| 파일               | 출처                        | 라우트   |
| ------------------ | --------------------------- | -------- |
| `next/index.html`  | `.next/server/app/index.html` | `/`      |
| `next/about.html`  | `.next/server/app/about.html` | `/about` |

두 라우트 모두 Next에서 `○ (Static)`으로 프리렌더됐다. 즉 TSS 프리렌더 결과와 같은 성격의
산출물이므로 직접 비교가 성립한다.

**Next을 제거한 뒤에는 다시 만들 수 없다.** 그래서 착수 전에 떠서 커밋해 뒀다.

## 쓰는 법

TSS 프리렌더 결과와 DOM 구조를 비교한다. 비교 시 정규화할 것:

- 해시된 CSS Modules 클래스명 (`Home_title__aB3xY` 같은 것) — 양쪽 해시 규칙이 다르다
- 프레임워크 런타임 `<script>` 태그 — Next와 TSS가 각자 다른 것을 주입한다
- 자산 경로 해시

## 예상되는 **의도된** 차이

아래는 회귀가 아니다. 스펙 범위에 포함된 변경의 결과다.

- **`<td>` 14개 → `<td>` 7개 + `<th scope="row">` 7개.** 접근성 수정(`<td scope>`는 유효하지
  않다)의 결과다. `<tr>` 7개 × 2셀 구조에서 첫 셀이 `<th>`가 된다.
- `<a>`/`<button>` 요소 자체는 **바뀌면 안 된다.** 특히 타이틀바 신호등 3개는 `<button>`으로
  남아야 한다 (`About.module.css:59`의 `.buttonWrapper button` 선택자 때문).

그 외의 구조적 차이는 전부 조사 대상이다.

## 정리

마이그레이션이 끝나고 검증을 통과하면 `docs/baseline/` 전체를 지운다. 임시 자료다.
