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
