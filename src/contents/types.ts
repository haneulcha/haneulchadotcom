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

// Resume 안에 인라인으로 중첩된 항목 타입들에 이름을 붙인다. 컴포넌트가
// props 타입으로 쓴다. 인덱스 접근으로 파생하므로 resume.json의 모양이
// 바뀌면 여기도 자동으로 따라온다.
export type Experience = Resume['experience'][number];
export type ExperienceSection = Experience['section'][number];
export type Portfolio = Resume['portfolio'][number];
export type Language = Resume['language'][number];
