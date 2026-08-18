import { createFileRoute } from '@tanstack/react-router';

// Task 3에서 창 컴포넌트가 들어온다. 지금은 라우트만 존재해야
// FloatProxy의 <Link to="/p/$id">가 타입 검사를 통과한다.
export const Route = createFileRoute('/_pool/p/$id')({
  component: () => null,
});
