import { expect, test } from '@playwright/test';

// global.css는 __root.tsx에서 `?url`로 로드된다. Tailwind 플러그인이 그
// 경로를 처리하지 못하면 유틸리티가 한 줄도 생성되지 않는다 — 그 경우
// 이 테스트만 실패하고 스크린샷은 멀쩡히 통과해 문제를 놓치게 된다.
test('tailwind utilities reach the page through the ?url stylesheet', async ({
  page,
}) => {
  await page.goto('/');
  const value = await page
    .locator('main')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--tw-smoke'));
  expect(value.trim()).toBe('ok');
});

// 리셋이 @layer base 안에 있는지 스타일시트에서 직접 확인한다. 비레이어로
// 남으면 button { all: unset }이 모든 유틸리티를 이겨 Task 3(신호등)이 죽고,
// .aboutPage *::selection이 selection: 유틸리티를 이겨 선택 하이라이트가
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
