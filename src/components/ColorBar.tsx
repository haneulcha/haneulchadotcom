import { Link } from '@tanstack/react-router';
import { useState } from 'react';

// 인쇄 컨트롤 스트립은 그 인쇄물이 실제로 쓴 잉크를 찍는다. 여기도 같다 —
// 이 화면이 소비하는 역할만 넣는다. hex를 박지 않고 var()를 그대로 그리므로
// 띠는 팔레트의 그림이 아니라 팔레트 그 자체다. 테마 전환에 JS가 필요 없고,
// 팔레트를 다시 뽑아도 띠가 자동으로 맞는다.
const CELLS = [
  { label: '여백', varName: '--color-neutral-subtle-bg' },
  { label: '테두리', varName: '--color-neutral-border' },
  { label: '본문', varName: '--color-neutral-text-strong' },
  { label: '링크', varName: '--color-accent-text' },
  { label: '솔리드', varName: '--color-accent-solid' },
  { label: '글자', varName: '--color-accent-on-solid' },
] as const;

export function ColorBar() {
  const [read, setRead] = useState<string | null>(null);

  const show = (cell: (typeof CELLS)[number]) => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(cell.varName)
      .trim();
    setRead(`${cell.label} ${v}`);
  };

  return (
    // 평범한 <a>가 아니라 <Link>다. 랜딩의 'ㅊ'과 닫기 버튼이 이미 라우터
    // 내비게이션을 쓰므로 띠만 전체 페이지를 리로드하면 동작이 갈린다.
    // 라우터가 해시 스크롤까지 처리한다.
    <Link
      to="/about"
      hash="design-system"
      aria-label="이 페이지가 쓰는 색 토큰 — 이력서의 디자인 시스템 항목으로"
      title={read ?? '이 페이지가 쓰는 색 토큰'}
      onMouseLeave={() => setRead(null)}
      className="fixed right-3 bottom-3 z-50 flex overflow-hidden rounded-sm shadow-[0_0_0_1px_rgba(128,128,128,0.35)]"
    >
      {CELLS.map((cell) => (
        <span
          key={cell.varName}
          onMouseEnter={() => show(cell)}
          style={{ background: `var(${cell.varName})` }}
          className="block h-[13px] w-[17px] transition-[height] duration-100 hover:h-[19px]"
        />
      ))}
    </Link>
  );
}
