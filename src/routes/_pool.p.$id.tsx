import { createFileRoute, redirect } from '@tanstack/react-router';

import { FloatWindow } from '@/components/pool/FloatWindow';
import floats from '@/contents/pool';

export const Route = createFileRoute('/_pool/p/$id')({
  loader: ({ params }) => {
    const float = floats.find((f) => f.id === params.id);
    if (!float) throw redirect({ to: '/' }); // 스펙: 없는 id는 풀로 안내
    return float;
  },
  head: (ctx) => ({
    meta: [
      { title: `${ctx.loaderData?.title ?? '풀'} — 차하늘` },
      { name: 'description', content: ctx.loaderData?.subtitle ?? '' },
    ],
  }),
  component: FloatWindowRoute,
});

function FloatWindowRoute() {
  const float = Route.useLoaderData();
  return <FloatWindow float={float} />;
}
