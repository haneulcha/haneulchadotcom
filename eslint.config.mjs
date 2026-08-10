import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

/**
 * Prettier is not run as an ESLint rule here. `eslint-config-prettier` only
 * turns off the rules that would fight with it; formatting itself is
 * `pnpm format` and the lint-staged hook.
 */
const config = [
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;
