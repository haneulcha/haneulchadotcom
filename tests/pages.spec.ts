import { expect, test, type Page } from '@playwright/test';

import { THEME_KEY } from '../src/lib/theme';

// global.css가 Noto Sans KR을 Google Fonts에서 불러온다. 폰트가 자리잡기 전에
// 찍으면 스크린샷이 흔들리므로 로드 완료를 기다린다.
async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

// colorScheme 에뮬레이션이 아니라 localStorage에 저장된 선택을 심는다 —
// 팔레트가 .dark 클래스로 동작하고, 그 클래스는 인라인 스크립트가
// localStorage를 읽어 붙이므로 실제 경로를 지나야 한다.
//
// 이전에는 document.fonts.ready 이후 page.evaluate로 클래스를 직접
// 붙였다. document.fonts.ready는 2~38ms에 풀리는데 하이드레이션의 마운트
// effect는 ~50ms에 도착한다 — 커밋 내비게이션(waitUntil: 'commit')으로
// 재현하면 마운트 effect가 뒤늦게 붙은 클래스를 12/12 벗겨낸다. 'load'
// 경로에서 12/12 살아남은 것은 순전히 load가 effect보다 늦게 발화하는
// 우연 때문이었고, 그 순서를 강제하는 장치는 없었다. addInitScript는
// 페이지의 어떤 스크립트보다도 먼저 실행되므로 이 경쟁이 아예 없다 — 인라인
// 스크립트가 실제로 거치는 경로 그 자체를 탄다.
async function withStoredTheme(page: Page, value: 'light' | 'dark') {
  await page.addInitScript(
    ([key, v]) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        // 저장이 막히면 라이트로 떨어질 뿐이다 — THEME_INIT_SCRIPT와 동일한 대응.
      }
    },
    [THEME_KEY, value],
  );
}

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('about.png', { fullPage: true });
});

test('landing page renders in dark', async ({ page }) => {
  await withStoredTheme(page, 'dark');
  await page.goto('/');
  await waitForFonts(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page).toHaveScreenshot('landing-dark.png', { fullPage: true });
});

test('about page renders in dark', async ({ page }) => {
  await withStoredTheme(page, 'dark');
  await page.goto('/about');
  await waitForFonts(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page).toHaveScreenshot('about-dark.png', { fullPage: true });
});

test('minimize button toggles every details element', async ({ page }) => {
  await page.goto('/about');
  const details = page.locator('details');
  const minimize = page.locator('nav button').nth(1);
  const openStates = () =>
    details.evaluateAll((els) =>
      els.map((el) => (el as HTMLDetailsElement).open),
    );

  expect(await details.count()).toBeGreaterThan(0);
  // 초기 상태: 전부 열려 있다 (<details open>)
  expect(await openStates()).not.toContain(false);

  await minimize.click();
  expect(await openStates()).not.toContain(true);

  await minimize.click();
  expect(await openStates()).not.toContain(false);
});

test('close button navigates back to landing', async ({ page }) => {
  await page.goto('/about');
  await page.locator('nav button').first().click();
  await page.waitForURL('/');
  await expect(page.locator('h1')).toContainText('ㅊ');
});
