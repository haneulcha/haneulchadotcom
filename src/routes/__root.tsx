import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { THEME_INIT_SCRIPT } from '@/lib/theme';
import globalCss from '@/styles/global.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HaneulChaDotCom' },
      {
        name: 'description',
        content:
          'HaneulChaDotCom is a personal website of Haneul Cha dot com. Haneul Cha dot com is a software engineer and a web developer.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: globalCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 첫 페인트 전에 .dark를 결정한다. 프리렌더된 정적 HTML이라 서버가
            사용자 선택을 알 수 없으므로 클라이언트에서 가장 먼저 실행돼야 한다.
            라우터의 headScripts를 쓰지 않는 것은 그쪽이 하이드레이션 후 DOM을
            다시 만지기 때문이다 — 여기서 필요한 건 한 번 실행되고 끝이다. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
