export type FloatKind = 'made' | 'written' | 'seen';
export type FloatStatus = 'live' | 'archived' | 'wip';

export type PoolFloat = {
  id: string; //       /p/$id의 라우트 파라미터
  kind: FloatKind; //  모양 결정 (튜브/킥판/공)
  date: string; //     'YYYY-MM' 또는 'YYYY-MM-DD' — 세로 위치 결정 (√ 매핑)
  x: number; //        0..1 가로, 구성용 수동값
  title: string;
  subtitle: string;
  desc?: string;
  symbol: string; //   symbols.tsx의 키
  status: FloatStatus;
  tech?: string[];
  links: { label: string; href: string }[];
  thumb?: string; //   public/pool/ 아래 경로. 초기 데이터는 생략 (판단 필요 J8)
};

export type Resume = {
  title: string;
  lastUpdatedAt: string;
  introduction: string;
  infoLink: { id: string; href: string; desc: string }[];
  experience: {
    company: string;
    period: string;
    position: string;
    tech: string[];
    section: {
      title: string;
      period: string;
      desc: string;
      tech: string[];
      // id는 일부 항목에만 있다 (resume.json의 실제 구조)
      jobs: { id?: number; summary: string; detail: string[] }[];
    }[];
  }[];
  portfolio: {
    title: string;
    url: string;
    period: string;
    desc: string;
    tech: string[];
  }[];
  language: { type: string; level: string }[];
};
