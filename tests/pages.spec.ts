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

// 저장된 선택이 아니라 다크 OS를 에뮬레이션한다. colorScheme은 컨텍스트
// 생성 시점에 적용되므로 페이지의 어떤 스크립트보다도 먼저다 — 하이드레이션과
// 경쟁할 여지가 없다. localStorage는 비워 두므로 인라인 스크립트가
// matchMedia('(prefers-color-scheme: dark)')를 읽어 .dark를 붙이는, 팔레트가
// 실제로 의존하는 그 경로를 그대로 탄다. 선택을 저장하지 않았으니 토글은
// system 상태로 남아 "시스템 ◐"를 그린다 — 커밋된 기준선이 담고 있는 바로
// 그 상태다. (이전에는 localStorage.theme = 'dark'를 심었는데, 그러면 토글이
// "다크 ●"로 바뀌어 기준선과 어긋난다.)
test.describe('dark OS', () => {
  test.use({ colorScheme: 'dark' });

  test('landing page renders in dark', async ({ page }) => {
    await page.goto('/');
    await waitForFonts(page);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page).toHaveScreenshot('landing-dark.png', {
      fullPage: true,
    });
  });

  test('about page renders in dark', async ({ page }) => {
    await page.goto('/about');
    await waitForFonts(page);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page).toHaveScreenshot('about-dark.png', { fullPage: true });
  });
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
