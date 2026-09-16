import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ColorBar } from '@/components/ColorBar';
import { ThemeToggle } from '@/components/ThemeToggle';
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
            사용자 선택을 알 수 없다. 이 태그는 JSX에서 <HeadContent />보다
            앞에 있지만, React 19가 렌더된 HTML에서는 stylesheet <link>를
            리소스로 취급해 앞으로 끌어올린다 — 실제 순서는 stylesheet,
            script다(빌드 결과물의 about/index.html로 확인). 그래도 안전한
            것은 첫 페인트가 어차피 그 render-blocking stylesheet에 걸려
            있고, 동기 script는 앞선 stylesheet가 로드될 때까지 자체적으로
            대기하기 때문이다. defer나 async를 붙이면 이 대기가 깨져 막으려던
            깜빡임이 되돌아온다. 라우터의 headScripts를 쓰지 않는 것은 그쪽이
            하이드레이션 후 DOM을 다시 만지기 때문이다 — 여기서 필요한 건
            한 번 실행되고 끝이다. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      {/* ColorBar가 fixed 칩에서 문서 흐름 안의 띠로 바뀌면서, 그 뒤에
          붙는 형제 하나만큼 문서가 100vh를 넘어 랜딩에 없던 스크롤바가
          생긴다. body를 min-h-screen flex 컬럼으로 두고 {children}을
          flex-1 래퍼로 감싸 남는 공간을 그 래퍼가 먼저 차지하게 하면,
          ColorBar는 항상 컬럼의 마지막 항목으로 깔끔하게 붙는다.

          래퍼 자신도 flex-col이다 — h-full(퍼센트 높이)은 flex-grow로
          정해지는 부모 높이에 기대면 auto로 폴백해 안 먹는 경우가 있다
          (실측: 랜딩이 세로 중앙 정렬을 잃고 위로 붙었다). 대신 래퍼를
          flex-col로 두고 index.tsx의 랜딩 div가 flex-1로 그 안에서 자라게
          하면, 퍼센트 높이 해석에 기대지 않고 flex-grow 체인만으로 채워진다
          — 랜딩 쪽 나머지 절반은 index.tsx에 있다. */}
      <body className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <ColorBar />
        <ThemeToggle />
        <Scripts />
      </body>
    </html>
  );
}
