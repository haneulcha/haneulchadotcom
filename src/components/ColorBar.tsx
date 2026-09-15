import { Link } from '@tanstack/react-router';
import { useState } from 'react';

// 인쇄 컨트롤 스트립은 그 인쇄물이 실제로 쓴 잉크를 찍는다. 여기도 같다 —
// 이 화면이 소비하는 역할만 넣는다. hex를 박지 않고 var()를 그대로 그리므로
// 띠는 팔레트의 그림이 아니라 팔레트 그 자체다. 테마 전환에 JS가 필요 없고,
// 팔레트를 다시 뽑아도 띠가 자동으로 맞는다.
const CELLS = [
  // '여백'(landing 배경)이 아니라 '표면'이다 — 랜딩의 바탕색은 아직
  // global.css의 하드코딩된 body 배경(rgba(170,183,191,0.2) / #1c1e1c)이고
  // 토큰화 대상이 아니다. 이 변수가 실제로 그리는 건 /about 창 안쪽뿐이다.
  { label: '표면', varName: '--color-neutral-subtle-bg' },
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
    // 라우터가 해시 스크롤까지 처리한다 — 단, 그건 실제 내비게이션이 일어날
    // 때뿐이다. 이미 /about에 있을 때 같은 경로·같은 해시로 다시 누르면
    // 라우터는 이동으로 안 치고 아무것도 하지 않는다 — 스크롤을 벗어난
    // 뒤 다시 누르면 화면이 그대로다. onClick으로 대상이 이미 문서에 있으면
    // 직접 스크롤한다; 없으면(랜딩에서 누른 경우) <Link>의 라우팅에 맡긴다.
    <Link
      to="/about"
      hash="design-system"
      aria-label="이 페이지가 쓰는 색 토큰 — 이력서의 디자인 시스템 항목으로"
      title={read ?? '이 페이지가 쓰는 색 토큰'}
      onMouseLeave={() => setRead(null)}
      onClick={() => {
        document.getElementById('design-system')?.scrollIntoView();
      }}
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
