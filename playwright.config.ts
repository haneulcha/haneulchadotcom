import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    // 빌드 결과물을 서빙한다. 실행 전에 `pnpm build`가 필요하다.
    // 이 이름은 마이그레이션을 건너 그대로 산다 — Task 5 이후 `pnpm start`가
    // `next start` 대신 nitro 서버를 가리키게 될 뿐이다.
    command: 'pnpm start',
    url: 'http://localhost:3000',
    // 항상 자기 서버를 띄운다. 이미 떠 있는 것을 재사용하면 3000번을 쓰는
    // 무관한 프로세스를 상대로 기준선을 만들어 버릴 수 있다 (실제로 겪었다).
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
