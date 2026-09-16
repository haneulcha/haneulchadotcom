import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    // h-screen 고정 높이 대신 flex-1로 부모(__root.tsx의 flex-col 래퍼)
    // 안에서 자란다 — h-full(퍼센트 높이)은 부모 높이가 flex-grow로
    // 정해질 때 정의되지 않은 것으로 취급돼 auto로 폴백할 수 있어(실측:
    // 랜딩이 중앙 정렬을 잃고 위로 붙었다), 대신 부모를 flex-col로 두고
    // 여기서 flex-1로 자라는 flex-grow 체인을 쓴다. h-screen을 그대로
    // 두면 ColorBar 높이만큼 문서가 100vh를 넘어 스크롤바가 생긴다.
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <h1 className="m-0 flex gap-x-4 text-center text-[6rem] leading-[1.15] font-bold">
          <Link to="/about" className="text-accent-solid">
            ㅊ
          </Link>
          <a
            href="https://kicksky.tistory.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-text-strong"
          >
            ㅎ
          </a>
          <div className="text-neutral-text">ㄴ</div>
        </h1>
      </main>

      <footer className="flex h-[50px] w-full items-center justify-center">
        <div className="text-[0.8rem] text-neutral-solid">
          &copy; {new Date().getFullYear()} Haneul Cha
        </div>
      </footer>
    </div>
  );
}
