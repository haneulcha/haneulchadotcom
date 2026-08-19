import { expect, test, type Page } from '@playwright/test';

// global.css가 Noto Sans KR을 Google Fonts에서 불러온다. 폰트가 자리잡기 전에
// 찍으면 스크린샷이 흔들리므로 로드 완료를 기다린다.
async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function gotoPoolDeterministic(page: Page, url: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await waitForFonts(page);
  await page.waitForSelector('nav[aria-label="풀에 떠 있는 것들"]');
}

test('pool landing renders', async ({ page }) => {
  await gotoPoolDeterministic(page, '/');
  await expect(page).toHaveScreenshot('landing.png', { fullPage: true });
});

test('about page renders', async ({ page }) => {
  await page.goto('/about');
  await waitForFonts(page);
  await expect(page).toHaveScreenshot('about.png', { fullPage: true });
});

test('float proxies are ordered newest to oldest', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('nav[aria-label="풀에 떠 있는 것들"] a')
    .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  expect(hrefs).toEqual([
    '/p/jecheori',
    '/p/health-defense',
    '/p/pourover',
    '/p/knitt',
    '/p/blog',
    '/p/tistory',
    '/p/galpi',
    '/p/kinderguri',
  ]);
});

test('clicking a float opens its window route', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/p/jecheori"]').click();
  await page.waitForURL('/p/jecheori');
  await expect(page.getByRole('dialog', { name: '제철어리' })).toBeVisible();
});

test('escape closes the window back to the pool', async ({ page }) => {
  await page.goto('/p/jecheori');
  await page.keyboard.press('Escape');
  await page.waitForURL('/');
});

test('window close button navigates back to pool', async ({ page }) => {
  await page.goto('/p/pourover');
  await page.getByRole('dialog').locator('nav button').first().click();
  await page.waitForURL('/');
});

test('list toggle opens and closes the list window', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '목록', exact: true }).click();
  const list = page.getByRole('dialog', { name: '목록으로 보기' });
  await expect(list).toBeVisible();
  await expect(list.locator('a[href^="/p/"]')).toHaveCount(8);
  await list.locator('nav button').first().click();
  await expect(list).not.toBeVisible();
});

test('deck clipboard navigates to about', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '이력서' }).click();
  await page.waitForURL('/about');
});

test('about minimize button toggles every details element', async ({
  page,
}) => {
  await page.goto('/about');
  const details = page.locator('details');
  const minimize = page.locator('nav button').nth(1);
  const openStates = () =>
    details.evaluateAll((els) =>
      els.map((el) => (el as HTMLDetailsElement).open),
    );

  expect(await details.count()).toBeGreaterThan(0);
  expect(await openStates()).not.toContain(false);

  await minimize.click();
  expect(await openStates()).not.toContain(true);

  await minimize.click();
  expect(await openStates()).not.toContain(false);
});

test('about close button navigates back to pool', async ({ page }) => {
  await page.goto('/about');
  await page.locator('nav button').first().click();
  await page.waitForURL('/');
});
