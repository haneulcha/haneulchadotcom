interface TitleBarProps {
  /** 닫기(빨강) 버튼 — 랜딩으로 내비게이트한다. */
  onClose: () => void;
  /** 최소화(노랑) 버튼 — 모든 <details>를 한꺼번에 여닫는다. */
  onToggleAll: () => void;
}

// 신호등은 macOS UI를 그대로 인용한 것이라 색이 하드코딩돼 있다.
// 팔레트 토큰화 대상이 아니다 (CLAUDE.md 참조).
//
// `rounded-full`은 원본의 `border-radius: 50%`보다 훨씬 큰 반지름 값을 내는데,
// 브라우저가 이를 `min(width, height) / 2`로 clamp하기 때문에 지금은 결과가
// 같다 — 이는 버튼이 지금 정사각형(12×12px, glyph `<strong>`이 비어 있어 높이가
// line-height + border로만 정해짐)이라서 성립하는 우연이다. glyph에 내용이 생겨
// 버튼의 가로세로 비율이 달라지면 `rounded-full`과 `border-radius: 50%`는 서로
// 다른 모양을 만든다.
const light = 'w-[10px] leading-[10px] rounded-full';
const glyph = 'inline-block align-top min-w-[8px] text-[10px] leading-[14px]';

export function TitleBar({ onClose, onToggleAll }: TitleBarProps) {
  return (
    <div className="relative cursor-default rounded-t-md border-t border-b border-t-[#f3f1f3] border-b-[#b1aeb1] bg-linear-to-r/srgb from-[#ebebeb] to-[#d5d5d5] py-[5px] text-center text-[11pt] text-[#4d494d] select-none dark:border-t-[#48484a] dark:border-b-[#1c1c1e] dark:from-[#3a3a3c] dark:to-[#2c2c2e] dark:text-[#a1a1a6]">
      <nav className="absolute top-1/2 flex -translate-y-1/2 gap-x-[7px] pl-[12px]">
        <button
          className={`${light} border border-[#e14640] bg-[#ff6057] hover:border-[#b03537] hover:bg-[#c14645]`}
          onClick={onClose}
        >
          <strong className={glyph}></strong>
        </button>

        <button
          className={`${light} border border-[#dfa123] bg-[#ffbd2e] hover:border-[#af7c33] hover:bg-[#c08e38]`}
          onClick={onToggleAll}
        >
          <strong className={glyph}></strong>
        </button>

        <button
          className={`${light} border border-[#1dad2b] bg-[#27c93f] hover:border-[#128435] hover:bg-[#029740]`}
        >
          <strong className={glyph}></strong>
        </button>
      </nav>
      이력서
    </div>
  );
}
