import { useEffect, useState } from 'react';

import { resolveDark, THEME_KEY, type ThemeChoice } from '@/lib/theme';

const CYCLE: ThemeChoice[] = ['system', 'light', 'dark'];
const LABEL: Record<ThemeChoice, string> = {
  system: '시스템 ◐',
  light: '라이트 ○',
  dark: '다크 ●',
};

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>('system');

  // 서버는 사용자 선택을 모르므로 'system'으로 렌더하고 마운트 후 바로잡는다.
  //
  // lazy initializer(useState(read))로 바꿔봤지만 실측 결과 실제로 깨진다:
  // 하이드레이션의 첫 렌더에서 곧바로 다른 값이 나오면 React는 그 불일치를
  // suppressHydrationWarning으로 조용히 넘기고 SSR이 뱉은 DOM(attribute
  // 포함, span 안쪽만이 아니라 aria-label까지)을 그대로 둔 채 다음 렌더를
  // 기다린다 — 이후 실제로 다시 렌더되는 계기(다음 클릭 등)가 오기 전까지
  // 라벨이 "시스템"에 영원히 박제된다(Playwright로 직접 확인: fiber의
  // memoizedProps는 올바른데 실제 DOM 속성은 안 바뀜). 마운트 후 effect로
  // 한 번 더 실제 렌더를 일으켜야 DOM이 따라온다 — 그래서 react-hooks/
  // set-state-in-effect를 여기서만 억제한다: 이 규칙이 막으려는 캐스케이드
  // 렌더링 문제가 아니라, SSR과 값이 다를 수 있는 브라우저 전용 소스(로컬
  // 스토리지)를 마운트 후 정확히 한 번 동기화하는 문서화된 패턴이다.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setChoice(read()), []);

  // 선택이 바뀌면 클래스와 저장소를 맞춘다. 시스템 모드일 때는 OS 설정
  // 변화도 따라가야 하므로 미디어 쿼리를 구독한다 — 새로고침 없이 바뀐다.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        resolveDark(choice, mq.matches),
      );
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [choice]);

  const next = () => {
    const n = CYCLE[(CYCLE.indexOf(choice) + 1) % CYCLE.length];
    setChoice(n);
    try {
      if (n === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, n);
    } catch {
      // 저장이 막혀도 이번 세션은 동작한다.
    }
  };

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`테마: ${LABEL[choice]} — 눌러서 전환`}
      // 자기 표면을 갖는다. 페이지 바탕 위에도, 좁은 화면에서 타이틀바
      // 그라디언트 위에 얹혔을 때도 읽혀야 하므로 투명 배경은 안 된다.
      // global.css의 `button { all: unset }` 리셋이 기본 포커스 링까지
      // 지우므로, 키보드 포커스에서 outline을 명시적으로 되살린다.
      className="fixed top-3 right-3 z-50 rounded border border-neutral-border bg-neutral-subtle-bg px-2 py-1 font-mono text-[10px] tracking-wide text-neutral-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-solid"
    >
      <span suppressHydrationWarning>{LABEL[choice]}</span>
    </button>
  );
}
