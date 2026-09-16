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
    // 1989년 옵셋 인쇄 컨트롤 스트립을 본뜬다 — 재단선을 넘어가는 색 패치,
    // 레지스터 마크, 패치마다 하나씩 붙는 틱, 인쇄소 크레딧. `fixed` 칩이
    // 아니라 문서 흐름 안에 앉는 띠라서 __root.tsx의 body가 이 띠를 위한
    // 자리를 flex 컬럼으로 마련해 둔다. 인쇄물은 움직이지 않으므로 호버도
    // 트랜지션 없이 밑줄·아웃라인만 즉시 켠다 — 크기·위치는 그대로다.
    //
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
      // group: 패치·크레딧이 이 <Link> 하나의 :hover에 반응하게 한다 (개별
      // 요소의 hover:가 아니라 띠 전체의 hover). w-full + items-end: 각 행을
      // 오른쪽으로 미는 기준이 "이 요소의 끝"이 아니라 "뷰포트의 끝"이어야
      // 하므로 띠 자체가 body 폭 전체를 차지한다 — 패치 쪽에 margin을 주는
      // 방식은 스크롤바 유무에 따라 어긋난다.
      //
      // pr/pb 32px: 교정지의 컨트롤 스트립도 종이 끝에 닿지는 않는다.
      // 그리퍼 여백과 재단 여유가 남는다. 오른쪽과 아래를 같은 값으로 두어
      // 모서리가 고르게 보이게 한다.
      className="group flex w-full flex-col items-end pt-2 pr-8 pb-8 text-neutral-text-strong"
    >
      <div className="flex items-end gap-1.5">
        {/* 레지스터 마크: 13×13 — 십자선(1px, 두 축 모두 13px 전체) + 그
            교차점에 중심을 맞춘 7×7, 1px 테두리 원. 실제 색이 아니라 인쇄
            정렬 기준을 나타내는 관례라 currentColor만 쓴다. */}
        <span className="relative block h-[13px] w-[13px]" aria-hidden="true">
          <span className="absolute top-[6px] left-0 h-px w-[13px] bg-current" />
          <span className="absolute top-0 left-[6px] h-[13px] w-px bg-current" />
          <span className="absolute top-[3px] left-[3px] h-[7px] w-[7px] rounded-full border border-current" />
        </span>

        {/* 패치 6칸, 19×12, 간격 없이 붙인다 — 재단선을 넘어가는 컨트롤
            스트립처럼 맨 오른쪽 칸이 이 행의(=뷰포트의) 오른쪽 끝에 그대로
            닿는다. */}
        <div className="flex">
          {CELLS.map((cell) => (
            <span
              key={cell.varName}
              onMouseEnter={() => show(cell)}
              style={{ background: `var(${cell.varName})` }}
              className="block h-[12px] w-[19px] group-hover:outline group-hover:outline-1 group-hover:outline-[currentColor]"
            />
          ))}
        </div>
      </div>

      {/* 틱: 패치 6칸 폭(114px)에 맞춰 그 아래 정렬한다 — 레지스터 마크는
          포함하지 않는다. 각 패치의 중심 아래 1×3 세로선 하나씩. */}
      <div className="flex" aria-hidden="true">
        {CELLS.map((cell) => (
          <span key={cell.varName} className="flex w-[19px] justify-center">
            <span className="h-[3px] w-px bg-current opacity-[.55]" />
          </span>
        ))}
      </div>

      <div className="mt-1 font-mono text-[8px] text-right tracking-[.09em] uppercase opacity-[.62] group-hover:underline">
        design-system-starter · a=fa862e n=green-soft
      </div>
    </Link>
  );
}
