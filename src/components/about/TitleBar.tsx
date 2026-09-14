interface TitleBarProps {
  /** 닫기(빨강) 버튼 — 랜딩으로 내비게이트한다. */
  onClose: () => void;
  /** 최소화(노랑) 버튼 — 모든 <details>를 한꺼번에 여닫는다. */
  onToggleAll: () => void;
}

// 신호등은 macOS UI를 그대로 인용한 것이라 색이 하드코딩돼 있다.
// 팔레트 토큰화 대상이 아니다 (CLAUDE.md 참조).
const light = 'w-[10px] leading-[10px] rounded-full';
const glyph = 'inline-block align-top min-w-2 text-[10px] leading-[14px]';

export function TitleBar({ onClose, onToggleAll }: TitleBarProps) {
  return (
    <div className="relative cursor-default rounded-t-md border-t border-b border-t-[#f3f1f3] border-b-[#b1aeb1] bg-linear-to-r/srgb from-[#ebebeb] to-[#d5d5d5] py-[5px] text-center text-[11pt] text-[#4d494d] select-none">
      <nav className="absolute top-1/2 flex -translate-y-1/2 gap-x-[7px] pl-3">
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
