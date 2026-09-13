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
