import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  // Next와 동일하게 dev 서버를 3000에 띄운다 (문서·Playwright baseURL이 전제).
  server: { port: 3000 },
  resolve: {
    // tsconfig의 paths와 짝. '@/public'을 '@'보다 먼저 두어야 한다.
    alias: [
      {
        find: '@/public',
        replacement: fileURLToPath(new URL('./public', import.meta.url)),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  plugins: [
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    nitro(),
    tailwindcss(),
    viteReact(),
  ],
});
