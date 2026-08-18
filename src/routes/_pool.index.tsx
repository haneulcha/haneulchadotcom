import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_pool/')({
  component: () => null, // 창 없음 — 풀만
});
