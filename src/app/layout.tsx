import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/styles/global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://haneulcha.com'),
  title: 'HaneulChaDotCom',
  description:
    'HaneulChaDotCom is a personal website of Haneul Cha dot com. Haneul Cha dot com is a software engineer and a web developer.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
