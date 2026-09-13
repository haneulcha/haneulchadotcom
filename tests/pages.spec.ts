import { expect, test, type Page } from '@playwright/test';

// global.css가 Noto Sans KR을 Google Fonts에서 불러온다. 폰트가 자리잡기 전에
// 찍으면 스크린샷이 흔들리므로 로드 완료를 기다린다.
async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
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
