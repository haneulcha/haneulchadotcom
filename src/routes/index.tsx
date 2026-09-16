import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    // h-screen 고정 높이 대신 h-full로 부모(__root.tsx의 flex-1 래퍼)를
    // 채운다 — 그 래퍼가 이미 "뷰포트 - ColorBar 높이"만큼만 남겨 두므로,
    // 여기서 다시 100vh를 강제하면 ColorBar만큼 문서가 넘쳐 스크롤바가
    // 생긴다.
    <div className="flex h-full flex-col items-center justify-center px-2">
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
