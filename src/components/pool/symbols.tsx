import type { ReactNode } from 'react';

// 판단 필요 (J2): 사이트가 동작하기 위한 라인 아이콘 플레이스홀더.
// 최종 아트워크 교체는 사람/Fable 몫.
const paths: Record<string, ReactNode> = {
  fruit: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 7c1-3 4-4 4-4" />
    </>
  ),
  dripper: <path d="M5 5h14l-5 8v6h-4v-6z" />,
  notebook: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />,
  yarn: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12c5-2 11-2 16 0M6 7c4 3 8 7 12 10" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l2-6L16 4l4 4L10 18z" />
      <line x1="14" y1="6" x2="18" y2="10" />
    </>
  ),
  book: <path d="M4 5h7v14H4zM13 5h7v14h-7z" />,
  building: (
    <>
      <rect x="5" y="8" width="14" height="12" />
      <path d="M5 8l7-5 7 5" />
      <rect x="10" y="14" width="4" height="6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </>
  ),
};

export function FloatSymbol({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
