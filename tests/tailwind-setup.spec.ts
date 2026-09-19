import { expect, test } from '@playwright/test';

test('tailwind utilities reach the page through the ?url stylesheet', async ({
  page,
}) => {
  await page.goto('/');
  // 랜딩의 'ㅊ'은 이제 text-accent-solid 유틸리티(팔레트의 --color-accent-500,
  // #fa862e)로만 칠해진다. 유틸리티가 안 오면 상속색이 나오므로 이 단언이 깨진다.
  const color = await page
    .locator('h1 a')
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(250, 134, 46)');
});

// 리셋이 @layer base 안에 있는지 스타일시트에서 직접 확인한다. 비레이어로
// 남으면 button { all: unset }이 모든 유틸리티를 이겨 Task 3(신호등)이 죽고,
// @layer base의 전역 ::selection이 selection: 유틸리티를 이겨 선택 하이라이트가
// 조용히 바뀐다 — 후자는 스크린샷에 안 잡히므로 여기서 잡아야 한다.
//
// 클래스를 심어 간접 확인하지 않는 이유: 소스에 없는 클래스는 Tailwind가
// 생성하지 않아 렌더에 쓰이지 않는 프로브 상수를 코드에 남겨야 한다.
test('the global reset lives inside @layer base', async ({ page }) => {
  await page.goto('/');
  const found = await page.evaluate(() => {
    const walk = (rules: CSSRuleList, insideBase: boolean): boolean => {
      for (const rule of Array.from(rules)) {
        const isBaseLayer =
          rule instanceof CSSLayerBlockRule && rule.name === 'base';
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested && walk(nested, insideBase || isBaseLayer)) return true;
        if (
          insideBase &&
          rule instanceof CSSStyleRule &&
          rule.selectorText === 'button' &&
          rule.style.getPropertyValue('cursor') === 'pointer'
        ) {
          return true;
        }
      }
      return false;
    };
    return Array.from(document.styleSheets).some((sheet) => {
      try {
        return walk(sheet.cssRules, false);
      } catch {
        return false; // 교차 출처 시트는 cssRules 접근에서 던진다
      }
    });
  });
  expect(found).toBe(true);
});

// 타입 프로필이 ?url 스타일시트를 통해 실제로 페이지에 닿는지 본다. 크기뿐 아니라
// 굵기·행간까지 확인하는 이유: 프로필은 셋을 한 토큰에 싣는데, 호출부에 font-bold나
// leading-*이 남아 있으면 --tw-font-weight/--tw-leading이 서서 클래스 순서와 무관하게
// 프로필을 이긴다. 크기만 보면 그 덮어쓰기를 놓친다.
test('the landing hero renders at the heading-xl profile', async ({ page }) => {
  await page.goto('/');
  const type = await page
    .locator('h1')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
      };
    });
  // 64px × 1.1 = 70.4px
  expect(type).toEqual({
    fontSize: '64px',
    fontWeight: '700',
    lineHeight: '70.4px',
  });
});

// 숫자 간격 유틸리티가 봉인됐는지 컴파일 결과의 지문으로 확인한다. mt-4·p-0 같은
// 유틸리티는 전부 calc(var(--spacing) * N)으로 컴파일되므로, 봉인이 살아 있으면
// 이 문자열이 스타일시트 어디에도 안 나온다. (이름 별칭은 var(--spacing-md)를
// 쓰므로 여기 안 걸린다 — 봉인되는 것은 접미사 없는 --spacing 하나다.)
//
// 변수의 존재를 보거나 클래스를 심어 확인하지 않는 이유: Tailwind는 소스에 없는
// 클래스를 컴파일하지 않고 미사용 테마 변수는 tree-shake한다. 그래서 두 방법 다
// 봉인이 풀린 상태에서도 통과해 버린다 — 거짓 방어선이 된다.
//
// 이 테스트가 잡는 것은 "봉인이 풀렸고 누가 숫자 유틸리티를 다시 썼다"는 짝이다.
// 봉인이 살아 있는 채로 누가 mt-4를 쓰면 클래스가 조용히 없을 뿐이라 여기 안
// 걸린다 — 그건 스크린샷이 잡는다.
test('the numeric spacing scale stays sealed', async ({ page }) => {
  await page.goto('/about');
  const hits = await page.evaluate(() => {
    const count = (rules: CSSRuleList): number => {
      let n = 0;
      for (const rule of Array.from(rules)) {
        const nested = (rule as CSSGroupingRule).cssRules;
        if (nested) n += count(nested);
        if (
          rule instanceof CSSStyleRule &&
          rule.cssText.includes('var(--spacing)')
        ) {
          n += 1;
        }
      }
      return n;
    };
    return Array.from(document.styleSheets).reduce((n, sheet) => {
      try {
        return n + count(sheet.cssRules);
      } catch {
        return n; // 교차 출처 시트는 cssRules 접근에서 던진다
      }
    }, 0);
  });
  expect(hits).toBe(0);
});
