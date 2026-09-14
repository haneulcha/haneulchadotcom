import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="flex h-screen min-h-screen flex-col items-center justify-center px-2">
      <main className="flex flex-1 flex-col items-center justify-center py-20">
        <h1 className="m-0 flex gap-x-4 text-center text-[6rem] leading-[1.15] font-bold">
          <Link to="/about" className="text-[#ad1d1d]">
            ㅊ
          </Link>
          <a
            href="https://kicksky.tistory.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#261201]"
          >
            ㅎ
          </a>
          <div className="text-[#736356]">ㄴ</div>
        </h1>
      </main>

      <footer className="flex h-[50px] w-full items-center justify-center">
        <div className="text-[0.8rem] text-[#bfb1a8]">
          &copy; {new Date().getFullYear()} Haneul Cha
        </div>
      </footer>
    </div>
  );
}
