import { createFileRoute, Outlet } from '@tanstack/react-router';

import { PoolShell } from '@/components/pool/PoolShell';

export const Route = createFileRoute('/_pool')({
  component: PoolLayout,
});

function PoolLayout() {
  return (
    <PoolShell>
      <Outlet />
    </PoolShell>
  );
}
